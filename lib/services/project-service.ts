import type { Project } from "@/lib/domain/types";

export class ProjectAccessError extends Error {
  constructor() {
    super("PROJECT_NOT_FOUND_OR_FORBIDDEN");
    this.name = "ProjectAccessError";
  }
}

export function getOwnedProject(projects: Project[], projectId: string, userId: string): Project {
  const project = projects.find((item) => item.id === projectId && item.userId === userId);
  if (!project) throw new ProjectAccessError();
  return project;
}

export function getLatestAnalysis(project: Project) {
  const analysis = project.analyses[0];
  if (!analysis) throw new ProjectAccessError();
  return analysis;
}
