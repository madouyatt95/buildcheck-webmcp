import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  evaluateBeforeBuildInputSchema,
  findOpportunitiesInputSchema,
  projectIdInputSchema,
  projectOrIdeaInputSchema,
  validateIdeaInputSchema
} from "@/lib/agent/schemas";

describe("WebMCP input contracts", () => {
  it.each([
    ["validate_idea", validateIdeaInputSchema],
    ["roast_idea", projectOrIdeaInputSchema],
    ["get_project_analysis", projectIdInputSchema],
    ["generate_validation_mvp", projectOrIdeaInputSchema],
    ["estimate_build_cost", projectOrIdeaInputSchema],
    ["find_opportunities", findOpportunitiesInputSchema],
    ["evaluate_before_build", evaluateBeforeBuildInputSchema]
  ])("serializes %s to JSON Schema", (_name, schema) => {
    const jsonSchema = z.toJSONSchema(schema);

    expect(jsonSchema).toMatchObject({ $schema: "https://json-schema.org/draft/2020-12/schema" });
    expect(JSON.stringify(jsonSchema)).not.toContain("undefined");
  });
});
