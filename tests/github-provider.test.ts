import { describe, expect, it } from "vitest";
import { GitHubIssuesDataSourceProvider } from "@/lib/providers/github-issues-data-source-provider";

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

function githubResponse() {
  return {
    items: [{
      id: 424242,
      html_url: "https://github.com/example/billing/issues/42",
      repository_url: "https://api.github.com/repos/example/billing",
      title: "Feature request: invoice reminders for freelance teams",
      body: "Overdue invoices still require repeated follow-up. A calmer reminder flow would help.",
      created_at: "2026-08-20T08:00:00.000Z",
      updated_at: "2026-08-25T08:00:00.000Z",
      comments: 10,
      reactions: { total_count: 3 }
    }, {
      id: 999999,
      html_url: "https://github.com/example/cluster/issues/99",
      repository_url: "https://api.github.com/repos/example/cluster",
      title: "Kubernetes cluster autoscaling",
      body: "Tune infrastructure nodes and pod scheduling.",
      created_at: "2026-08-21T08:00:00.000Z",
      updated_at: "2026-08-25T08:00:00.000Z",
      comments: 80,
      reactions: { total_count: 40 }
    }, {
      id: 777777,
      html_url: "https://github.com/example/billing/issues/77",
      repository_url: "https://api.github.com/repos/example/billing",
      title: "Dependency Dashboard",
      body: "This issue lists Renovate updates and detected dependencies for invoice overdue freelance packages.",
      created_at: "2026-08-22T08:00:00.000Z",
      updated_at: "2026-08-25T08:00:00.000Z",
      comments: 120,
      reactions: { total_count: 50 }
    }]
  };
}

describe("GitHubIssuesDataSourceProvider", () => {
  it("maps relevant public issues to observed evidence", async () => {
    let requestedUrl = "";
    let requestedHeaders: HeadersInit | undefined;
    const provider = new GitHubIssuesDataSourceProvider({
      now: () => new Date("2026-08-26T10:00:00.000Z"),
      fallback: null,
      token: "server-token",
      fetcher: async (input, init) => {
        requestedUrl = String(input);
        requestedHeaders = init?.headers;
        return new Response(JSON.stringify(githubResponse()), { status: 200 });
      }
    });

    const result = await provider.collect(idea, "project-live");
    const headers = new Headers(requestedHeaders);

    expect(requestedUrl).toContain("api.github.com/search/issues");
    expect(requestedUrl).toContain("per_page=20");
    expect(requestedUrl).toContain("in%3Atitle%2Cbody");
    expect(requestedUrl).not.toContain("server-token");
    expect(headers.get("authorization")).toBe("Bearer server-token");
    expect(headers.get("x-github-api-version")).toBe("2022-11-28");
    expect(result.meta).toMatchObject({ providerId: "github", mode: "live" });
    expect(result.signals).toHaveLength(1);
    expect(result.signals[0]).toMatchObject({
      source: "GitHub Issues",
      sourceUrl: "https://github.com/example/billing/issues/42",
      provenance: "observed",
      isDemo: false,
      signalType: "feature_request",
      strength: "moderate",
      collectedAt: "2026-08-26T10:00:00.000Z"
    });
  });

  it("does not send an authorization header without a configured token", async () => {
    let requestedHeaders: HeadersInit | undefined;
    const provider = new GitHubIssuesDataSourceProvider({
      fallback: null,
      fetcher: async (_input, init) => {
        requestedHeaders = init?.headers;
        return new Response(JSON.stringify({ items: [] }), { status: 200 });
      }
    });

    await provider.collect(idea, "project-public");

    expect(new Headers(requestedHeaders).has("authorization")).toBe(false);
  });

  it("rejects non-GitHub evidence URLs returned by an invalid upstream payload", async () => {
    const payload = githubResponse();
    payload.items[0]!.html_url = "https://example.com/copied-issue";
    const provider = new GitHubIssuesDataSourceProvider({
      fallback: null,
      fetcher: async () => new Response(JSON.stringify(payload), { status: 200 })
    });

    const result = await provider.collect(idea, "project-safe-url");

    expect(result.meta.mode).toBe("live");
    expect(result.signals).toEqual([]);
  });

  it("falls back visibly when GitHub Search is unavailable", async () => {
    const provider = new GitHubIssuesDataSourceProvider({
      fetcher: async () => new Response("rate limited", { status: 403 })
    });

    const result = await provider.collect(idea, "project-fallback");

    expect(result.meta).toMatchObject({ providerId: "github", mode: "fallback" });
    expect(result.signals.length).toBeGreaterThan(0);
    expect(result.signals.every((signal) => signal.isDemo)).toBe(true);
  });
});
