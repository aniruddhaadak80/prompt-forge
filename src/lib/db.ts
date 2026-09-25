import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import { compileArtifact } from "./artifact";
import { sealEvent } from "./canonical";
import { analyzePrompt } from "./engine";
import { seedBuilds, sourceCatalog } from "./seed";
import type { AuditEvent, Build, BuildKind, CreateBuildInput, EngineFactor, UpdateBuildInput } from "./types";

const schemaSql = `
create table if not exists prompt_forge_builds (
  id text primary key,
  title text not null,
  prompt text not null,
  kind text not null,
  status text not null default 'published',
  source_ids jsonb not null default '[]'::jsonb,
  artifact_code text not null,
  preview_mode text not null default 'iframe',
  score integer not null default 0,
  recommendation text not null default '',
  factors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  prev_seal text not null default '',
  seal text not null,
  owner_scope text not null
);
create index if not exists prompt_forge_builds_owner_updated_idx on prompt_forge_builds(owner_scope, updated_at desc);
create table if not exists prompt_forge_audit_events (
  id text primary key,
  build_id text not null references prompt_forge_builds(id),
  action text not null,
  payload jsonb not null,
  previous_seal text not null,
  seal text not null,
  created_at timestamptz not null default now(),
  sequence bigserial not null
);
create index if not exists prompt_forge_audit_events_build_sequence_idx on prompt_forge_audit_events(build_id, sequence);
`;

type BuildRow = {
  id: string;
  title: string;
  prompt: string;
  kind: BuildKind;
  status: "published" | "retired";
  source_ids: string[] | string;
  artifact_code: string;
  preview_mode: "iframe";
  score: number;
  recommendation: string;
  factors: EngineFactor[] | string;
  created_at: string | Date;
  updated_at: string | Date;
  version: number;
  prev_seal: string;
  seal: string;
  owner_scope: string;
};

type EventRow = {
  id: string;
  build_id: string;
  action: AuditEvent["action"];
  payload: Record<string, unknown> | string;
  previous_seal: string;
  seal: string;
  created_at: string | Date;
  sequence: number | string;
};

type MemoryState = {
  builds: Map<string, Build>;
  events: Map<string, AuditEvent[]>;
  seeded: boolean;
};

type GlobalWithMemory = typeof globalThis & { __promptForgeMemory?: MemoryState; __promptForgeDatabaseReady?: boolean };

export class RepositoryError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "repository_error") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function getMemory(): MemoryState {
  const root = globalThis as GlobalWithMemory;
  if (!root.__promptForgeMemory) {
    root.__promptForgeMemory = { builds: new Map(), events: new Map(), seeded: false };
  }
  const state = root.__promptForgeMemory;
  if (!state.seeded) {
    for (const build of seedBuilds) {
      state.builds.set(build.id, structuredClone(build));
      const payload = buildPayload(build);
      state.events.set(build.id, [{
        id: `seed-event-${build.id}`,
        buildId: build.id,
        action: "create",
        payload,
        previousSeal: "",
        seal: build.seal,
        createdAt: build.createdAt,
        sequence: 1,
      }]);
    }
    state.seeded = true;
  }
  return state;
}

function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

type SqlClient = ReturnType<typeof neon<false, false>>;

function getSql(): SqlClient | null {
  return process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
}

async function ensureDatabase(): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  const root = globalThis as GlobalWithMemory;
  if (root.__promptForgeDatabaseReady) return;
  const schemaStatements = schemaSql.split(";").map((statement) => statement.trim()).filter(Boolean);
  await sql.transaction(schemaStatements.map((statement) => sql.query(statement)));
  const countRows = (await sql.query("select count(*)::int as build_count from prompt_forge_builds")) as unknown as Array<{ build_count: number }>;
  if (Number(countRows[0]?.build_count ?? 0) === 0) {
    const queries = seedBuilds.flatMap((build) => {
      const payload = buildPayload(build);
      const event: AuditEvent = {
        id: `seed-event-${build.id}`,
        buildId: build.id,
        action: "create",
        payload,
        previousSeal: "",
        seal: build.seal,
        createdAt: build.createdAt,
        sequence: 1,
      };
      return [
        sql.query(
          `insert into prompt_forge_builds (id,title,prompt,kind,status,source_ids,artifact_code,preview_mode,score,recommendation,factors,created_at,updated_at,version,prev_seal,seal,owner_scope) values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,$16,$17) on conflict (id) do nothing`,
          buildInsertParams(build),
        ),
        sql.query(
          `insert into prompt_forge_audit_events (id,build_id,action,payload,previous_seal,seal,created_at) values ($1,$2,$3,$4::jsonb,$5,$6,$7) on conflict (id) do nothing`,
          eventInsertParams(event),
        ),
      ];
    });
    await sql.transaction(queries);
  }
  root.__promptForgeDatabaseReady = true;
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function parseFactors(value: unknown): EngineFactor[] {
  if (Array.isArray(value)) return value as EngineFactor[];
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed as EngineFactor[] : [];
  } catch {
    return [];
  }
}

function parsePayload(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function mapBuild(row: BuildRow): Build {
  return {
    id: row.id,
    title: row.title,
    prompt: row.prompt,
    kind: row.kind,
    status: row.status,
    sourceIds: parseStringArray(row.source_ids),
    artifactCode: row.artifact_code,
    previewMode: row.preview_mode,
    score: Number(row.score),
    recommendation: row.recommendation,
    factors: parseFactors(row.factors),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    version: Number(row.version),
    prevSeal: row.prev_seal,
    seal: row.seal,
    ownerScope: row.owner_scope,
  };
}

function mapEvent(row: EventRow): AuditEvent {
  return {
    id: row.id,
    buildId: row.build_id,
    action: row.action,
    payload: parsePayload(row.payload),
    previousSeal: row.previous_seal,
    seal: row.seal,
    createdAt: new Date(row.created_at).toISOString(),
    sequence: Number(row.sequence),
  };
}

function buildPayload(build: Build): Record<string, unknown> {
  return {
    id: build.id,
    title: build.title,
    prompt: build.prompt,
    kind: build.kind,
    sourceIds: build.sourceIds,
    score: build.score,
    factors: build.factors,
  };
}

function buildInsertParams(build: Build): unknown[] {
  return [
    build.id,
    build.title,
    build.prompt,
    build.kind,
    build.status,
    JSON.stringify(build.sourceIds),
    build.artifactCode,
    build.previewMode,
    build.score,
    build.recommendation,
    JSON.stringify(build.factors),
    build.createdAt,
    build.updatedAt,
    build.version,
    build.prevSeal,
    build.seal,
    build.ownerScope,
  ];
}

function eventInsertParams(event: AuditEvent): unknown[] {
  return [event.id, event.buildId, event.action, JSON.stringify(event.payload), event.previousSeal, event.seal, event.createdAt];
}

async function insertBuildRow(sql: SqlClient, build: Build, event: AuditEvent): Promise<void> {
  await sql.transaction([
    sql.query(
      `insert into prompt_forge_builds (id,title,prompt,kind,status,source_ids,artifact_code,preview_mode,score,recommendation,factors,created_at,updated_at,version,prev_seal,seal,owner_scope) values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,$16,$17)`,
      buildInsertParams(build),
    ),
    sql.query(
      `insert into prompt_forge_audit_events (id,build_id,action,payload,previous_seal,seal,created_at) values ($1,$2,$3,$4::jsonb,$5,$6,$7)`,
      eventInsertParams(event),
    ),
  ]);
}

async function insertUpdateTransaction(sql: SqlClient, build: Build, event: AuditEvent): Promise<void> {
  await sql.transaction([
    sql.query(
      `update prompt_forge_builds set title=$2,prompt=$3,kind=$4,status=$5,source_ids=$6::jsonb,artifact_code=$7,preview_mode=$8,score=$9,recommendation=$10,factors=$11::jsonb,updated_at=$12,version=$13,prev_seal=$14,seal=$15 where id=$1 and (owner_scope=$16 or owner_scope='public-seed')`,
      [build.id, build.title, build.prompt, build.kind, build.status, JSON.stringify(build.sourceIds), build.artifactCode, build.previewMode, build.score, build.recommendation, JSON.stringify(build.factors), build.updatedAt, build.version, build.prevSeal, build.seal, build.ownerScope],
    ),
    sql.query(
      `insert into prompt_forge_audit_events (id,build_id,action,payload,previous_seal,seal,created_at) values ($1,$2,$3,$4::jsonb,$5,$6,$7)`,
      eventInsertParams(event),
    ),
  ]);
}

export function repositoryMode(): "neon" | "memory" {
  return hasDatabase() ? "neon" : "memory";
}

export async function listBuilds(ownerScope: string, includeRetired = false): Promise<Build[]> {
  await ensureDatabase();
  const sql = getSql();
  if (!sql) {
    const state = getMemory();
    return [...state.builds.values()]
      .filter((build) => build.ownerScope === "public-seed" || build.ownerScope === ownerScope)
      .filter((build) => includeRetired || build.status === "published")
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }
  const rows = (await sql.query(
    `select id,title,prompt,kind,status,source_ids,artifact_code,preview_mode,score,recommendation,factors,created_at,updated_at,version,prev_seal,seal,owner_scope from prompt_forge_builds where (owner_scope=$1 or owner_scope='public-seed') and ($2::boolean or status='published') order by updated_at desc limit 100`,
    [ownerScope, includeRetired],
  )) as unknown as BuildRow[];
  return rows.map(mapBuild);
}

export async function getBuild(id: string, ownerScope: string): Promise<Build | null> {
  await ensureDatabase();
  const sql = getSql();
  if (!sql) {
    const build = getMemory().builds.get(id);
    if (!build || (build.ownerScope !== "public-seed" && build.ownerScope !== ownerScope)) return null;
    return structuredClone(build);
  }
  const rows = (await sql.query(
    `select id,title,prompt,kind,status,source_ids,artifact_code,preview_mode,score,recommendation,factors,created_at,updated_at,version,prev_seal,seal,owner_scope from prompt_forge_builds where id=$1 and (owner_scope=$2 or owner_scope='public-seed') limit 1`,
    [id, ownerScope],
  )) as unknown as BuildRow[];
  return rows[0] ? mapBuild(rows[0]) : null;
}

export async function createBuild(input: CreateBuildInput, ownerScope: string): Promise<{ build: Build; event: AuditEvent }> {
  await ensureDatabase();
  const now = new Date().toISOString();
  const id = `build-${randomUUID()}`;
  const artifact = compileArtifact(input.kind, input.prompt, input.title);
  const analysis = analyzePrompt(input.prompt, input.kind, input.sourceIds);
  const build: Build = {
    id,
    title: input.title,
    prompt: input.prompt,
    kind: input.kind,
    status: "published",
    sourceIds: input.sourceIds,
    artifactCode: artifact.code,
    previewMode: "iframe",
    score: analysis.score,
    recommendation: analysis.recommendation,
    factors: analysis.factors,
    createdAt: now,
    updatedAt: now,
    version: 1,
    prevSeal: "",
    seal: "",
    ownerScope,
  };
  const payload = buildPayload(build);
  build.seal = sealEvent("", payload);
  const event: AuditEvent = {
    id: `event-${randomUUID()}`,
    buildId: id,
    action: "create",
    payload,
    previousSeal: "",
    seal: build.seal,
    createdAt: now,
    sequence: 1,
  };
  const sql = getSql();
  if (!sql) {
    const state = getMemory();
    state.builds.set(build.id, structuredClone(build));
    state.events.set(build.id, [structuredClone(event)]);
    return { build, event };
  }
  await insertBuildRow(sql, build, event);
  return { build, event };
}

export async function updateBuild(id: string, input: UpdateBuildInput, ownerScope: string): Promise<{ build: Build; event: AuditEvent }> {
  const current = await getBuild(id, ownerScope);
  if (!current) throw new RepositoryError("Build not found", 404, "not_found");
  if (current.status === "retired") throw new RepositoryError("Retired builds are read-only", 409, "retired");
  const nextPrompt = input.prompt ?? current.prompt;
  const nextKind = input.kind ?? current.kind;
  const nextTitle = input.title ?? current.title;
  const nextSources = input.sourceIds ?? current.sourceIds;
  const artifact = compileArtifact(nextKind, nextPrompt, nextTitle);
  const analysis = analyzePrompt(nextPrompt, nextKind, nextSources);
  const build: Build = {
    ...current,
    title: nextTitle,
    prompt: nextPrompt,
    kind: nextKind,
    sourceIds: nextSources,
    artifactCode: artifact.code,
    score: analysis.score,
    recommendation: analysis.recommendation,
    factors: analysis.factors,
    updatedAt: new Date().toISOString(),
    version: current.version + 1,
    prevSeal: current.seal,
    seal: "",
  };
  const payload = buildPayload(build);
  build.seal = sealEvent(current.seal, payload);
  const event: AuditEvent = {
    id: `event-${randomUUID()}`,
    buildId: id,
    action: "update",
    payload,
    previousSeal: current.seal,
    seal: build.seal,
    createdAt: build.updatedAt,
    sequence: build.version,
  };
  const sql = getSql();
  if (!sql) {
    const state = getMemory();
    state.builds.set(build.id, structuredClone(build));
    state.events.set(id, [...(state.events.get(id) ?? []), structuredClone(event)]);
    return { build, event };
  }
  await insertUpdateTransaction(sql, build, event);
  return { build, event };
}

export async function retireBuild(id: string, ownerScope: string): Promise<{ build: Build; event: AuditEvent }> {
  const current = await getBuild(id, ownerScope);
  if (!current) throw new RepositoryError("Build not found", 404, "not_found");
  if (current.status === "retired") throw new RepositoryError("Build is already retired", 409, "retired");
  const build: Build = { ...current, status: "retired", updatedAt: new Date().toISOString(), version: current.version + 1, prevSeal: current.seal, seal: "" };
  const payload = { ...buildPayload(build), status: build.status };
  build.seal = sealEvent(current.seal, payload);
  const event: AuditEvent = {
    id: `event-${randomUUID()}`,
    buildId: id,
    action: "retire",
    payload,
    previousSeal: current.seal,
    seal: build.seal,
    createdAt: build.updatedAt,
    sequence: build.version,
  };
  const sql = getSql();
  if (!sql) {
    const state = getMemory();
    state.builds.set(id, structuredClone(build));
    state.events.set(id, [...(state.events.get(id) ?? []), structuredClone(event)]);
    return { build, event };
  }
  await insertUpdateTransaction(sql, build, event);
  return { build, event };
}

export async function verifyBuild(id: string): Promise<{ valid: boolean; checked: number; firstBrokenSequence: number | null; events: AuditEvent[] }> {
  await ensureDatabase();
  const sql = getSql();
  let events: AuditEvent[];
  if (!sql) {
    events = structuredClone(getMemory().events.get(id) ?? []);
  } else {
    const rows = (await sql.query(
      `select id,build_id,action,payload,previous_seal,seal,created_at,sequence from prompt_forge_audit_events where build_id=$1 order by sequence asc`,
      [id],
    )) as unknown as EventRow[];
    events = rows.map(mapEvent);
  }
  let previous = "";
  let firstBrokenSequence: number | null = null;
  for (const event of events) {
    const expected = sealEvent(previous, event.payload);
    if (event.previousSeal !== previous || event.seal !== expected) {
      firstBrokenSequence = event.sequence;
      break;
    }
    previous = event.seal;
  }
  return { valid: firstBrokenSequence === null, checked: events.length, firstBrokenSequence, events };
}

export async function getHealth(): Promise<{ ok: boolean; mode: "neon" | "memory"; store: string; buildCount: number; auditCount: number; error?: string }> {
  const mode = repositoryMode();
  try {
    await ensureDatabase();
    const sql = getSql();
    if (!sql) {
      const state = getMemory();
      return { ok: true, mode, store: "seeded process-local adapter", buildCount: state.builds.size, auditCount: [...state.events.values()].reduce((sum, items) => sum + items.length, 0) };
    }
    const rows = (await sql.query("select count(*)::int as build_count from prompt_forge_builds")) as unknown as Array<{ build_count: number }>;
    const auditRows = (await sql.query("select count(*)::int as audit_count from prompt_forge_audit_events")) as unknown as Array<{ audit_count: number }>;
    return { ok: true, mode, store: "Neon Postgres", buildCount: Number(rows[0]?.build_count ?? 0), auditCount: Number(auditRows[0]?.audit_count ?? 0) };
  } catch (error) {
    return { ok: false, mode, store: mode === "neon" ? "Neon Postgres" : "seeded process-local adapter", buildCount: 0, auditCount: 0, error: error instanceof Error ? error.message : "Unknown store error" };
  }
}

export function getSourceCatalog() {
  return sourceCatalog;
}
