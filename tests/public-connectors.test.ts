import { describe, expect, it, vi } from "vitest";
import { AppleAppStoreDataSourceProvider } from "@/lib/providers/apple-app-store-data-source-provider";
import { BlueskyDataSourceProvider } from "@/lib/providers/bluesky-data-source-provider";
import { MastodonDataSourceProvider } from "@/lib/providers/mastodon-data-source-provider";
import { NpmRegistryDataSourceProvider } from "@/lib/providers/npm-registry-data-source-provider";
import { RssDataSourceProvider } from "@/lib/providers/rss-data-source-provider";
import { StackExchangeDataSourceProvider } from "@/lib/providers/stack-exchange-data-source-provider";

const idea = {
  name: "Invoice follow-up assistant",
  tagline: "For freelance studios",
  description: "Automate overdue invoice follow-up for freelance studios.",
  problem: "Freelancers manually chase overdue invoices.",
  targetCustomer: "Freelance design studios",
  businessModel: "Subscription",
  geography: "Global",
  marketType: "B2B" as const,
  keywords: ["invoice", "overdue", "freelance", "follow-up"],
  explicitCompetitors: []
};

const now = () => new Date("2026-08-26T10:00:00.000Z");

describe("free and open public connectors", () => {
  it("maps Stack Exchange excerpts and keeps an optional key server-side", async () => {
    let requestedUrl = "";
    const provider = new StackExchangeDataSourceProvider({
      now,
      fallback: null,
      key: "private-stack-key",
      fetcher: async (input) => {
        requestedUrl = String(input);
        return Response.json({
          items: [{
            question_id: 42,
            title: "How should freelancers automate overdue invoice follow-up?",
            excerpt: "Our freelance studio still handles every overdue invoice manually and needs a calmer workflow.",
            creation_date: 1787500800,
            score: 18,
            answer_count: 4
          }],
          quota_remaining: 9999
        });
      }
    });

    const result = await provider.collect(idea, "project-stack");

    expect(requestedUrl).toContain("api.stackexchange.com/2.3/search/excerpts");
    expect(requestedUrl).toContain("site=stackoverflow");
    expect(requestedUrl).toContain("key=private-stack-key");
    expect(result.meta).toMatchObject({ providerId: "stack-exchange", mode: "live" });
    expect(result.signals[0]).toMatchObject({
      source: "Stack Exchange",
      sourceUrl: "https://stackoverflow.com/questions/42",
      provenance: "observed",
      isDemo: false
    });
  });

  it("maps relevant App Store metadata to observed demand and a real competitor", async () => {
    const provider = new AppleAppStoreDataSourceProvider({
      now,
      fallback: null,
      country: "fr",
      fetcher: async () => Response.json({
        results: [{
          trackId: 123,
          trackName: "Invoice Calm",
          trackViewUrl: "https://apps.apple.com/fr/app/invoice-calm/id123",
          description: "Automate overdue invoice reminders for freelance studios and independent designers.",
          sellerName: "Example SAS",
          primaryGenreName: "Business",
          averageUserRating: 4.4,
          userRatingCount: 130,
          price: 0,
          formattedPrice: "Gratuit",
          currentVersionReleaseDate: "2026-08-20T08:00:00.000Z"
        }]
      })
    });

    const result = await provider.collect(idea, "project-apple");

    expect(result.meta).toMatchObject({ providerId: "apple-app-store", mode: "live" });
    expect(result.signals[0]).toMatchObject({ source: "Apple App Store", provenance: "observed", isDemo: false });
    expect(result.competitors[0]).toMatchObject({ name: "Invoice Calm", isDemo: false, weaknesses: [] });
  });

  it("deduplicates Mastodon posts returned by several hashtag timelines", async () => {
    const requestedUrls: string[] = [];
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      requestedUrls.push(String(input));
      return Response.json([{
      id: "1099",
      created_at: "2026-08-20T08:00:00.000Z",
      url: "https://mastodon.social/@studio/1099",
      content: "Our freelance studio has a painful overdue invoice follow-up problem.",
      replies_count: 4,
      reblogs_count: 3,
      favourites_count: 8,
      visibility: "public"
      }]);
    });
    const provider = new MastodonDataSourceProvider({ now, fallback: null, instances: [], fetcher });

    const result = await provider.collect(idea, "project-mastodon");

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(requestedUrls[0]).toContain("mastodon.social/api/v1/timelines/tag/");
    expect(result.signals).toHaveLength(1);
    expect(result.signals[0]).toMatchObject({ source: "Mastodon · mastodon.social", provenance: "observed", isDemo: false });
  });

  it("turns Bluesky AppView results into canonical public post links", async () => {
    let requestedUrl = "";
    const provider = new BlueskyDataSourceProvider({
      now,
      fallback: null,
      fetcher: async (input) => {
        requestedUrl = String(input);
        return Response.json({
          posts: [{
            uri: "at://did:plc:example/app.bsky.feed.post/3lxyz",
            author: { handle: "studio.example" },
            record: {
              text: "Freelance teams need a better overdue invoice workflow; manual follow-up is painful.",
              createdAt: "2026-08-20T08:00:00.000Z"
            },
            replyCount: 3,
            repostCount: 4,
            likeCount: 25,
            quoteCount: 1
          }]
        });
      }
    });

    const result = await provider.collect(idea, "project-bluesky");

    expect(requestedUrl).toContain("public.api.bsky.app/xrpc/app.bsky.feed.searchPosts");
    expect(result.signals[0]).toMatchObject({
      source: "Bluesky",
      sourceUrl: "https://bsky.app/profile/studio.example/post/3lxyz",
      provenance: "observed",
      isDemo: false
    });
  });

  it("parses configured RSS feeds without treating them as a general web search", async () => {
    const provider = new RssDataSourceProvider({
      now,
      fallback: null,
      feedUrls: ["https://community.example/feed.xml"],
      fetcher: async () => new Response(`<?xml version="1.0"?><rss><channel><item>
        <title><![CDATA[Freelance invoice workflows]]></title>
        <description><![CDATA[Why every overdue invoice still needs painful manual follow-up.]]></description>
        <link>https://community.example/posts/invoice-workflows</link>
        <pubDate>Wed, 20 Aug 2026 08:00:00 GMT</pubDate>
      </item></channel></rss>`, { headers: { "content-type": "application/rss+xml" } })
    });

    const result = await provider.collect(idea, "project-rss");

    expect(result.meta).toMatchObject({ providerId: "rss", mode: "live" });
    expect(result.signals[0]).toMatchObject({
      source: "RSS · community.example",
      sourceUrl: "https://community.example/posts/invoice-workflows",
      provenance: "observed",
      isDemo: false
    });
    expect(result.meta.warnings[0]).toContain("administrator-selected feeds");
  });

  it("makes no RSS request when an administrator has not configured feeds", async () => {
    const fetcher = vi.fn();
    const provider = new RssDataSourceProvider({ fetcher });

    const result = await provider.collect(idea, "project-rss-unconfigured");

    expect(fetcher).not.toHaveBeenCalled();
    expect(result.meta).toMatchObject({ providerId: "rss", mode: "fallback" });
    expect(result.meta.warnings[0]).toContain("RSS_FEED_URLS");
  });

  it("maps npm registry alternatives without calling popularity revenue evidence", async () => {
    const provider = new NpmRegistryDataSourceProvider({
      now,
      fallback: null,
      fetcher: async () => Response.json({
        objects: [{
          package: {
            name: "invoice-overdue-freelance",
            version: "2.1.0",
            description: "Automated overdue invoice follow-up for freelance studios.",
            date: "2026-08-20T08:00:00.000Z",
            publisher: { username: "builder" },
            links: { npm: "https://www.npmjs.com/package/invoice-overdue-freelance" }
          },
          score: { final: 0.82, detail: { quality: 0.8, popularity: 0.65, maintenance: 0.9 } }
        }]
      })
    });

    const result = await provider.collect(idea, "project-npm");

    expect(result.meta).toMatchObject({ providerId: "npm", mode: "live" });
    expect(result.signals[0]).toMatchObject({ source: "npm Registry", provenance: "observed", isDemo: false });
    expect(result.competitors[0]).toMatchObject({ name: "invoice-overdue-freelance", isDemo: false });
    expect(result.meta.warnings[0]).toContain("not revenue");
  });

  it("accepts the current npm API search score scale", async () => {
    const provider = new NpmRegistryDataSourceProvider({
      fallback: null,
      fetcher: async () => Response.json({
        objects: [{
          package: {
            name: "invoice-overdue-freelance",
            version: "3.0.0",
            description: "Overdue invoice follow-up for freelance studios.",
            date: "2026-08-20T08:00:00.000Z"
          },
          score: { final: 77.2, detail: { quality: 1, popularity: 1, maintenance: 1 } }
        }]
      })
    });

    const result = await provider.collect(idea, "project-npm-current-scale");

    expect(result.meta.mode).toBe("live");
    expect(result.signals).toHaveLength(1);
    expect(result.signals[0]?.reliability).toBeLessThanOrEqual(0.8);
    expect(result.competitors[0]?.strengths[0]).toBe("Registry score 77/100");
  });

  it("rejects upstream URLs outside the official App Store host", async () => {
    const provider = new AppleAppStoreDataSourceProvider({
      fallback: null,
      fetcher: async () => Response.json({
        results: [{
          trackId: 999,
          trackName: "Invoice Calm",
          trackViewUrl: "https://malicious.example/copied-app",
          description: "Automate overdue invoice reminders for freelance studios.",
          averageUserRating: 5,
          userRatingCount: 100,
          currentVersionReleaseDate: "2026-08-20T08:00:00.000Z"
        }]
      })
    });

    const result = await provider.collect(idea, "project-safe-url");

    expect(result.meta.mode).toBe("live");
    expect(result.signals).toEqual([]);
    expect(result.competitors).toEqual([]);
  });
});
