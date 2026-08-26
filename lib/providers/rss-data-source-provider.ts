import type { MarketSignal, StructuredIdea } from "@/lib/domain/types";
import type { DataSourceProvider, EvidenceBundle } from "@/lib/providers/contracts";
import { MockDataSourceProvider } from "@/lib/providers/mock-data-source-provider";
import {
  inferSentiment,
  inferSignalType,
  isSafePublicHttpsUrl,
  plainPublicText,
  relevanceScore,
  safeEvidenceId,
  searchTermsFor
} from "@/lib/providers/public-evidence-utils";

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface RssProviderOptions {
  fetcher?: Fetcher;
  timeoutMs?: number;
  feedUrls?: string[];
  fallback?: DataSourceProvider | null;
  now?: () => Date;
}

interface FeedItem {
  title: string;
  description: string;
  link: string;
  publishedAt?: string;
}

function escaped(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tagValue(block: string, names: string[]): string {
  for (const name of names) {
    const match = block.match(new RegExp(`<${escaped(name)}\\b[^>]*>([\\s\\S]*?)<\\/${escaped(name)}>`, "i"));
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function itemLink(block: string): string {
  const textLink = tagValue(block, ["link"]);
  if (textLink) return textLink.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1").replace(/&amp;/g, "&").trim();
  const atomLink = block.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/i)?.[1];
  if (atomLink) return atomLink.replace(/&amp;/g, "&").trim();
  return tagValue(block, ["guid", "id"]).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1").replace(/&amp;/g, "&").trim();
}

function parseFeed(xml: string): FeedItem[] {
  const blocks = [
    ...(xml.match(/<item\b[\s\S]*?<\/item>/gi) || []),
    ...(xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [])
  ].slice(0, 50);
  return blocks.map((block) => ({
    title: plainPublicText(tagValue(block, ["title"])),
    description: plainPublicText(tagValue(block, ["description", "summary", "content", "content:encoded"])),
    link: itemLink(block),
    publishedAt: plainPublicText(tagValue(block, ["pubDate", "published", "updated", "dc:date"])) || undefined
  }));
}

export class RssDataSourceProvider implements DataSourceProvider {
  readonly name = "RSS/Atom · Configured public feeds";
  private readonly fetcher: Fetcher;
  private readonly timeoutMs: number;
  private readonly feedUrls: string[];
  private readonly fallback: DataSourceProvider | null;
  private readonly now: () => Date;

  constructor(options: RssProviderOptions = {}) {
    this.fetcher = options.fetcher || fetch;
    this.timeoutMs = options.timeoutMs || 4500;
    this.feedUrls = [...new Set((options.feedUrls || []).filter((value) => isSafePublicHttpsUrl(value)))].slice(0, 5);
    this.fallback = options.fallback === undefined ? new MockDataSourceProvider() : options.fallback;
    this.now = options.now || (() => new Date());
  }

  async collect(idea: StructuredIdea, projectId: string): Promise<EvidenceBundle> {
    const collectedAt = this.now();
    const terms = searchTermsFor(idea);
    if (!this.feedUrls.length) {
      if (!this.fallback) throw new Error("RSS_NOT_CONFIGURED");
      const fallback = await this.fallback.collect(idea, projectId);
      return {
        ...fallback,
        meta: {
          providerId: "rss",
          providerName: this.name,
          mode: "fallback",
          warnings: ["RSS connector is ready but RSS_FEED_URLS contains no public feeds, so curated mock evidence was used."]
        }
      };
    }

    try {
      const results = await Promise.allSettled(this.feedUrls.map(async (feedUrl) => {
        const response = await this.fetcher(feedUrl, {
          headers: { Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml", "User-Agent": "BuildCheck" },
          cache: "no-store",
          signal: AbortSignal.timeout(this.timeoutMs)
        });
        const contentLength = Number(response.headers.get("content-length") || 0);
        if (!response.ok || contentLength > 1_000_000) throw new Error("RSS_FEED_UNAVAILABLE");
        const xml = (await response.text()).slice(0, 1_000_000);
        return { feedUrl, items: parseFeed(xml) };
      }));
      const successful = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
      if (!successful.length) throw new Error("RSS_UNAVAILABLE");
      const seen = new Set<string>();
      const candidates = successful.flatMap(({ feedUrl, items }) => {
        const hostname = new URL(feedUrl).hostname;
        return items.flatMap((item, index) => {
          const title = item.title.slice(0, 120);
          const excerpt = item.description.slice(0, 360);
          const relevance = relevanceScore(title, excerpt, terms);
          const createdAt = new Date(item.publishedAt || collectedAt.toISOString());
          if (!title || !excerpt || relevance === 0 || !isSafePublicHttpsUrl(item.link) || seen.has(item.link) || Number.isNaN(createdAt.getTime())) return [];
          seen.add(item.link);
          const signal: MarketSignal = {
            id: `${projectId}-rss-${safeEvidenceId(hostname)}-${safeEvidenceId(item.link).slice(-40) || index}`,
            projectId,
            source: `RSS · ${hostname}`,
            sourceUrl: item.link,
            title,
            excerpt,
            signalType: inferSignalType(`${title} ${excerpt}`),
            strength: "weak",
            sentiment: inferSentiment(`${title} ${excerpt}`),
            createdAt: createdAt.toISOString(),
            collectedAt: collectedAt.toISOString(),
            provenance: "observed",
            reliability: 0.62,
            isDemo: false
          };
          return [{ signal, relevance, hostname }];
        });
      });
      const signals = candidates.sort((a, b) => b.relevance - a.relevance).slice(0, 8).map(({ signal }) => signal);
      const hostnames = [...new Set(candidates.map(({ hostname }) => hostname))];
      const failedCount = results.length - successful.length;

      return {
        signals,
        competitors: [],
        channels: hostnames.map((hostname) => ({
          name: `RSS · ${hostname}`,
          potential: "Low" as const,
          detail: "Configured public feed with relevant entries",
          rationale: "Useful only when the feed represents a deliberately selected target community or publication."
        })),
        meta: {
          providerId: "rss",
          providerName: this.name,
          mode: "live",
          warnings: [
            signals.length
              ? "RSS evidence reflects only administrator-selected feeds and is not a general web search."
              : "Configured RSS feeds responded but contained no sufficiently relevant entries.",
            ...(failedCount ? [`${failedCount} configured RSS feed(s) were unavailable; successful feeds were retained.`] : [])
          ]
        }
      };
    } catch {
      if (!this.fallback) throw new Error("RSS_UNAVAILABLE");
      const fallback = await this.fallback.collect(idea, projectId);
      return {
        ...fallback,
        meta: {
          providerId: "rss",
          providerName: this.name,
          mode: "fallback",
          warnings: ["All configured RSS feeds were unavailable; curated mock evidence was used for this analysis."]
        }
      };
    }
  }
}
