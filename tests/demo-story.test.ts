import { describe, expect, it } from "vitest";
import { createDemoProjects } from "@/lib/demo/seed";

describe("WebMCP Challenge demo story", () => {
  it("keeps the generic CRM in a high-confidence pivot range", async () => {
    const projects = await createDemoProjects();
    const crm = projects.find((item) => item.id === "generic-ai-crm")!;
    const analysis = crm.analyses[0]!;
    expect(analysis.buildScore).toBeGreaterThanOrEqual(34);
    expect(analysis.buildScore).toBeLessThanOrEqual(46);
    expect(analysis.verdict).toBe("PIVOT");
    expect(analysis.confidenceScore).toBeGreaterThanOrEqual(65);
    expect(analysis.pivots[0]?.concept).toBe("CRM for independent property photographers");
  });

  it("keeps invoice follow-up in the validate-first range with a 4–6 hour MVP", async () => {
    const projects = await createDemoProjects();
    const invoice = projects.find((item) => item.id === "invoiceflow")!;
    const analysis = invoice.analyses[0]!;
    expect(analysis.buildScore).toBeGreaterThanOrEqual(65);
    expect(analysis.buildScore).toBeLessThan(80);
    expect(analysis.mvp.estimatedHours).toBe("4–6 hours");
  });
});
