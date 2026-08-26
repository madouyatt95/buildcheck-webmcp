export const webMcpToolCatalog = [
  { name: "validate_idea", title: "Validate an idea", access: "write", description: "Analyze an idea, persist it in the current workspace, and use an external source only with explicit allow_external_lookup consent.", example: "Should I build an AI CRM for freelancers?" },
  { name: "roast_idea", title: "Roast an idea", access: "read", description: "Challenge an existing project or an idea using available evidence and clearly labeled assumptions.", example: "Roast project generic-ai-crm." },
  { name: "get_project_analysis", title: "Get project analysis", access: "read", description: "Return the latest complete analysis for a project owned by the current session.", example: "Get my BuildCheck analysis for InvoiceFlow." },
  { name: "generate_validation_mvp", title: "Generate validation MVP", access: "read", description: "Reduce a project or idea to the cheapest testable scope and machine-readable success criteria.", example: "What is the cheapest way to validate it?" },
  { name: "estimate_build_cost", title: "Estimate build cost", access: "read", description: "Return directional hour and AI-token ranges plus scope risk factors.", example: "Estimate the full build cost for RefundOps." },
  { name: "find_opportunities", title: "Find opportunities", access: "read", description: "Filter opportunities available in BuildCheck; demo mode uses the curated seed feed.", example: "Find B2B ecommerce opportunities above 80." },
  { name: "evaluate_before_build", title: "Run pre-build guard", access: "read", description: "Advise whether a full build is justified and return a structured warning plus smaller alternative when it is not.", example: "Should I build the full product now?" }
] as const;

export const buildCheckToolNames = new Set<string>(webMcpToolCatalog.map((tool) => tool.name));
