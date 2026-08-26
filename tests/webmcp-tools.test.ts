import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  buildEstimateSchema,
  fullBuildEvaluationSchema,
  opportunityOutputSchema,
  roastIdeaOutputSchema,
  validateIdeaOutputSchema,
  validationMvpOutputSchema
} from "@/lib/agent/schemas";
import { createDemoProjects } from "@/lib/demo/seed";
import type { IdeaInput } from "@/lib/domain/types";
import { DemoRateLimiter } from "@/lib/security/rate-limit";
import { validationService } from "@/lib/services/validation-service";
import { webMcpToolCatalog } from "@/lib/webmcp/tool-catalog";
import {
  createBuildCheckWebMcpTools,
  registerBuildCheckWebMcpTools
} from "@/lib/webmcp/create-tools";

function toolByName(tools: WebMcpTool[], name: string): WebMcpTool {
  const tool = tools.find((item) => item.name === name);
  if (!tool) throw new Error(`Missing tool: ${name}`);
  return tool;
}

async function execute(tool: WebMcpTool, input: Record<string, unknown>) {
  return tool.execute(input, { signal: new AbortController().signal });
}

async function setupRuntime() {
  let projects = await createDemoProjects();
  const activities: Array<{ tool: string; projectId?: string; outcome: "success" | "error" }> = [];
  const logs: Array<{ level: "info" | "warn"; entry: Record<string, unknown> }> = [];
  let elapsed = 0;
  const tools = createBuildCheckWebMcpTools({
    currentUserId: "demo-user",
    getProjects: () => projects,
    addIdea: async (input: IdeaInput) => {
      const { project } = await validationService.validate(input, { userId: "demo-user" });
      projects = [project, ...projects];
      return project;
    },
    recordActivity: (activity) => activities.push(activity),
    rateLimiter: new DemoRateLimiter({}, 60_000),
    elapsedTime: () => elapsed++,
    timestamp: () => "2026-08-26T12:00:00.000Z",
    log: (level, entry) => logs.push({ level, entry })
  });
  return { tools, activities, logs, projects: () => projects };
}

describe("native WebMCP tool runtime", () => {
  it("registers all seven BuildCheck tools with the native model context", async () => {
    const { tools } = await setupRuntime();
    const registered: WebMcpTool[] = [];
    const signals: Array<AbortSignal | undefined> = [];
    const context: WebMcpModelContext = {
      registerTool: async (tool, options) => {
        registered.push(tool);
        signals.push(options?.signal);
      },
      getTools: async () => registered
    };
    const controller = new AbortController();

    await registerBuildCheckWebMcpTools(context, tools, controller.signal);

    expect(registered.map((tool) => tool.name)).toEqual(webMcpToolCatalog.map((tool) => tool.name));
    expect(signals).toHaveLength(7);
    expect(signals.every((signal) => signal === controller.signal)).toBe(true);
    expect(registered[0]?.annotations?.readOnlyHint).toBe(false);
    expect(registered.slice(1).every((tool) => tool.annotations?.readOnlyHint === true)).toBe(true);
    expect(registered.every((tool) => tool.annotations?.untrustedContentHint === true)).toBe(true);
    expect(registered.every((tool) => tool.inputSchema && Object.keys(tool.inputSchema).length > 0)).toBe(true);
  });

  it("executes every handler and validates every structured output", async () => {
    const { tools, activities, logs, projects } = await setupRuntime();

    const validation = await execute(toolByName(tools, "validate_idea"), {
      idea: "A focused renewal reminder workflow for independent insurance brokers",
      target_customer: "Independent insurance brokers"
    });
    expect(() => validateIdeaOutputSchema.parse(validation)).not.toThrow();
    expect(projects()).toHaveLength(6);

    const analysis = await execute(toolByName(tools, "get_project_analysis"), { project_id: "invoiceflow" });
    expect(() => validateIdeaOutputSchema.parse(analysis)).not.toThrow();

    const roast = await execute(toolByName(tools, "roast_idea"), { project_id: "generic-ai-crm" });
    expect(() => roastIdeaOutputSchema.parse(roast)).not.toThrow();

    const mvp = await execute(toolByName(tools, "generate_validation_mvp"), { project_id: "invoiceflow" });
    expect(() => validationMvpOutputSchema.parse(mvp)).not.toThrow();

    const estimate = await execute(toolByName(tools, "estimate_build_cost"), { project_id: "refund-ops" });
    expect(() => buildEstimateSchema.parse(estimate)).not.toThrow();

    const opportunities = await execute(toolByName(tools, "find_opportunities"), {
      max_complexity: "MEDIUM",
      min_score: 70
    });
    expect(() => z.array(opportunityOutputSchema).parse(opportunities)).not.toThrow();

    const guard = await execute(toolByName(tools, "evaluate_before_build"), {
      project_id: "generic-ai-crm",
      intended_build_scope: "Full multi-platform SaaS"
    });
    expect(() => fullBuildEvaluationSchema.parse(guard)).not.toThrow();
    expect(fullBuildEvaluationSchema.parse(guard).warning?.code).toBe("FULL_BUILD_NOT_RECOMMENDED");

    expect(activities).toHaveLength(7);
    expect(activities.every((activity) => activity.outcome === "success")).toBe(true);
    expect(logs).toHaveLength(7);
    expect(logs.every(({ entry }) => entry.event === "webmcp_tool_call" && entry.success === true)).toBe(true);
  });

  it("rejects invalid and unauthorized inputs without leaking project existence", async () => {
    const { tools, activities } = await setupRuntime();

    await expect(execute(toolByName(tools, "validate_idea"), { idea: "Too short" }))
      .rejects.toThrow("INVALID_INPUT");
    await expect(execute(toolByName(tools, "get_project_analysis"), { project_id: "someone-elses-project" }))
      .rejects.toThrow("PROJECT_NOT_FOUND_OR_FORBIDDEN");

    expect(activities).toEqual([{
      tool: "get_project_analysis",
      projectId: "someone-elses-project",
      outcome: "error"
    }]);
  });
});
