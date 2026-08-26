import type { Competitor, DistributionChannel, MarketSignal, StructuredIdea } from "@/lib/domain/types";
import type { DataSourceProvider, EvidenceBundle } from "@/lib/providers/contracts";
import { MockDataSourceProvider } from "@/lib/providers/mock-data-source-provider";

interface SourceConfig {
  id: string;
  provider: DataSourceProvider;
  maxSignals?: number;
}

function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = key(item).toLowerCase();
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

export class MultiSourceDataSourceProvider implements DataSourceProvider {
  readonly name: string;
  private readonly sources: SourceConfig[];
  private readonly fallback: DataSourceProvider;
  private readonly maxSignals: number;

  constructor(sources: SourceConfig[], options: { fallback?: DataSourceProvider; maxSignals?: number } = {}) {
    if (sources.length === 0) throw new Error("MULTI_SOURCE_REQUIRES_SOURCE");
    this.sources = sources;
    this.fallback = options.fallback || new MockDataSourceProvider();
    this.maxSignals = options.maxSignals || 12;
    this.name = sources.map((source) => source.provider.name).join(" + ");
  }

  async collect(idea: StructuredIdea, projectId: string): Promise<EvidenceBundle> {
    const results = await Promise.allSettled(
      this.sources.map(async (source) => ({ source, bundle: await source.provider.collect(idea, projectId) }))
    );
    const successful = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
    if (successful.length === 0) {
      const fallback = await this.fallback.collect(idea, projectId);
      return {
        ...fallback,
        meta: {
          providerId: this.sources.map((source) => source.id).join("+") ,
          providerName: this.name,
          mode: "fallback",
          warnings: ["All configured public sources were unavailable; curated mock evidence was used for this analysis."]
        }
      };
    }

    const signals = uniqueBy(
      successful.flatMap(({ source, bundle }) => bundle.signals.slice(0, source.maxSignals || 6)),
      (signal: MarketSignal) => signal.sourceUrl || `${signal.source}:${signal.title}`
    ).slice(0, this.maxSignals);
    const competitors = uniqueBy(
      successful.flatMap(({ bundle }) => bundle.competitors),
      (competitor: Competitor) => competitor.url || competitor.name
    );
    const channels = uniqueBy(
      successful.flatMap(({ bundle }) => bundle.channels),
      (channel: DistributionChannel) => channel.name
    );
    const failedSources = results.flatMap((result, index) => result.status === "rejected" ? [this.sources[index]?.provider.name] : []).filter(Boolean);
    const warnings = successful.flatMap(({ bundle }) => bundle.meta.warnings);
    if (failedSources.length) warnings.push(`${failedSources.join(", ")} unavailable; the analysis uses the remaining live source data only.`);

    return {
      signals,
      competitors,
      channels,
      meta: {
        providerId: this.sources.map((source) => source.id).join("+"),
        providerName: this.name,
        mode: "live",
        warnings
      }
    };
  }
}
