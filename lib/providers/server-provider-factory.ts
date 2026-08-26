import { MockAIProvider } from "@/lib/providers/mock-ai-provider";
import { GitHubIssuesDataSourceProvider } from "@/lib/providers/github-issues-data-source-provider";
import { HackerNewsDataSourceProvider } from "@/lib/providers/hacker-news-data-source-provider";
import { MockDataSourceProvider } from "@/lib/providers/mock-data-source-provider";
import { MultiSourceDataSourceProvider } from "@/lib/providers/multi-source-data-source-provider";
import { ValidationService } from "@/lib/services/validation-service";

export type ServerDataSourceId = "mock" | "hacker-news" | "github" | "hacker-news+github";

export function selectedServerDataSource(): ServerDataSourceId {
  const configured = process.env.DATA_SOURCE_PROVIDER;
  return configured === "hacker-news" || configured === "github" || configured === "hacker-news+github"
    ? configured
    : "mock";
}

export function effectiveServerDataSource(configured: ServerDataSourceId, allowExternalLookup: boolean): ServerDataSourceId {
  return configured !== "mock" && allowExternalLookup ? configured : "mock";
}

function hackerNewsTimeout(): number {
  const parsed = Number(process.env.HN_SEARCH_TIMEOUT_MS || 4500);
  return Number.isFinite(parsed) ? Math.min(10_000, Math.max(1_000, parsed)) : 4500;
}

function githubTimeout(): number {
  const parsed = Number(process.env.GITHUB_SEARCH_TIMEOUT_MS || 4500);
  return Number.isFinite(parsed) ? Math.min(10_000, Math.max(1_000, parsed)) : 4500;
}

export function liveSourceCount(source: ServerDataSourceId): number {
  if (source === "hacker-news+github") return 2;
  return source === "mock" ? 0 : 1;
}

export function createServerValidationService(source = selectedServerDataSource()): ValidationService {
  const mock = new MockDataSourceProvider();
  const hackerNews = (fallback: MockDataSourceProvider | null) => new HackerNewsDataSourceProvider({ timeoutMs: hackerNewsTimeout(), fallback });
  const github = (fallback: MockDataSourceProvider | null) => new GitHubIssuesDataSourceProvider({
    timeoutMs: githubTimeout(),
    token: process.env.GITHUB_TOKEN,
    fallback
  });
  const dataSource = source === "hacker-news"
    ? hackerNews(mock)
    : source === "github"
      ? github(mock)
      : source === "hacker-news+github"
        ? new MultiSourceDataSourceProvider([
          { id: "hacker-news", provider: hackerNews(null), maxSignals: 6 },
          { id: "github", provider: github(null), maxSignals: 6 }
        ], { fallback: mock, maxSignals: 12 })
        : mock;
  return new ValidationService(new MockAIProvider(), dataSource);
}
