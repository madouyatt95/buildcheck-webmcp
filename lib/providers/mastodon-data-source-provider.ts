import { z } from "zod";
import type { MarketSignal, StructuredIdea } from "@/lib/domain/types";
import type { DataSourceProvider, EvidenceBundle } from "@/lib/providers/contracts";
import { MockDataSourceProvider } from "@/lib/providers/mock-data-source-provider";
import {
  inferSentiment,
  inferSignalType,
  inferStrength,
  isSafePublicHttpsUrl,
  normalizeForMatch,
  plainPublicText,
  relevanceScore,
  safeEvidenceId,
  searchTermsFor
} from "@/lib/providers/public-evidence-utils";

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface MastodonProviderOptions {
  fetcher?: Fetcher;
  timeoutMs?: number;
  instances?: string[];
  fallback?: DataSourceProvider | null;
  now?: () => Date;
}

const statusSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  url: z.string().url().nullable().optional(),
  uri: z.string().url().optional(),
  content: z.string(),
  replies_count: z.number().int().nonnegative().default(0),
  reblogs_count: z.number().int().nonnegative().default(0),
  favourites_count: z.number().int().nonnegative().default(0),
  visibility: z.string().optional(),
  account: z.object({ acct: z.string().optional(), display_name: z.string().optional() }).passthrough().optional()
}).passthrough();

function validInstance(value: string): string | null {
  const hostname = value.trim().toLowerCase();
  if (!/^[a-z0-9.-]+$/.test(hostname) || !isSafePublicHttpsUrl(`https://${hostname}`)) return null;
  return hostname;
}

export class MastodonDataSourceProvider implements DataSourceProvider {
  readonly name = "Mastodon · Public hashtag timelines";
  private readonly fetcher: Fetcher;
  private readonly timeoutMs: number;
  private readonly instances: string[];
  private readonly fallback: DataSourceProvider | null;
  private readonly now: () => Date;

  constructor(options: MastodonProviderOptions = {}) {
    this.fetcher = options.fetcher || fetch;
    this.timeoutMs = options.timeoutMs || 4500;
    const instances = options.instances?.length ? options.instances : ["mastodon.social"];
    this.instances = instances.map(validInstance).filter((value): value is string => Boolean(value)).slice(0, 3);
    this.fallback = options.fallback === undefined ? new MockDataSourceProvider() : options.fallback;
    this.now = options.now || (() => new Date());
  }

  async collect(idea: StructuredIdea, projectId: string): Promise<EvidenceBundle> {
    const collectedAt = this.now();
    const terms = searchTermsFor(idea);
    const tags = terms.map((term) => normalizeForMatch(term).replace(/\s+/g, "")).filter(Boolean).slice(0, 3);
    const queries = this.instances.flatMap((instance) => tags.map(async (tag) => {
      const endpoint = new URL(`https://${instance}/api/v1/timelines/tag/${encodeURIComponent(tag)}`);
      endpoint.searchParams.set("limit", "20");
      const response = await this.fetcher(endpoint, {
        headers: { Accept: "application/json", "User-Agent": "BuildCheck" },
        cache: "no-store",
        signal: AbortSignal.timeout(this.timeoutMs)
      });
      if (!response.ok) throw new Error("MASTODON_TIMELINE_UNAVAILABLE");
      const parsed = z.array(statusSchema).safeParse(await response.json());
      if (!parsed.success) throw new Error("MASTODON_INVALID_RESPONSE");
      return { instance, statuses: parsed.data };
    }));

    try {
      if (!queries.length) throw new Error("MASTODON_NO_VALID_QUERY");
      const results = await Promise.allSettled(queries);
      const successful = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
      if (!successful.length) throw new Error("MASTODON_UNAVAILABLE");
      const seen = new Set<string>();
      const candidates = successful.flatMap(({ instance, statuses }) => statuses.flatMap((status) => {
        const sourceUrl = status.url || status.uri || "";
        const excerpt = plainPublicText(status.content).slice(0, 360);
        const title = excerpt.slice(0, 120);
        const relevance = relevanceScore(title, excerpt, terms);
        const createdAt = new Date(status.created_at);
        const uniqueKey = `${instance}:${status.id}`;
        if (!excerpt || relevance === 0 || seen.has(uniqueKey) || !isSafePublicHttpsUrl(sourceUrl) || Number.isNaN(createdAt.getTime())) return [];
        seen.add(uniqueKey);
        const engagement = status.replies_count * 2 + status.reblogs_count * 2 + status.favourites_count;
        const signal: MarketSignal = {
          id: `${projectId}-mastodon-${safeEvidenceId(instance)}-${safeEvidenceId(status.id)}`,
          projectId,
          source: `Mastodon · ${instance}`,
          sourceUrl,
          title,
          excerpt,
          signalType: inferSignalType(excerpt),
          strength: inferStrength(engagement),
          sentiment: inferSentiment(excerpt),
          createdAt: createdAt.toISOString(),
          collectedAt: collectedAt.toISOString(),
          provenance: "observed",
          reliability: Math.min(0.72, Math.round((0.5 + Math.log10(engagement + 1) * 0.07) * 100) / 100),
          isDemo: false
        };
        return [{ signal, relevance, engagement }];
      }));
      const signals = candidates
        .sort((a, b) => b.relevance - a.relevance || b.engagement - a.engagement)
        .slice(0, 8)
        .map(({ signal }) => signal);
      const failedCount = results.length - successful.length;

      return {
        signals,
        competitors: [],
        channels: signals.length ? [{
          name: "Mastodon",
          potential: "Low",
          detail: `${signals.length} relevant public hashtag posts`,
          rationale: "Useful as a niche discovery channel, but visibility varies by instance and federation coverage."
        }] : [],
        meta: {
          providerId: "mastodon",
          providerName: this.name,
          mode: "live",
          warnings: [
            signals.length
              ? "Mastodon coverage is fragmented by instance and should be treated as directional evidence only."
              : "The public hashtag queries completed but found no sufficiently relevant Mastodon posts.",
            ...(failedCount ? [`${failedCount} Mastodon hashtag request(s) were unavailable; successful public timelines were retained.`] : [])
          ]
        }
      };
    } catch {
      if (!this.fallback) throw new Error("MASTODON_UNAVAILABLE");
      const fallback = await this.fallback.collect(idea, projectId);
      return {
        ...fallback,
        meta: {
          providerId: "mastodon",
          providerName: this.name,
          mode: "fallback",
          warnings: ["Mastodon public timelines were unavailable; curated mock evidence was used for this analysis."]
        }
      };
    }
  }
}
