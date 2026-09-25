export const BUILD_KINDS = ["svg", "arcade", "orbit", "climate"] as const;

export type BuildKind = (typeof BUILD_KINDS)[number];
export type BuildStatus = "published" | "retired";

export interface SourceRecord {
  id: string;
  title: string;
  publisher: string;
  kind: "official" | "repository" | "article" | "social" | "benchmark";
  url: string;
  date: string;
  excerpt: string;
  model: string;
  tags: string[];
  artifactHint: string;
}

export interface EngineFactor {
  key: string;
  label: string;
  weight: number;
  value: number;
  contribution: number;
  detail: string;
}

export interface EngineResult {
  version: string;
  score: number;
  recommendation: string;
  factors: EngineFactor[];
  seal: string;
  metadata: {
    kind: BuildKind;
    sourceCount: number;
    promptLength: number;
  };
}

export interface Build {
  id: string;
  title: string;
  prompt: string;
  kind: BuildKind;
  status: BuildStatus;
  sourceIds: string[];
  artifactCode: string;
  previewMode: "iframe";
  score: number;
  recommendation: string;
  factors: EngineFactor[];
  createdAt: string;
  updatedAt: string;
  version: number;
  prevSeal: string;
  seal: string;
  ownerScope: string;
}

export interface AuditEvent {
  id: string;
  buildId: string;
  action: "create" | "update" | "retire";
  payload: Record<string, unknown>;
  previousSeal: string;
  seal: string;
  createdAt: string;
  sequence: number;
}

export interface CreateBuildInput {
  title: string;
  prompt: string;
  kind: BuildKind;
  sourceIds: string[];
}

export interface UpdateBuildInput {
  title?: string;
  prompt?: string;
  kind?: BuildKind;
  sourceIds?: string[];
}

export interface FeedItem {
  id: string;
  title: string;
  publisher: string;
  kind: SourceRecord["kind"];
  url: string;
  date: string;
  excerpt: string;
  model: string;
  tags: string[];
  artifactHint: string;
  source: "live" | "fallback";
}

export interface FeedResponse {
  source: "live" | "fallback";
  fetchedAt: string;
  notice: string;
  items: FeedItem[];
}
