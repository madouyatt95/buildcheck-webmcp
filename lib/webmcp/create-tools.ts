import { z } from "zod";
import {
  evaluateBeforeBuildInputSchema,
  findOpportunitiesInputSchema,
  projectIdInputSchema,
  projectOrIdeaInputSchema,
  validateIdeaInputSchema
} from "@/lib/agent/schemas";
import { demoOpportunities } from "@/lib/demo/seed";
import type { IdeaInput, Project } from "@/lib/domain/types";
import type { RateLimiter } from "@/lib/security/rate-limit";
import {
  buildEstimate,
  buildRoastOutput,
  buildValidateIdeaOutput,
  buildValidationMvpOutput,
  evaluateBeforeBuild,
  filterOpportunities
} from "@/lib/services/agent-decision-service";
import { getLatestAnalysis, getOwnedProject } from "@/lib/services/project-service";
import { validationService } from "@/lib/services/validation-service";

type ToolLogLevel = "info" | "warn";

export interface BuildCheckWebMcpRuntime {
  currentUserId: string;
  getProjects: () => Project[];
  addIdea: (input: IdeaInput) => Promise<Project>;
  recordActivity: (activity: { tool: string; projectId?: string; outcome: "success" | "error" }) => void;
  rateLimiter: RateLimiter;
  translate?: (source: string) => string;
  elapsedTime?: () => number;
  timestamp?: () => string;
  log?: (level: ToolLogLevel, entry: Record<string, unknown>) => void;
}

function jsonSchema(schema: z.ZodType, translate: (source: string) => string): Record<string, unknown> {
  const localize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(localize);
    if (!value || typeof value !== "object") return value;
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      key === "description" && typeof item === "string" ? translate(item) : localize(item)
    ]));
  };
  return localize(z.toJSONSchema(schema)) as Record<string, unknown>;
}

function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new Error(`INVALID_INPUT: ${result.error.issues.map((issue) => issue.message).join("; ")}`);
  }
  return result.data;
}

function ideaInput(idea: string): IdeaInput {
  return { description: idea };
}

/**
 * Creates the native page-bound WebMCP tools around the same services used by
 * the human UI. Keeping this factory outside React lets the complete agent
 * contract be exercised in CI even when the test browser has no WebMCP rollout.
 */
export function createBuildCheckWebMcpTools(runtime: BuildCheckWebMcpRuntime): WebMcpTool[] {
  const translate = runtime.translate || ((source: string) => source);
  const elapsedTime = runtime.elapsedTime || (() => performance.now());
  const timestamp = runtime.timestamp || (() => new Date().toISOString());
  const log = runtime.log || ((level: ToolLogLevel, entry: Record<string, unknown>) => {
    console[level](JSON.stringify(entry));
  });

  async function runTool<T>(tool: string, work: () => Promise<T>, projectId?: string): Promise<T> {
    const startedAt = elapsedTime();
    const rate = await runtime.rateLimiter.check(`${runtime.currentUserId}:${tool}`);
    if (!rate.allowed) throw new Error(`RATE_LIMITED: retry in ${rate.retryAfterSeconds} seconds`);
    try {
      const result = await work();
      runtime.recordActivity({ tool, projectId, outcome: "success" });
      log("info", {
        event: "webmcp_tool_call",
        tool,
        duration_ms: Math.round(elapsedTime() - startedAt),
        success: true,
        user: runtime.currentUserId,
        project_id: projectId || null,
        timestamp: timestamp()
      });
      return result;
    } catch (error) {
      runtime.recordActivity({ tool, projectId, outcome: "error" });
      log("warn", {
        event: "webmcp_tool_call",
        tool,
        duration_ms: Math.round(elapsedTime() - startedAt),
        success: false,
        user: runtime.currentUserId,
        project_id: projectId || null,
        timestamp: timestamp()
      });
      throw error;
    }
  }

  async function projectFromInput(input: { project_id: string } | { idea: string }): Promise<Project> {
    if ("project_id" in input) {
      return getOwnedProject(runtime.getProjects(), input.project_id, runtime.currentUserId);
    }
    return (await validationService.validate(ideaInput(input.idea), { userId: runtime.currentUserId })).project;
  }

  const untrustedRead = { readOnlyHint: true, untrustedContentHint: true };
  return [
    {
      name: "validate_idea",
      title: translate("Validate an idea"),
      description: translate("Analyze and save an idea in the signed-in BuildCheck workspace. Returns structured scores, evidence provenance, cost ranges, risks, and the recommended minimum next action. External lookup occurs only when allow_external_lookup is explicitly true; otherwise configured sources remain mock-only."),
      inputSchema: jsonSchema(validateIdeaInputSchema, translate),
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: async (raw) => {
        const input = parseOrThrow(validateIdeaInputSchema, raw);
        return runTool("validate_idea", async () => {
          const project = await runtime.addIdea({
            description: input.idea,
            targetCustomer: input.target_customer,
            geography: input.geography,
            businessModel: input.business_model,
            allowExternalLookup: input.allow_external_lookup
          });
          return buildValidateIdeaOutput(project);
        });
      }
    },
    {
      name: "roast_idea",
      title: translate("Roast an idea"),
      description: translate("Challenge a project owned by the signed-in user or an idea supplied directly. Evidence-backed risks and hypothetical pivots are labeled separately."),
      inputSchema: jsonSchema(projectOrIdeaInputSchema, translate),
      annotations: untrustedRead,
      execute: async (raw) => {
        const input = parseOrThrow(projectOrIdeaInputSchema, raw);
        const projectId = "project_id" in input ? input.project_id : undefined;
        return runTool("roast_idea", async () => buildRoastOutput(await projectFromInput(input)), projectId);
      }
    },
    {
      name: "get_project_analysis",
      title: translate("Get project analysis"),
      description: translate("Read the latest analysis for a BuildCheck project owned by the signed-in user. Unknown and unauthorized IDs return the same generic error."),
      inputSchema: jsonSchema(projectIdInputSchema, translate),
      annotations: untrustedRead,
      execute: async (raw) => {
        const input = parseOrThrow(projectIdInputSchema, raw);
        return runTool("get_project_analysis", async () => buildValidateIdeaOutput(
          getOwnedProject(runtime.getProjects(), input.project_id, runtime.currentUserId)
        ), input.project_id);
      }
    },
    {
      name: "generate_validation_mvp",
      title: translate("Generate validation MVP"),
      description: translate("Return the smallest testable product, explicit exclusions, success metrics and a validation sequence for a project or idea."),
      inputSchema: jsonSchema(projectOrIdeaInputSchema, translate),
      annotations: untrustedRead,
      execute: async (raw) => {
        const input = parseOrThrow(projectOrIdeaInputSchema, raw);
        const projectId = "project_id" in input ? input.project_id : undefined;
        return runTool("generate_validation_mvp", async () => buildValidationMvpOutput(await projectFromInput(input)), projectId);
      }
    },
    {
      name: "estimate_build_cost",
      title: translate("Estimate build cost"),
      description: translate("Return directional hour and AI-token ranges. Estimates are scope heuristics, never exact usage measurements."),
      inputSchema: jsonSchema(projectOrIdeaInputSchema, translate),
      annotations: untrustedRead,
      execute: async (raw) => {
        const input = parseOrThrow(projectOrIdeaInputSchema, raw);
        const projectId = "project_id" in input ? input.project_id : undefined;
        return runTool("estimate_build_cost", async () => buildEstimate(getLatestAnalysis(await projectFromInput(input))), projectId);
      }
    },
    {
      name: "find_opportunities",
      title: translate("Find opportunities"),
      description: translate("Filter BuildCheck opportunities by category, audience, maximum complexity and minimum score. Results are explicitly marked as demo data."),
      inputSchema: jsonSchema(findOpportunitiesInputSchema, translate),
      annotations: untrustedRead,
      execute: async (raw) => {
        const input = parseOrThrow(findOpportunitiesInputSchema, raw);
        return runTool("find_opportunities", async () => filterOpportunities(demoOpportunities, input));
      }
    },
    {
      name: "evaluate_before_build",
      title: translate("Evaluate before build"),
      description: translate("Run BuildCheck's pre-build guard for a project or idea. Advises rather than blocks, and returns a structured full-build warning plus a smaller alternative when needed."),
      inputSchema: jsonSchema(evaluateBeforeBuildInputSchema, translate),
      annotations: untrustedRead,
      execute: async (raw) => {
        const input = parseOrThrow(evaluateBeforeBuildInputSchema, raw);
        const projectId = input.project_id;
        return runTool("evaluate_before_build", async () => {
          const project = projectId
            ? getOwnedProject(runtime.getProjects(), projectId, runtime.currentUserId)
            : (await validationService.validate(ideaInput(input.idea || ""), { userId: runtime.currentUserId })).project;
          return evaluateBeforeBuild(getLatestAnalysis(project), input.intended_build_scope);
        }, projectId);
      }
    }
  ];
}

export async function registerBuildCheckWebMcpTools(
  context: WebMcpModelContext,
  tools: WebMcpTool[],
  signal: AbortSignal
): Promise<void> {
  await Promise.all(tools.map((tool) => context.registerTool(tool, { signal })));
}
