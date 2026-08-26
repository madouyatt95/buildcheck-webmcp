import { z } from "zod";
import type { MarketSignal, StructuredIdea } from "@/lib/domain/types";
import type { DataSourceProvider, EvidenceBundle } from "@/lib/providers/contracts";
import { MockDataSourceProvider } from "@/lib/providers/mock-data-source-provider";
import {
  inferSentiment,
  inferSignalType,
  inferStrength,
  plainPublicText,
  relevanceScore,
  safeEvidenceId,
  searchTermsFor
} from "@/lib/providers/public-evidence-utils";

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface BlueskyProviderOptions {
  fetcher?: Fetcher;
  timeoutMs?: number;
  fallback?: DataSourceProvider | null;
  now?: () => Date;
}

const postSchema = z.object({
  uri: z.string(),
  cid: z.string().optional(),
  author: z.object({ handle: z.string() }).passthrough(),
  record: z.object({ text: z.string(), createdAt: z.string().optional() }).passthrough(),
  replyCount: z.number().int().nonnegative().optional().default(0),
  repostCount: z.number().int().nonnegative().optional().default(0),
  likeCount: z.number().int().nonnegative().optional().default(0),
  quoteCount: z.number().int().nonnegative().optional().default(0),
  indexedAt: z.string().optional()
}).passthrough();

const responseSchema = z.object({ posts: z.array(postSchema) }).passthrough();

function publicPostUrl(uri: string, handle: string): string | null {
  const recordKey = uri.split("/").at(-1) || "";
  if (!/^[a-z0-9.-]+$/i.test(handle) || !/^[a-z0-9]+$/i.test(recordKey)) return null;
  return `https://bsky.app/profile/${handle}/post/${recordKey}`;
}

export class BlueskyDataSourceProvider implements DataSourceProvider {
  readonly name = "Bluesky · Public AppView Search";
  private readonly fetcher: Fetcher;
  private readonly timeoutMs: number;
  private readonly fallback: DataSourceProvider | null;
  private readonly now: () => Date;

  constructor(options: BlueskyProviderOptions = {}) {
    this.fetcher = options.fetcher || fetch;
    this.timeoutMs = options.timeoutMs || 4500;
    this.fallback = options.fallback === undefined ? new MockDataSourceProvider() : options.fallback;
    this.now = options.now || (() => new Date());
  }

  async collect(idea: StructuredIdea, projectId: string): Promise<EvidenceBundle> {
    const collectedAt = this.now();
    const terms = searchTermsFor(idea);
    const endpoint = new URL("https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts");
    endpoint.searchParams.set("q", terms.join(" ") || idea.name);
    endpoint.searchParams.set("limit", "25");
    endpoint.searchParams.set("sort", "latest");

    try {
      const response = await this.fetcher(endpoint, {
        headers: { Accept: "application/json", "User-Agent": "BuildCheck" },
        cache: "no-store",
        signal: AbortSignal.timeout(this.timeoutMs)
      });
      if (!response.ok) throw new Error("BLUESKY_SEARCH_UNAVAILABLE");
      const parsed = responseSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("BLUESKY_SEARCH_INVALID_RESPONSE");

      const candidates = parsed.data.posts.flatMap((post) => {
        const excerpt = plainPublicText(post.record.text).slice(0, 360);
        const title = excerpt.slice(0, 120);
        const sourceUrl = publicPostUrl(post.uri, post.author.handle);
        const relevance = relevanceScore(title, excerpt, terms);
        const createdAt = new Date(post.record.createdAt || post.indexedAt || collectedAt.toISOString());
        if (!excerpt || relevance === 0 || !sourceUrl || Number.isNaN(createdAt.getTime())) return [];
        const engagement = post.replyCount * 2 + post.repostCount * 2 + post.quoteCount * 2 + post.likeCount;
        const signal: MarketSignal = {
          id: `${projectId}-bsky-${safeEvidenceId(post.uri.split("/").at(-1) || post.cid || "post")}`,
          projectId,
          source: "Bluesky",
          sourceUrl,
          title,
          excerpt,
          signalType: inferSignalType(excerpt),
          strength: inferStrength(engagement),
          sentiment: inferSentiment(excerpt),
          createdAt: createdAt.toISOString(),
          collectedAt: collectedAt.toISOString(),
          provenance: "observed",
          reliability: Math.min(0.74, Math.round((0.52 + Math.log10(engagement + 1) * 0.07) * 100) / 100),
          isDemo: false
        };
        return [{ signal, relevance, engagement }];
      });
      const signals = candidates
        .sort((a, b) => b.relevance - a.relevance || b.engagement - a.engagement)
        .slice(0, 8)
        .map(({ signal }) => signal);

      return {
        signals,
        competitors: [],
        channels: signals.length ? [{
          name: "Bluesky",
          potential: "Low",
          detail: `${signals.length} relevant public posts`,
          rationale: "Useful for recent qualitative signals; search results are noisy and not representative sampling."
        }] : [],
        meta: {
          providerId: "bluesky",
          providerName: this.name,
          mode: "live",
          warnings: signals.length
            ? ["Bluesky posts are recent public anecdotes and should not be treated as representative market research."]
            : ["The live Bluesky query completed but found no sufficiently relevant public posts."]
        }
      };
    } catch {
      if (!this.fallback) throw new Error("BLUESKY_SEARCH_UNAVAILABLE");
      const fallback = await this.fallback.collect(idea, projectId);
      return {
        ...fallback,
        meta: {
          providerId: "bluesky",
          providerName: this.name,
          mode: "fallback",
          warnings: ["Bluesky public search was unavailable; curated mock evidence was used for this analysis."]
        }
      };
    }
  }
}
