import { NextResponse } from "next/server";
import { liveSourceCount, selectedServerDataSource } from "@/lib/providers/server-provider-factory";

export function GET() {
  const dataSourceProvider = selectedServerDataSource();
  return NextResponse.json({
    ok: true,
    mode: dataSourceProvider === "mock" ? "demo" : "live-source-opt-in",
    aiProvider: "mock",
    dataSourceProvider,
    liveSourcesConfigured: liveSourceCount(dataSourceProvider),
    providerProbe: "not-run"
  });
}
