import { z } from "zod";
import type { MarketSignal, StructuredIdea } from "@/lib/domain/types";
import type { DataSourceProvider, EvidenceBundle } from "@/lib/providers/contracts";
import { MockDataSourceProvider } from "@/lib/providers/mock-data-source-provider";
import {
  excerptAroundTerms,
  inferSentiment,
  inferSignalType,
  inferStrength,
  plainPublicText,
  relevanceScore,
  searchTermsFor
} from "@/lib/providers/public-evidence-utils";

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface StackExchangeProviderOptions {
  fetcher?: Fetcher;
  timeoutMs?: number;
  key?: string;
  site?: string;
  fallback?: DataSourceProvider | null;
  now?: () => Date;
}

const itemSchema = z.object({
  question_id: z.number().int().positive(),
  item_type: z.string().optional(),
  title: z.string(),
  excerpt: z.string().optional().default(""),
  body: z.string().optional().default(""),
  creation_date: z.number().int().nonnegative(),
  last_activity_date: z.number().int().nonnegative().optional(),
  score: z.number().int().optional().default(0),
  question_score: z.number().int().optional().default(0),
  answer_count: z.number().int().nonnegative().optional().default(0)
}).passthrough();

const responseSchema = z.object({
  items: z.array(itemSchema),
  backoff: z.number().int().positive().optional(),
  quota_remaining: z.number().int().nonnegative().optional()
}).passthrough();

export class StackExchangeDataSourceProvider implements DataSourceProvider {
  readonly name = "Stack Exchange · Search API";
  private readonly fetcher: Fetcher;
  private readonly timeoutMs: number;
  private readonly key?: string;
  private readonly site: string;
  private readonly fallback: DataSourceProvider | null;
  private readonly now: () => Date;

  constructor(options: StackExchangeProviderOptions = {}) {
    this.fetcher = options.fetcher || fetch;
    this.timeoutMs = options.timeoutMs || 4500;
    this.key = options.key?.trim() || undefined;
    this.site = /^[a-z0-9.-]+$/i.test(options.site || "") ? options.site! : "stackoverflow";
    this.fallback = options.fallback === undefined ? new MockDataSourceProvider() : options.fallback;
    this.now = options.now || (() => new Date());
  }

  async collect(idea: StructuredIdea, projectId: string): Promise<EvidenceBundle> {
    const collectedAt = this.now();
    const terms = searchTermsFor(idea);
    const endpoint = new URL("https://api.stackexchange.com/2.3/search/excerpts");
    endpoint.searchParams.set("site", this.site);
    endpoint.searchParams.set("q", terms.join(" ") || idea.name);
    endpoint.searchParams.set("sort", "activity");
    endpoint.searchParams.set("order", "desc");
    endpoint.searchParams.set("pagesize", "20");
    endpoint.searchParams.set("fromdate", String(Math.floor(collectedAt.getTime() / 1000) - 730 * 86_400));
    if (this.key) endpoint.searchParams.set("key", this.key);

    try {
      const response = await this.fetcher(endpoint, {
        headers: { Accept: "application/json", "User-Agent": "BuildCheck" },
        cache: "no-store",
        signal: AbortSignal.timeout(this.timeoutMs)
      });
      if (!response.ok) throw new Error("STACK_EXCHANGE_UNAVAILABLE");
      const parsed = responseSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("STACK_EXCHANGE_INVALID_RESPONSE");

      const candidates = parsed.data.items.flatMap((item) => {
        const title = plainPublicText(item.title).slice(0, 120);
        const body = `${item.excerpt} ${item.body}`;
        const excerpt = excerptAroundTerms(body || title, terms);
        const relevance = relevanceScore(title, body, terms);
        if (!title || !excerpt || relevance === 0) return [];
        const engagement = Math.max(0, item.question_score, item.score) + item.answer_count * 3;
        const signal: MarketSignal = {
          id: `${projectId}-stack-${item.question_id}`,
          projectId,
          source: "Stack Exchange",
          sourceUrl: `https://${this.site === "stackoverflow" ? "stackoverflow.com" : `${this.site}.stackexchange.com`}/questions/${item.question_id}`,
          title,
          excerpt,
          signalType: inferSignalType(`${title} ${excerpt}`),
          strength: inferStrength(engagement),
          sentiment: inferSentiment(`${title} ${excerpt}`),
          createdAt: new Date(item.creation_date * 1000).toISOString(),
          collectedAt: collectedAt.toISOString(),
          provenance: "observed",
          reliability: Math.min(0.84, Math.round((0.62 + Math.log10(engagement + 1) * 0.07) * 100) / 100),
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
          name: "Stack Exchange",
          potential: "Medium",
          detail: `${signals.length} relevant public technical discussions`,
          rationale: "Useful for problem discovery in technical audiences; not representative of non-technical buyers."
        }] : [],
        meta: {
          providerId: "stack-exchange",
          providerName: this.name,
          mode: "live",
          warnings: [
            ...(parsed.data.backoff ? [`Stack Exchange requested a ${parsed.data.backoff}s backoff; subsequent calls must wait.`] : []),
            signals.length
              ? ["Stack Exchange evidence is technical-audience biased and user content remains subject to its attribution license."]
              : ["The live query completed but found no sufficiently relevant Stack Exchange discussions."]
          ].flat()
        }
      };
    } catch {
      if (!this.fallback) throw new Error("STACK_EXCHANGE_UNAVAILABLE");
      const fallback = await this.fallback.collect(idea, projectId);
      return {
        ...fallback,
        meta: {
          providerId: "stack-exchange",
          providerName: this.name,
          mode: "fallback",
          warnings: ["Stack Exchange was unavailable; curated mock evidence was used for this analysis."]
        }
      };
    }
  }
}
