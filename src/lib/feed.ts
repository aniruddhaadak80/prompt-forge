import { sourceCatalog } from "./seed";
import type { FeedItem, FeedResponse, SourceRecord } from "./types";

const githubUrl = "https://api.github.com/search/repositories?q=AI+prompt+playable+game+language%3ATypeScript&sort=updated&order=desc&per_page=8";
const devUrl = "https://dev.to/api/articles?tag=ai&per_page=8";

function fallbackItems(): FeedItem[] {
  return sourceCatalog.map((source) => ({ ...source, source: "fallback" }));
}

function githubItem(item: { id: number; full_name: string; html_url: string; description: string | null; stargazers_count: number; updated_at: string; language: string | null }): FeedItem {
  return {
    id: `github-${item.id}`,
    title: item.full_name,
    publisher: "GitHub",
    kind: "repository",
    url: item.html_url,
    date: item.updated_at,
    excerpt: item.description ?? "Public repository without a description.",
    model: "Repository-defined",
    tags: ["github", item.language?.toLowerCase() ?? "code", "playable"],
    artifactHint: "Inspect the repository and run its documented demo.",
    source: "live",
  };
}

function devItem(item: { id: number; title: string; url: string; description: string | null; published_at: string; tag_list: string[]; user: { name: string } }): FeedItem {
  return {
    id: `dev-${item.id}`,
    title: item.title,
    publisher: item.user.name,
    kind: "article",
    url: item.url,
    date: item.published_at,
    excerpt: item.description ?? "DEV Community article.",
    model: "Article-defined",
    tags: item.tag_list.slice(0, 5),
    artifactHint: "Look for a runnable demo or reproducible build notes.",
    source: "live",
  };
}

async function readJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "prompt-forge-public-feed/1.0" },
    next: { revalidate: 900 },
    signal: AbortSignal.timeout(4500),
  });
  if (!response.ok) throw new Error(`Feed request failed with ${response.status}`);
  return response.json();
}

export async function getFeed(): Promise<FeedResponse> {
  const [githubResult, devResult] = await Promise.allSettled([readJson(githubUrl), readJson(devUrl)]);
  const live: FeedItem[] = [];
  if (githubResult.status === "fulfilled") {
    const value = githubResult.value as { items?: Parameters<typeof githubItem>[0][] };
    if (Array.isArray(value.items)) live.push(...value.items.slice(0, 8).map(githubItem));
  }
  if (devResult.status === "fulfilled") {
    const value = devResult.value as Parameters<typeof devItem>[0][];
    if (Array.isArray(value)) live.push(...value.slice(0, 8).map(devItem));
  }
  const fetchedAt = new Date().toISOString();
  if (live.length > 0) {
    return { source: "live", fetchedAt, notice: "Live public GitHub and DEV Community results normalized with attribution.", items: live };
  }
  return { source: "fallback", fetchedAt, notice: "Live providers were unavailable; this dated shelf is explicitly fallback data.", items: fallbackItems() };
}

export function sourceToFeedItem(source: SourceRecord): FeedItem {
  return { ...source, source: "fallback" };
}
