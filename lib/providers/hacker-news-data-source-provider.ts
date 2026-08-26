import { z } from "zod";
import type { MarketSignal, StructuredIdea } from "@/lib/domain/types";
import type { DataSourceProvider, EvidenceBundle } from "@/lib/providers/contracts";
import { MockDataSourceProvider } from "@/lib/providers/mock-data-source-provider";
import { inferSentiment, inferSignalType, inferStrength, relevanceScore, searchTermsFor } from "@/lib/providers/public-evidence-utils";

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface HackerNewsProviderOptions {
  fetcher?: Fetcher;
  timeoutMs?: number;
  fallback?: DataSourceProvider | null;
  now?: () => Date;
}

const hitSchema = z.object({
  objectID: z.string(),
  created_at: z.string(),
  title: z.string().nullable().optional(),
  story_title: z.string().nullable().optional(),
  story_text: z.string().nullable().optional(),
  comment_text: z.string().nullable().optional(),
  points: z.number().nullable().optional(),
  num_comments: z.number().nullable().optional(),
  story_id: z.number().nullable().optional()
}).passthrough();

const responseSchema = z.object({ hits: z.array(hitSchema) }).passthrough();

function decodeHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Math.min(0x10ffff, Number(code))))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) => String.fromCodePoint(Math.min(0x10ffff, Number.parseInt(code, 16))))
    .replace(/\s+/g, " ")
    .trim();
}

export class HackerNewsDataSourceProvider implements DataSourceProvider {
  readonly name = "Hacker News · Algolia Search";
  private readonly fetcher: Fetcher;
  private readonly timeoutMs: number;
  private readonly fallback: DataSourceProvider | null;
  private readonly now: () => Date;

  constructor(options: HackerNewsProviderOptions = {}) {
    this.fetcher = options.fetcher || fetch;
    this.timeoutMs = options.timeoutMs || 4500;
    this.fallback = options.fallback === undefined ? new MockDataSourceProvider() : options.fallback;
    this.now = options.now || (() => new Date());
  }

  async collect(idea: StructuredIdea, projectId: string): Promise<EvidenceBundle> {
    const collectedAt = this.now();
    const searchTerms = searchTermsFor(idea);
    const afterTimestamp = Math.floor(collectedAt.getTime() / 1000) - 730 * 86_400;
    const endpoint = new URL("https://hn.algolia.com/api/v1/search_by_date");
    endpoint.searchParams.set("query", searchTerms.join(" ") || idea.name);
    endpoint.searchParams.set("tags", "(story,comment)");
    endpoint.searchParams.set("numericFilters", `created_at_i>${afterTimestamp}`);
    endpoint.searchParams.set("hitsPerPage", "20");

    try {
      const response = await this.fetcher(endpoint, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(this.timeoutMs)
      });
      if (!response.ok) throw new Error("HN_SEARCH_UNAVAILABLE");
      const parsed = responseSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("HN_SEARCH_INVALID_RESPONSE");

      const candidates = parsed.data.hits.flatMap((hit) => {
        const rawText = hit.comment_text || hit.story_text || hit.title || hit.story_title || "";
        const excerpt = decodeHtml(rawText).slice(0, 360);
        const title = decodeHtml(hit.story_title || hit.title || excerpt).slice(0, 120);
        const createdAt = new Date(hit.created_at);
        const relevance = relevanceScore(title, excerpt, searchTerms);
        const safeObjectId = hit.objectID.replace(/[^a-zA-Z0-9_-]/g, "");
        if (!excerpt || !title || !safeObjectId || /^\[dead\]$/i.test(title) || relevance === 0 || Number.isNaN(createdAt.getTime())) return [];
        const points = Math.max(0, hit.points || 0);
        const comments = Math.max(0, hit.num_comments || 0);
        const engagement = points + comments * 2;
        const signal: MarketSignal = {
          id: `${projectId}-hn-${safeObjectId}`,
          projectId,
          source: "Hacker News",
          sourceUrl: `https://news.ycombinator.com/item?id=${hit.story_id || safeObjectId}`,
          title,
          excerpt,
          signalType: inferSignalType(`${title} ${excerpt}`),
          strength: inferStrength(engagement),
          sentiment: inferSentiment(`${title} ${excerpt}`),
          createdAt: createdAt.toISOString(),
          collectedAt: collectedAt.toISOString(),
          provenance: "observed",
          reliability: Math.min(0.78, Math.round((0.54 + Math.log10(engagement + 1) * 0.09) * 100) / 100),
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
          providerId: "hacker-news",
          providerName: this.name,
          mode: "live",
          warnings: signals.length
            ? ["Public Hacker News discussions are anecdotal and may not represent the target market."]
            : ["The live query completed but found no sufficiently relevant Hacker News discussions in the two-year window."]
        }
      };
    } catch {
      if (!this.fallback) throw new Error("HN_SEARCH_UNAVAILABLE");
      const fallback = await this.fallback.collect(idea, projectId);
      return {
        ...fallback,
        meta: {
          providerId: "hacker-news",
          providerName: this.name,
          mode: "fallback",
          warnings: ["Hacker News was unavailable; curated mock evidence was used for this analysis."]
        }
      };
    }
  }
}
