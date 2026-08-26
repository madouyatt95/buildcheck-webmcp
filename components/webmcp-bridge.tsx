"use client";

import { useEffect, useRef } from "react";
import { useDemoStore } from "@/components/demo-store";
import { DemoRateLimiter } from "@/lib/security/rate-limit";
import { useLanguage } from "@/components/language-provider";
import {
  createBuildCheckWebMcpTools,
  registerBuildCheckWebMcpTools
} from "@/lib/webmcp/create-tools";

const limiter = new DemoRateLimiter({ validate_idea: 10, roast_idea: 20, find_opportunities: 30 });

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
    const registrations = createBuildCheckWebMcpTools({
      currentUserId,
      getProjects: () => state.current.projects,
      addIdea: (input) => state.current.addIdea(input),
      recordActivity: (activity) => state.current.recordActivity(activity),
      rateLimiter: limiter,
      translate: t
    });

    void registerBuildCheckWebMcpTools(context, registrations, controller.signal)
      .then(() => window.dispatchEvent(new CustomEvent("buildcheck:webmcp-status", { detail: { supported: true, registered: registrations.length } })))
      .catch((error: unknown) => window.dispatchEvent(new CustomEvent("buildcheck:webmcp-status", { detail: { supported: true, registered: 0, error: error instanceof Error ? error.message : "Registration failed" } })));

    return () => controller.abort();
  }, [t]);

  return null;
}
