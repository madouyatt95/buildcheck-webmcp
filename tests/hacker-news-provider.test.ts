import { describe, expect, it } from "vitest";
import { HackerNewsDataSourceProvider } from "@/lib/providers/hacker-news-data-source-provider";
import { MockAIProvider } from "@/lib/providers/mock-ai-provider";
import { effectiveServerDataSource } from "@/lib/providers/server-provider-factory";

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

describe("HackerNewsDataSourceProvider", () => {
  it("requires explicit per-request consent before selecting the external source", () => {
    expect(effectiveServerDataSource("hacker-news", false)).toBe("mock");
    expect(effectiveServerDataSource("hacker-news", true)).toBe("hacker-news");
    expect(effectiveServerDataSource("github", true)).toBe("github");
    expect(effectiveServerDataSource("hacker-news+github", true)).toBe("hacker-news+github");
    expect(effectiveServerDataSource("mock", true)).toBe("mock");
  });

  it("maps live public discussions to observed, traceable signals", async () => {
    let requestedUrl = "";
    const provider = new HackerNewsDataSourceProvider({
      now: () => new Date("2026-08-26T10:00:00.000Z"),
      fallback: null,
      fetcher: async (input) => {
        requestedUrl = String(input);
        return new Response(JSON.stringify({
          hits: [{
            objectID: "424242",
            story_id: 424200,
            created_at: "2026-08-20T08:00:00.000Z",
            story_title: "Ask HN: how do freelancers chase overdue invoices?",
            comment_text: "We still use a <b>spreadsheet</b> and would pay for a calmer workflow.",
            points: 38,
            num_comments: 24
          }, {
            objectID: "999999",
            created_at: "2026-08-21T08:00:00.000Z",
            story_title: "An unrelated infrastructure discussion",
            comment_text: "Developers are comparing managed Kubernetes services.",
            points: 120,
            num_comments: 80
          }]
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
    });

    const result = await provider.collect(idea, "project-live");

    expect(requestedUrl).toContain("hn.algolia.com/api/v1/search_by_date");
    expect(requestedUrl).toContain("hitsPerPage=20");
    expect(result.meta).toMatchObject({ providerId: "hacker-news", mode: "live" });
    expect(result.competitors).toEqual([]);
    expect(result.channels).toEqual([]);
    expect(result.signals).toHaveLength(1);
    expect(result.signals[0]).toMatchObject({
      source: "Hacker News",
      sourceUrl: "https://news.ycombinator.com/item?id=424200",
      provenance: "observed",
      isDemo: false,
      signalType: "willingness_to_pay",
      strength: "strong",
      collectedAt: "2026-08-26T10:00:00.000Z"
    });
    expect(result.signals[0]?.excerpt).not.toContain("<b>");
  });

  it("keeps a successful empty live query distinct from demo fallback", async () => {
    const provider = new HackerNewsDataSourceProvider({
      fallback: null,
      fetcher: async () => new Response(JSON.stringify({ hits: [] }), { status: 200 })
    });

    const result = await provider.collect(idea, "project-empty");

    expect(result.meta.mode).toBe("live");
    expect(result.signals).toEqual([]);
    expect(result.meta.warnings[0]).toContain("found no sufficiently relevant");
  });

  it("falls back to visibly mocked evidence when the live source fails", async () => {
    const provider = new HackerNewsDataSourceProvider({
      fetcher: async () => new Response("unavailable", { status: 503 })
    });

    const result = await provider.collect(idea, "project-fallback");

    expect(result.meta).toMatchObject({ providerId: "hacker-news", mode: "fallback" });
    expect(result.signals.length).toBeGreaterThan(0);
    expect(result.signals.every((signal) => signal.isDemo && signal.provenance === "inferred")).toBe(true);
  });

  it("does not describe observed signals as demo evidence", async () => {
    const ai = new MockAIProvider();
    const summary = await ai.summarizeEvidence(idea, [{
      id: "hn-1",
      projectId: "project-live",
      source: "Hacker News",
      sourceUrl: "https://news.ycombinator.com/item?id=1",
      title: "Ask HN",
      excerpt: "Looking for an invoice workflow.",
      signalType: "demand",
      strength: "weak",
      sentiment: "neutral",
      createdAt: "2026-08-20T08:00:00.000Z",
      collectedAt: "2026-08-26T10:00:00.000Z",
      provenance: "observed",
      reliability: 0.58,
      isDemo: false
    }]);

    expect(summary).toContain("observed public-source signals");
    expect(summary).not.toContain("demo signals");
  });
});
