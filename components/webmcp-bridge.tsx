"use client";

import { useEffect, useRef } from "react";
import { z } from "zod";
import { useDemoStore } from "@/components/demo-store";
import {
  evaluateBeforeBuildInputSchema,
  findOpportunitiesInputSchema,
  projectIdInputSchema,
  projectOrIdeaInputSchema,
  validateIdeaInputSchema
} from "@/lib/agent/schemas";
import { demoOpportunities } from "@/lib/demo/seed";
import type { Project } from "@/lib/domain/types";
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
import { DemoRateLimiter } from "@/lib/security/rate-limit";
import { useLanguage } from "@/components/language-provider";

const limiter = new DemoRateLimiter({ validate_idea: 10, roast_idea: 20, find_opportunities: 30 });

function jsonSchema(schema: z.ZodType, translate: (source: string) => string): Record<string, unknown> {
  const localize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(localize);
    if (!value || typeof value !== "object") return value;
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, key === "description" && typeof item === "string" ? translate(item) : localize(item)]));
  };
  return localize(z.toJSONSchema(schema)) as Record<string, unknown>;
}

function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new Error(`INVALID_INPUT: ${result.error.issues.map((issue) => issue.message).join("; ")}`);
  return result.data;
}

function ideaInput(idea: string) {
  return { description: idea };
}

export function WebMcpBridge() {
  const store = useDemoStore();
  const { t } = useLanguage();
  const state = useRef(store);

  useEffect(() => {
    state.current = store;
  }, [store]);

  useEffect(() => {
    const context = document.modelContext;
    if (typeof context?.registerTool !== "function") {
      window.dispatchEvent(new CustomEvent("buildcheck:webmcp-status", { detail: { supported: false, registered: 0 } }));
      return;
    }

    const controller = new AbortController();
    const currentUserId = "demo-user";

    async function runTool<T>(tool: string, work: () => Promise<T>, projectId?: string): Promise<T> {
      const startedAt = performance.now();
      const rate = await limiter.check(`${currentUserId}:${tool}`);
      if (!rate.allowed) throw new Error(`RATE_LIMITED: retry in ${rate.retryAfterSeconds} seconds`);
      try {
        const result = await work();
        state.current.recordActivity({ tool, projectId, outcome: "success" });
        console.info(JSON.stringify({ event: "webmcp_tool_call", tool, duration_ms: Math.round(performance.now() - startedAt), success: true, user: currentUserId, project_id: projectId || null, timestamp: new Date().toISOString() }));
        return result;
      } catch (error) {
        state.current.recordActivity({ tool, projectId, outcome: "error" });
        console.warn(JSON.stringify({ event: "webmcp_tool_call", tool, duration_ms: Math.round(performance.now() - startedAt), success: false, user: currentUserId, project_id: projectId || null, timestamp: new Date().toISOString() }));
        throw error;
      }
    }

    async function projectFromInput(input: { project_id: string } | { idea: string }): Promise<Project> {
      if ("project_id" in input) return getOwnedProject(state.current.projects, input.project_id, currentUserId);
      return (await validationService.validate(ideaInput(input.idea))).project;
    }

    const untrustedRead = { readOnlyHint: true, untrustedContentHint: true };
    const registrations: WebMcpTool[] = [
      {
        name: "validate_idea",
        title: t("Validate an idea"),
        description: t("Analyze and save an idea in the signed-in BuildCheck workspace. Returns structured scores, evidence provenance, cost ranges, risks, and the recommended minimum next action. External lookup occurs only when allow_external_lookup is explicitly true; otherwise configured sources remain mock-only."),
        inputSchema: jsonSchema(validateIdeaInputSchema, t),
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        execute: async (raw) => {
          const input = parseOrThrow(validateIdeaInputSchema, raw);
          return runTool("validate_idea", async () => {
            const project = await state.current.addIdea({ description: input.idea, targetCustomer: input.target_customer, geography: input.geography, businessModel: input.business_model, allowExternalLookup: input.allow_external_lookup });
            return buildValidateIdeaOutput(project);
          });
        }
      },
      {
        name: "roast_idea",
        title: t("Roast an idea"),
        description: t("Challenge a project owned by the signed-in user or an idea supplied directly. Evidence-backed risks and hypothetical pivots are labeled separately."),
        inputSchema: jsonSchema(projectOrIdeaInputSchema, t),
        annotations: untrustedRead,
        execute: async (raw) => {
          const input = parseOrThrow(projectOrIdeaInputSchema, raw);
          const projectId = "project_id" in input ? input.project_id : undefined;
          return runTool("roast_idea", async () => buildRoastOutput(await projectFromInput(input)), projectId);
        }
      },
      {
        name: "get_project_analysis",
        title: t("Get project analysis"),
        description: t("Read the latest analysis for a BuildCheck project owned by the signed-in user. Unknown and unauthorized IDs return the same generic error."),
        inputSchema: jsonSchema(projectIdInputSchema, t),
        annotations: untrustedRead,
        execute: async (raw) => {
          const input = parseOrThrow(projectIdInputSchema, raw);
          return runTool("get_project_analysis", async () => buildValidateIdeaOutput(getOwnedProject(state.current.projects, input.project_id, currentUserId)), input.project_id);
        }
      },
      {
        name: "generate_validation_mvp",
        title: t("Generate validation MVP"),
        description: t("Return the smallest testable product, explicit exclusions, success metrics and a validation sequence for a project or idea."),
        inputSchema: jsonSchema(projectOrIdeaInputSchema, t),
        annotations: untrustedRead,
        execute: async (raw) => {
          const input = parseOrThrow(projectOrIdeaInputSchema, raw);
          const projectId = "project_id" in input ? input.project_id : undefined;
          return runTool("generate_validation_mvp", async () => buildValidationMvpOutput(await projectFromInput(input)), projectId);
        }
      },
      {
        name: "estimate_build_cost",
        title: t("Estimate build cost"),
        description: t("Return directional hour and AI-token ranges. Estimates are scope heuristics, never exact usage measurements."),
        inputSchema: jsonSchema(projectOrIdeaInputSchema, t),
        annotations: untrustedRead,
        execute: async (raw) => {
          const input = parseOrThrow(projectOrIdeaInputSchema, raw);
          const projectId = "project_id" in input ? input.project_id : undefined;
          return runTool("estimate_build_cost", async () => buildEstimate(getLatestAnalysis(await projectFromInput(input))), projectId);
        }
      },
      {
        name: "find_opportunities",
        title: t("Find opportunities"),
        description: t("Filter BuildCheck opportunities by category, audience, maximum complexity and minimum score. Results are explicitly marked as demo data."),
        inputSchema: jsonSchema(findOpportunitiesInputSchema, t),
        annotations: untrustedRead,
        execute: async (raw) => {
          const input = parseOrThrow(findOpportunitiesInputSchema, raw);
          return runTool("find_opportunities", async () => filterOpportunities(demoOpportunities, input));
        }
      },
      {
        name: "evaluate_before_build",
        title: t("Evaluate before build"),
        description: t("Run BuildCheck's pre-build guard for a project or idea. Advises rather than blocks, and returns a structured full-build warning plus a smaller alternative when needed."),
        inputSchema: jsonSchema(evaluateBeforeBuildInputSchema, t),
        annotations: untrustedRead,
        execute: async (raw) => {
          const input = parseOrThrow(evaluateBeforeBuildInputSchema, raw);
          const projectId = input.project_id;
          return runTool("evaluate_before_build", async () => {
            const project = projectId
              ? getOwnedProject(state.current.projects, projectId, currentUserId)
              : (await validationService.validate(ideaInput(input.idea || ""))).project;
            return evaluateBeforeBuild(getLatestAnalysis(project), input.intended_build_scope);
          }, projectId);
        }
      }
    ];

    void Promise.all(registrations.map((tool) => context.registerTool(tool, { signal: controller.signal })))
      .then(() => window.dispatchEvent(new CustomEvent("buildcheck:webmcp-status", { detail: { supported: true, registered: registrations.length } })))
      .catch((error: unknown) => window.dispatchEvent(new CustomEvent("buildcheck:webmcp-status", { detail: { supported: true, registered: 0, error: error instanceof Error ? error.message : "Registration failed" } })));

    return () => controller.abort();
  }, [t]);

  return null;
}
