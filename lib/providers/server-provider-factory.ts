import { AppleAppStoreDataSourceProvider } from "@/lib/providers/apple-app-store-data-source-provider";
import { BlueskyDataSourceProvider } from "@/lib/providers/bluesky-data-source-provider";
import { MockAIProvider } from "@/lib/providers/mock-ai-provider";
import { GitHubIssuesDataSourceProvider } from "@/lib/providers/github-issues-data-source-provider";
import { HackerNewsDataSourceProvider } from "@/lib/providers/hacker-news-data-source-provider";
import { MastodonDataSourceProvider } from "@/lib/providers/mastodon-data-source-provider";
import { MockDataSourceProvider } from "@/lib/providers/mock-data-source-provider";
import { MultiSourceDataSourceProvider } from "@/lib/providers/multi-source-data-source-provider";
import { NpmRegistryDataSourceProvider } from "@/lib/providers/npm-registry-data-source-provider";
import { RssDataSourceProvider } from "@/lib/providers/rss-data-source-provider";
import { StackExchangeDataSourceProvider } from "@/lib/providers/stack-exchange-data-source-provider";
import type { DataSourceProvider } from "@/lib/providers/contracts";
import { ValidationService } from "@/lib/services/validation-service";

const serverDataSourceIds = [
  "mock",
  "hacker-news",
  "github",
  "hacker-news+github",
  "stack-exchange",
  "apple-app-store",
  "mastodon",
  "bluesky",
  "rss",
  "npm",
  "public-web"
] as const;

export type ServerDataSourceId = typeof serverDataSourceIds[number];

export function selectedServerDataSource(): ServerDataSourceId {
  const configured = process.env.DATA_SOURCE_PROVIDER;
  return serverDataSourceIds.includes(configured as ServerDataSourceId) ? configured as ServerDataSourceId : "mock";
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

function publicSourceTimeout(): number {
  const parsed = Number(process.env.PUBLIC_SOURCE_TIMEOUT_MS || 4500);
  return Number.isFinite(parsed) ? Math.min(10_000, Math.max(1_000, parsed)) : 4500;
}

function configuredList(value: string | undefined): string[] {
  return (value || "").split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
}

export function liveSourceCount(source: ServerDataSourceId): number {
  if (source === "hacker-news+github") return 2;
  if (source === "public-web") return 8;
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
  const stackExchange = (fallback: MockDataSourceProvider | null) => new StackExchangeDataSourceProvider({
    timeoutMs: publicSourceTimeout(),
    key: process.env.STACK_EXCHANGE_KEY,
    site: process.env.STACK_EXCHANGE_SITE,
    fallback
  });
  const apple = (fallback: MockDataSourceProvider | null) => new AppleAppStoreDataSourceProvider({
    timeoutMs: publicSourceTimeout(),
    country: process.env.APP_STORE_COUNTRY,
    fallback
  });
  const mastodon = (fallback: MockDataSourceProvider | null) => new MastodonDataSourceProvider({
    timeoutMs: publicSourceTimeout(),
    instances: configuredList(process.env.MASTODON_INSTANCES),
    fallback
  });
  const bluesky = (fallback: MockDataSourceProvider | null) => new BlueskyDataSourceProvider({ timeoutMs: publicSourceTimeout(), fallback });
  const rss = (fallback: MockDataSourceProvider | null) => new RssDataSourceProvider({
    timeoutMs: publicSourceTimeout(),
    feedUrls: configuredList(process.env.RSS_FEED_URLS),
    fallback
  });
  const npm = (fallback: MockDataSourceProvider | null) => new NpmRegistryDataSourceProvider({ timeoutMs: publicSourceTimeout(), fallback });

  const individualSources: Partial<Record<ServerDataSourceId, (fallback: MockDataSourceProvider | null) => DataSourceProvider>> = {
    "hacker-news": hackerNews,
    github,
    "stack-exchange": stackExchange,
    "apple-app-store": apple,
    mastodon,
    bluesky,
    rss,
    npm
  };
  let dataSource: DataSourceProvider = source === "mock" ? mock : individualSources[source]?.(mock) || mock;
  if (source === "hacker-news+github") {
    dataSource = new MultiSourceDataSourceProvider([
      { id: "hacker-news", provider: hackerNews(null), maxSignals: 6 },
      { id: "github", provider: github(null), maxSignals: 6 }
    ], { fallback: mock, maxSignals: 12 });
  }
  if (source === "public-web") {
    dataSource = new MultiSourceDataSourceProvider([
      { id: "hacker-news", provider: hackerNews(null), maxSignals: 3 },
      { id: "github", provider: github(null), maxSignals: 3 },
      { id: "stack-exchange", provider: stackExchange(null), maxSignals: 3 },
      { id: "apple-app-store", provider: apple(null), maxSignals: 3 },
      { id: "mastodon", provider: mastodon(null), maxSignals: 3 },
      { id: "bluesky", provider: bluesky(null), maxSignals: 3 },
      { id: "rss", provider: rss(null), maxSignals: 3 },
      { id: "npm", provider: npm(null), maxSignals: 3 }
    ], { fallback: mock, maxSignals: 24 });
  }
  return new ValidationService(new MockAIProvider(), dataSource);
}
