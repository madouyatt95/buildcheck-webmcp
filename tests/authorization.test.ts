import { describe, expect, it } from "vitest";
import { createDemoProjects } from "@/lib/demo/seed";
import { getOwnedProject, ProjectAccessError } from "@/lib/services/project-service";

describe("project authorization", () => {
  it("returns a project only to its owner", async () => {
    const projects = await createDemoProjects();
    expect(getOwnedProject(projects, "invoiceflow", "demo-user").id).toBe("invoiceflow");
    expect(() => getOwnedProject(projects, "invoiceflow", "another-user")).toThrow(ProjectAccessError);
  });

  it("uses the same generic error for missing and unauthorized IDs", async () => {
    const projects = await createDemoProjects();
    for (const [id, user] of [["missing", "demo-user"], ["invoiceflow", "intruder"]] as const) {
      try { getOwnedProject(projects, id, user); } catch (error) { expect((error as Error).message).toBe("PROJECT_NOT_FOUND_OR_FORBIDDEN"); }
    }
  });
});
