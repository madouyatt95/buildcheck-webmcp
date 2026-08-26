import { z } from "zod";
import type { MarketSignal, StructuredIdea } from "@/lib/domain/types";
import type { DataSourceProvider, EvidenceBundle } from "@/lib/providers/contracts";
import { MockDataSourceProvider } from "@/lib/providers/mock-data-source-provider";
import { inferSentiment, inferSignalType, inferStrength, relevanceScore, searchTermsFor } from "@/lib/providers/public-evidence-utils";

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface GitHubIssuesProviderOptions {
  fetcher?: Fetcher;
  timeoutMs?: number;
  token?: string;
  fallback?: DataSourceProvider | null;
  now?: () => Date;
}

const issueSchema = z.object({
  id: z.number().int().nonnegative(),
  html_url: z.string().url(),
  repository_url: z.string().url(),
  title: z.string(),
  body: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  comments: z.number().int().nonnegative().default(0),
  reactions: z.object({ total_count: z.number().int().nonnegative().default(0) }).optional()
}).passthrough();

const responseSchema = z.object({ items: z.array(issueSchema) }).passthrough();

function plainText(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/[#>*_~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isPublicGitHubUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "github.com";
  } catch {
    return false;
  }
}

function evidenceExcerpt(value: string, terms: string[]): string {
  const text = plainText(value).slice(0, 8_000);
  const normalized = text.toLowerCase();
  const firstMatch = terms
    .map((term) => normalized.indexOf(term.toLowerCase()))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  const start = firstMatch === undefined ? 0 : Math.max(0, firstMatch - 90);
  return text.slice(start, start + 360).trim();
}

export class GitHubIssuesDataSourceProvider implements DataSourceProvider {
  readonly name = "GitHub Issues · REST Search";
  private readonly fetcher: Fetcher;
  private readonly timeoutMs: number;
  private readonly token?: string;
  private readonly fallback: DataSourceProvider | null;
  private readonly now: () => Date;

  constructor(options: GitHubIssuesProviderOptions = {}) {
    this.fetcher = options.fetcher || fetch;
    this.timeoutMs = options.timeoutMs || 4500;
    this.token = options.token?.trim() || undefined;
    this.fallback = options.fallback === undefined ? new MockDataSourceProvider() : options.fallback;
    this.now = options.now || (() => new Date());
  }

  async collect(idea: StructuredIdea, projectId: string): Promise<EvidenceBundle> {
    const collectedAt = this.now();
    const searchTerms = searchTermsFor(idea);
    const updatedAfter = new Date(collectedAt.getTime() - 730 * 86_400_000).toISOString().slice(0, 10);
    const endpoint = new URL("https://api.github.com/search/issues");
    endpoint.searchParams.set("q", `${searchTerms.join(" ") || idea.name} in:title,body is:issue updated:>=${updatedAfter}`);
    endpoint.searchParams.set("sort", "updated");
    endpoint.searchParams.set("order", "desc");
    endpoint.searchParams.set("per_page", "20");
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "BuildCheck"
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    try {
      const response = await this.fetcher(endpoint, {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(this.timeoutMs)
      });
      if (!response.ok) throw new Error("GITHUB_SEARCH_UNAVAILABLE");
      const parsed = responseSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("GITHUB_SEARCH_INVALID_RESPONSE");

      const candidates = parsed.data.items.flatMap((issue) => {
        const title = plainText(issue.title).slice(0, 120);
        const searchableText = plainText(issue.body || issue.title).slice(0, 8_000);
        const excerpt = evidenceExcerpt(issue.body || issue.title, searchTerms);
        const createdAt = new Date(issue.created_at);
        const relevance = relevanceScore(title, searchableText, searchTerms);
        const isAutomatedDependencyIssue = /^dependency dashboard$/i.test(title)
          || /renovate updates and detected dependencies/i.test(searchableText);
        if (!title || !excerpt || isAutomatedDependencyIssue || !isPublicGitHubUrl(issue.html_url) || relevance === 0 || Number.isNaN(createdAt.getTime())) return [];
        const engagement = issue.comments * 2 + (issue.reactions?.total_count || 0);
        const signal: MarketSignal = {
          id: `${projectId}-github-${issue.id}`,
          projectId,
          source: "GitHub Issues",
          sourceUrl: issue.html_url,
          title,
          excerpt,
          signalType: inferSignalType(`${title} ${excerpt}`),
          strength: inferStrength(engagement),
          sentiment: inferSentiment(`${title} ${excerpt}`),
          createdAt: createdAt.toISOString(),
          collectedAt: collectedAt.toISOString(),
          provenance: "observed",
          reliability: Math.min(0.8, Math.round((0.57 + Math.log10(engagement + 1) * 0.08) * 100) / 100),
          isDemo: false
        };
        return [{ signal, relevance, engagement }];
      });
      const signals = candidates
        .sort((a, b) => b.relevance - a.relevance || b.engagement - a.engagement)
        .slice(0, 8)
        .map((candidate) => candidate.signal);

      return {
        signals,
        competitors: [],
        channels: [],
        meta: {
          providerId: "github",
          providerName: this.name,
          mode: "live",
          warnings: signals.length
            ? ["Public GitHub issues are developer-biased anecdotes and do not represent the full target market."]
            : ["The live query completed but found no sufficiently relevant GitHub issues in the two-year window."]
        }
      };
    } catch {
      if (!this.fallback) throw new Error("GITHUB_SEARCH_UNAVAILABLE");
      const fallback = await this.fallback.collect(idea, projectId);
      return {
        ...fallback,
        meta: {
          providerId: "github",
          providerName: this.name,
          mode: "fallback",
          warnings: ["GitHub Issues was unavailable; curated mock evidence was used for this analysis."]
        }
      };
    }
  }
}
