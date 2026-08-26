"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { IdeaInput, Project, ValidationResult } from "@/lib/domain/types";
import { createDemoProjects } from "@/lib/demo/seed";
import { validationService } from "@/lib/services/validation-service";

interface DemoProfile {
  firstName: string;
  builds: string;
  goal: string;
  onboardingComplete: boolean;
}

export interface AgentActivity {
  id: string;
  tool: string;
  projectId?: string;
  outcome: "success" | "error";
  createdAt: string;
}

interface DemoStoreValue {
  projects: Project[];
  loading: boolean;
  profile: DemoProfile;
  activities: AgentActivity[];
  addIdea: (input: IdeaInput) => Promise<Project>;
  reanalyze: (projectId: string) => Promise<Project | null>;
  archiveProject: (projectId: string) => void;
  updateProfile: (profile: Partial<DemoProfile>) => void;
  recordActivity: (activity: Omit<AgentActivity, "id" | "createdAt">) => void;
  resetDemo: () => Promise<void>;
}

const STORAGE_KEY = "buildcheck-demo-state-v1";

const defaultProfile: DemoProfile = {
  firstName: "Alex",
  builds: "SaaS",
  goal: "Avoid wasting time",
  onboardingComplete: true
};

const DemoStoreContext = createContext<DemoStoreValue | null>(null);

async function validateWithConfiguredProvider(
  input: IdeaInput,
  context: { projectId?: string; version?: number } = {}
): Promise<ValidationResult> {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...input, ...context })
    });
    if (!response.ok) throw new Error("CONFIGURED_PROVIDER_UNAVAILABLE");
    const result = await response.json() as ValidationResult;
    if (!result.project?.id || !result.analysis?.evidenceMeta) throw new Error("INVALID_ANALYSIS_RESPONSE");
    return result;
  } catch {
    return validationService.validate(input, {
      projectId: context.projectId,
      version: context.version,
      userId: "demo-user"
    });
  }
}

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [profile, setProfile] = useState(defaultProfile);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { projects: Project[]; profile: DemoProfile; activities?: AgentActivity[] };
          if (active) {
            setProjects(parsed.projects);
            setProfile(parsed.profile);
            setActivities(parsed.activities || []);
            setLoading(false);
          }
          return;
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
      const seeded = await createDemoProjects();
      if (active) {
        setProjects(seeded);
        setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!loading) window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ projects, profile, activities }));
  }, [projects, profile, activities, loading]);

  const addIdea = useCallback(async (input: IdeaInput) => {
    const { project } = await validateWithConfiguredProvider(input);
    setProjects((current) => [project, ...current]);
    return project;
  }, []);

  const reanalyze = useCallback(async (projectId: string) => {
    const existing = projects.find((project) => project.id === projectId);
    if (!existing) return null;
    const nextVersion = existing.analyses.length + 1;
    const result = await validateWithConfiguredProvider(
      {
        name: existing.name,
        description: existing.description,
        targetCustomer: existing.targetCustomer,
        problem: existing.problem,
        businessModel: existing.businessModel,
        geography: existing.geography,
        marketType: existing.marketType,
        allowExternalLookup: existing.externalLookupAllowed
      },
      { projectId, version: nextVersion }
    );
    const updated: Project = {
      ...result.project,
      analyses: [result.analysis, ...existing.analyses]
    };
    setProjects((current) => current.map((project) => project.id === projectId ? updated : project));
    return updated;
  }, [projects]);

  const archiveProject = useCallback((projectId: string) => {
    setProjects((current) => current.map((project) =>
      project.id === projectId ? { ...project, status: "archived" } : project
    ));
  }, []);

  const updateProfile = useCallback((next: Partial<DemoProfile>) => {
    setProfile((current) => ({ ...current, ...next }));
  }, []);

  const recordActivity = useCallback((activity: Omit<AgentActivity, "id" | "createdAt">) => {
    const createdAt = new Date().toISOString();
    setActivities((current) => [{ ...activity, id: `activity-${Date.now()}`, createdAt }, ...current].slice(0, 40));
  }, []);

  const resetDemo = useCallback(async () => {
    setLoading(true);
    window.localStorage.removeItem(STORAGE_KEY);
    const seeded = await createDemoProjects();
    setProjects(seeded);
    setProfile(defaultProfile);
    setActivities([]);
    setLoading(false);
  }, []);

  const value = useMemo(() => ({
    projects,
    loading,
    profile,
    activities,
    addIdea,
    reanalyze,
    archiveProject,
    updateProfile,
    recordActivity,
    resetDemo
  }), [projects, loading, profile, activities, addIdea, reanalyze, archiveProject, updateProfile, recordActivity, resetDemo]);

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore() {
  const value = useContext(DemoStoreContext);
  if (!value) throw new Error("useDemoStore must be used inside DemoStoreProvider");
  return value;
}
