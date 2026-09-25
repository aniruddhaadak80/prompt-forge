import assert from "node:assert/strict";

const baseUrl = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const repoUrl = process.env.REPO_URL ?? "https://github.com/aniruddhaadak80/prompt-forge";
let cookie = "";

async function request(path, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  if (cookie) headers.set("cookie", cookie);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers, redirect: "follow" });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";", 1)[0];
  return response;
}

async function json(path, init) {
  const response = await request(path, init);
  const body = await response.json();
  assert.equal(response.status < 400, true, `${path} returned ${response.status}`);
  return body;
}

const homepage = await request("/");
assert.equal(homepage.status, 200);
const homepageText = await homepage.text();
assert.match(homepageText, /github\.com\/aniruddhaadak80\/prompt-forge/);

const health = await json("/api/health");
assert.equal(health.data.ok, true);
if (baseUrl.includes("vercel.app")) assert.equal(health.data.mode, "neon", "Production health must use Neon");

const feed = await json("/api/feed");
assert.ok(feed.data.items.length > 0, "Feed must return records");
assert.ok(["live", "fallback"].includes(feed.data.source));

const created = await json("/api/builds", { method: "POST", body: JSON.stringify({ title: "Live verifier build", prompt: "Create a playable browser arcade with keyboard controls, moving hazards, a score loop, reset, and a visible runtime readout.", kind: "arcade", sourceIds: ["openai-astra-official"] }) });
const id = created.data.build.id;
assert.match(id, /^build-/);

const readBack = await json(`/api/builds/${id}`);
assert.equal(readBack.data.build.id, id);
const updated = await json(`/api/builds/${id}`, { method: "PATCH", body: JSON.stringify({ prompt: "Create a playable browser arcade with keyboard controls, moving hazards, a score loop, reset, a visible runtime readout, and a finish state." }) });
assert.equal(updated.data.build.version, 2);
assert.ok(updated.data.build.artifactCode.includes("<!doctype html>"));

const analysis = await json("/api/engine", { method: "POST", body: JSON.stringify({ prompt: updated.data.build.prompt, kind: "arcade", sourceIds: ["openai-astra-official"] }) });
assert.equal(typeof analysis.data.analysis.score, "number");
assert.equal(analysis.data.analysis.factors.length, 5);

const initialize = await json("/api/mcp", { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize" }) });
assert.equal(initialize.result.serverInfo.name, "prompt-forge");
const tools = await json("/api/mcp", { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }) });
assert.ok(tools.result.tools.some((tool) => tool.name === "create_build"));
const mcpVerify = await json("/api/mcp", { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "verify_chain", arguments: { id } } }) });
assert.equal(mcpVerify.result.structuredContent.valid, true);

const verification = await json(`/api/verify?id=${encodeURIComponent(id)}`);
assert.equal(verification.data.verification.valid, true);
const exportResponse = await request(`/api/export?id=${encodeURIComponent(id)}`);
assert.equal(exportResponse.status, 200);
assert.match(exportResponse.headers.get("content-type") ?? "", /markdown/);
const markdown = await exportResponse.text();
assert.match(markdown, /Live verifier build/);
assert.match(markdown, /seal/i);

const retired = await json(`/api/builds/${id}`, { method: "DELETE" });
assert.equal(retired.data.build.status, "retired");
const afterDelete = await json(`/api/builds/${id}`);
assert.equal(afterDelete.data.build.status, "retired");
const finalVerification = await json(`/api/verify?id=${encodeURIComponent(id)}`);
assert.equal(finalVerification.data.verification.valid, true);

const repoResponse = await fetch(repoUrl, { redirect: "follow" });
assert.equal(repoResponse.status < 400, true, `Repository URL returned ${repoResponse.status}`);

console.log(JSON.stringify({ ok: true, baseUrl, repoUrl, buildId: id, health: health.data, feedSource: feed.data.source, chain: finalVerification.data.verification }, null, 2));
