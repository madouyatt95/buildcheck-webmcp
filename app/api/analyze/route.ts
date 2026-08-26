import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerValidationService, effectiveServerDataSource, selectedServerDataSource } from "@/lib/providers/server-provider-factory";

const requestSchema = z.object({
  name: z.string().trim().max(80).optional(),
  description: z.string().trim().min(20).max(3000),
  targetCustomer: z.string().trim().max(180).optional(),
  problem: z.string().trim().max(400).optional(),
  businessModel: z.string().trim().max(180).optional(),
  competitors: z.string().trim().max(500).optional(),
  geography: z.string().trim().max(100).optional(),
  marketType: z.enum(["B2B", "B2C", "B2B2C"]).optional(),
  links: z.string().trim().max(600).optional(),
  allowExternalLookup: z.boolean().optional().default(false),
  projectId: z.string().trim().min(1).max(120).optional(),
  version: z.number().int().min(1).max(10_000).optional()
});

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 12_000) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  }

  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid idea input.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { projectId, version, allowExternalLookup, ...idea } = parsed.data;
    const configuredSource = selectedServerDataSource();
    const effectiveSource = effectiveServerDataSource(configuredSource, allowExternalLookup);
    const result = await createServerValidationService(effectiveSource).validate({ ...idea, allowExternalLookup }, {
      projectId,
      version,
      userId: "demo-user"
    });
    const evidenceMode = result.analysis.evidenceMeta.mode;
    const providerHeader = configuredSource !== "mock" && !allowExternalLookup
      ? "mock-external-consent-required"
      : evidenceMode === "fallback"
      ? `${configuredSource}-fallback-mock`
      : effectiveSource;
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
        "X-BuildCheck-Providers": providerHeader,
        "X-BuildCheck-Evidence-Mode": evidenceMode
      }
    });
  } catch {
    return NextResponse.json({ error: "Unable to analyze this idea." }, { status: 500 });
  }
}
