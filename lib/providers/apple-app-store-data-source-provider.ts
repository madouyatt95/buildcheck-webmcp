import { z } from "zod";
import type { Competitor, MarketSignal, StructuredIdea } from "@/lib/domain/types";
import type { DataSourceProvider, EvidenceBundle } from "@/lib/providers/contracts";
import { MockDataSourceProvider } from "@/lib/providers/mock-data-source-provider";
import {
  excerptAroundTerms,
  inferStrength,
  isSafePublicHttpsUrl,
  plainPublicText,
  relevanceScore,
  searchTermsFor
} from "@/lib/providers/public-evidence-utils";

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface AppleAppStoreProviderOptions {
  fetcher?: Fetcher;
  timeoutMs?: number;
  country?: string;
  fallback?: DataSourceProvider | null;
  now?: () => Date;
}

const appSchema = z.object({
  trackId: z.number().int().positive(),
  trackName: z.string(),
  trackViewUrl: z.string().url(),
  description: z.string().optional().default(""),
  sellerName: z.string().optional().default("Unknown publisher"),
  primaryGenreName: z.string().optional().default("Software"),
  averageUserRating: z.number().min(0).max(5).optional().default(0),
  userRatingCount: z.number().int().nonnegative().optional().default(0),
  price: z.number().nonnegative().optional().default(0),
  formattedPrice: z.string().optional(),
  releaseDate: z.string().optional(),
  currentVersionReleaseDate: z.string().optional()
}).passthrough();

const responseSchema = z.object({ results: z.array(appSchema) }).passthrough();

export class AppleAppStoreDataSourceProvider implements DataSourceProvider {
  readonly name = "Apple App Store · Search API";
  private readonly fetcher: Fetcher;
  private readonly timeoutMs: number;
  private readonly country: string;
  private readonly fallback: DataSourceProvider | null;
  private readonly now: () => Date;

  constructor(options: AppleAppStoreProviderOptions = {}) {
    this.fetcher = options.fetcher || fetch;
    this.timeoutMs = options.timeoutMs || 4500;
    this.country = /^[a-z]{2}$/i.test(options.country || "") ? options.country!.toLowerCase() : "us";
    this.fallback = options.fallback === undefined ? new MockDataSourceProvider() : options.fallback;
    this.now = options.now || (() => new Date());
  }

  async collect(idea: StructuredIdea, projectId: string): Promise<EvidenceBundle> {
    const collectedAt = this.now();
    const terms = searchTermsFor(idea);
    const endpoint = new URL("https://itunes.apple.com/search");
    endpoint.searchParams.set("term", terms.join(" ") || idea.name);
    endpoint.searchParams.set("country", this.country);
    endpoint.searchParams.set("media", "software");
    endpoint.searchParams.set("entity", "software");
    endpoint.searchParams.set("limit", "20");

    try {
      const response = await this.fetcher(endpoint, {
        headers: { Accept: "application/json", "User-Agent": "BuildCheck" },
        cache: "no-store",
        signal: AbortSignal.timeout(this.timeoutMs)
      });
      if (!response.ok) throw new Error("APPLE_SEARCH_UNAVAILABLE");
      const parsed = responseSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("APPLE_SEARCH_INVALID_RESPONSE");

      const candidates = parsed.data.results.flatMap((app) => {
        const title = plainPublicText(app.trackName).slice(0, 120);
        const description = plainPublicText(app.description).slice(0, 10_000);
        const relevance = relevanceScore(title, description, terms);
        const createdAt = new Date(app.currentVersionReleaseDate || app.releaseDate || collectedAt);
        if (!title || relevance === 0 || !isSafePublicHttpsUrl(app.trackViewUrl, ["apple.com"]) || Number.isNaN(createdAt.getTime())) return [];
        return [{ app, title, description, relevance, createdAt }];
      }).sort((a, b) => b.relevance - a.relevance || b.app.userRatingCount - a.app.userRatingCount).slice(0, 8);

      const signals: MarketSignal[] = candidates.map(({ app, title, description, createdAt }) => ({
        id: `${projectId}-apple-${app.trackId}`,
        projectId,
        source: "Apple App Store",
        sourceUrl: app.trackViewUrl,
        title: `${title} · ${app.averageUserRating.toFixed(1)}/5`,
        excerpt: excerptAroundTerms(description || `${app.primaryGenreName} application`, terms),
        signalType: "demand",
        strength: inferStrength(app.userRatingCount),
        sentiment: app.averageUserRating >= 4 ? "positive" : app.averageUserRating > 0 && app.averageUserRating < 3 ? "negative" : "neutral",
        createdAt: createdAt.toISOString(),
        collectedAt: collectedAt.toISOString(),
        provenance: "observed",
        reliability: Math.min(0.86, Math.round((0.64 + Math.log10(app.userRatingCount + 1) * 0.05) * 100) / 100),
        isDemo: false
      }));
      const competitors: Competitor[] = candidates.map(({ app, title, description }) => ({
        id: `${projectId}-apple-competitor-${app.trackId}`,
        name: title,
        url: app.trackViewUrl,
        positioning: description.slice(0, 220) || `${app.primaryGenreName} app by ${app.sellerName}`,
        pricing: app.formattedPrice || (app.price === 0 ? "Free download" : `${app.price}`),
        targetAudience: "Apple App Store users",
        strengths: app.userRatingCount ? [`${app.averageUserRating.toFixed(1)}/5 from ${app.userRatingCount} ratings`] : [],
        weaknesses: [],
        opportunity: "No market gap is inferred from store metadata alone; inspect observed reviews before positioning.",
        isDemo: false
      }));

      return {
        signals,
        competitors,
        channels: [],
        meta: {
          providerId: "apple-app-store",
          providerName: this.name,
          mode: "live",
          warnings: signals.length
            ? ["App Store ratings indicate adoption and competition, not willingness to pay or causal product satisfaction."]
            : ["The live App Store query completed but found no sufficiently relevant applications."]
        }
      };
    } catch {
      if (!this.fallback) throw new Error("APPLE_SEARCH_UNAVAILABLE");
      const fallback = await this.fallback.collect(idea, projectId);
      return {
        ...fallback,
        meta: {
          providerId: "apple-app-store",
          providerName: this.name,
          mode: "fallback",
          warnings: ["Apple App Store Search was unavailable; curated mock evidence was used for this analysis."]
        }
      };
    }
  }
}
