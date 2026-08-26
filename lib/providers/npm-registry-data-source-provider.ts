import { z } from "zod";
import type { Competitor, MarketSignal, StructuredIdea } from "@/lib/domain/types";
import type { DataSourceProvider, EvidenceBundle } from "@/lib/providers/contracts";
import { MockDataSourceProvider } from "@/lib/providers/mock-data-source-provider";
import { inferStrength, plainPublicText, relevanceScore, safeEvidenceId, searchTermsFor } from "@/lib/providers/public-evidence-utils";

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface NpmRegistryProviderOptions {
  fetcher?: Fetcher;
  timeoutMs?: number;
  fallback?: DataSourceProvider | null;
  now?: () => Date;
}

const packageSchema = z.object({
  name: z.string(),
  version: z.string().optional().default("unknown"),
  description: z.string().optional().default(""),
  date: z.string().optional(),
  publisher: z.object({ username: z.string().optional() }).passthrough().optional(),
  links: z.object({ npm: z.string().url().optional(), homepage: z.string().url().optional(), repository: z.string().url().optional() }).passthrough().optional()
}).passthrough();

const objectSchema = z.object({
  package: packageSchema,
  score: z.object({
    final: z.number().nonnegative(),
    detail: z.object({
      quality: z.number().min(0).max(1).optional().default(0),
      popularity: z.number().min(0).max(1).optional().default(0),
      maintenance: z.number().min(0).max(1).optional().default(0)
    }).passthrough()
  }).passthrough()
}).passthrough();

const responseSchema = z.object({ objects: z.array(objectSchema) }).passthrough();

function npmPackageUrl(name: string): string | null {
  if (!/^(@[a-z0-9_.-]+\/)?[a-z0-9_.-]+$/i.test(name)) return null;
  return `https://www.npmjs.com/package/${name}`;
}

export class NpmRegistryDataSourceProvider implements DataSourceProvider {
  readonly name = "npm · Public Registry Search";
  private readonly fetcher: Fetcher;
  private readonly timeoutMs: number;
  private readonly fallback: DataSourceProvider | null;
  private readonly now: () => Date;

  constructor(options: NpmRegistryProviderOptions = {}) {
    this.fetcher = options.fetcher || fetch;
    this.timeoutMs = options.timeoutMs || 4500;
    this.fallback = options.fallback === undefined ? new MockDataSourceProvider() : options.fallback;
    this.now = options.now || (() => new Date());
  }

  async collect(idea: StructuredIdea, projectId: string): Promise<EvidenceBundle> {
    const collectedAt = this.now();
    const terms = searchTermsFor(idea);
    const endpoint = new URL("https://registry.npmjs.org/-/v1/search");
    endpoint.searchParams.set("text", terms.join(" ") || idea.name);
    endpoint.searchParams.set("size", "20");
    endpoint.searchParams.set("quality", "0.4");
    endpoint.searchParams.set("popularity", "0.4");
    endpoint.searchParams.set("maintenance", "0.2");

    try {
      const response = await this.fetcher(endpoint, {
        headers: { Accept: "application/json", "User-Agent": "BuildCheck" },
        cache: "no-store",
        signal: AbortSignal.timeout(this.timeoutMs)
      });
      if (!response.ok) throw new Error("NPM_SEARCH_UNAVAILABLE");
      const parsed = responseSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("NPM_SEARCH_INVALID_RESPONSE");

      const candidates = parsed.data.objects.flatMap((item) => {
        const title = item.package.name.slice(0, 120);
        const description = plainPublicText(item.package.description).slice(0, 360);
        const sourceUrl = npmPackageUrl(item.package.name);
        const relevance = relevanceScore(title, description, terms);
        const createdAt = new Date(item.package.date || collectedAt.toISOString());
        if (!title || !description || relevance === 0 || !sourceUrl || Number.isNaN(createdAt.getTime())) return [];
        return [{ item, title, description, sourceUrl, relevance, createdAt }];
      }).sort((a, b) => b.relevance - a.relevance || b.item.score.final - a.item.score.final).slice(0, 8);

      const signals: MarketSignal[] = candidates.map(({ item, title, description, sourceUrl, createdAt }) => ({
        id: `${projectId}-npm-${safeEvidenceId(item.package.name)}`,
        projectId,
        source: "npm Registry",
        sourceUrl,
        title: `${title} · v${item.package.version}`,
        excerpt: description,
        signalType: "demand",
        strength: inferStrength(Math.round(item.score.detail.popularity * 100)),
        sentiment: "neutral",
        createdAt: createdAt.toISOString(),
        collectedAt: collectedAt.toISOString(),
        provenance: "observed",
        reliability: Math.min(0.8, Math.round((0.58 + (item.score.final > 1 ? Math.min(1, item.score.final / 100) : item.score.final) * 0.2) * 100) / 100),
        isDemo: false
      }));
      const competitors: Competitor[] = candidates.map(({ item, title, description, sourceUrl }) => ({
        id: `${projectId}-npm-competitor-${safeEvidenceId(item.package.name)}`,
        name: title,
        url: sourceUrl,
        positioning: description,
        pricing: "Open-source package metadata",
        targetAudience: "JavaScript developers",
        strengths: [
          `Registry score ${Math.round((item.score.final > 1 ? Math.min(1, item.score.final / 100) : item.score.final) * 100)}/100`,
          `Popularity ${Math.round(item.score.detail.popularity * 100)}/100`
        ],
        weaknesses: [],
        opportunity: "Package metadata proves technical alternatives exist; it does not establish a commercial market gap.",
        isDemo: false
      }));

      return {
        signals,
        competitors,
        channels: signals.length ? [{
          name: "npm Registry",
          potential: "Medium",
          detail: `${signals.length} relevant public packages`,
          rationale: "Strong discovery channel for JavaScript developer tools; irrelevant for most non-technical audiences."
        }] : [],
        meta: {
          providerId: "npm",
          providerName: this.name,
          mode: "live",
          warnings: signals.length
            ? ["npm popularity is a normalized registry metric, not revenue, active-user or willingness-to-pay evidence."]
            : ["The public npm query completed but found no sufficiently relevant packages."]
        }
      };
    } catch {
      if (!this.fallback) throw new Error("NPM_SEARCH_UNAVAILABLE");
      const fallback = await this.fallback.collect(idea, projectId);
      return {
        ...fallback,
        meta: {
          providerId: "npm",
          providerName: this.name,
          mode: "fallback",
          warnings: ["npm public registry search was unavailable; curated mock evidence was used for this analysis."]
        }
      };
    }
  }
}
