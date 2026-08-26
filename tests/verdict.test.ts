import { describe, expect, it } from "vitest";
import { getVerdict, verdictToStatus } from "@/lib/scoring/verdict";

describe("getVerdict", () => {
  it.each([
    [100, "BUILD"], [80, "BUILD"], [79, "VALIDATE FIRST"], [60, "VALIDATE FIRST"],
    [59, "PIVOT"], [40, "PIVOT"], [39, "KILL"], [0, "KILL"]
  ] as const)("maps %i to %s", (score, verdict) => {
    expect(getVerdict(score)).toBe(verdict);
  });

  it("maps verdicts to persisted statuses", () => {
    expect(verdictToStatus("VALIDATE FIRST")).toBe("validate");
    expect(verdictToStatus("KILL")).toBe("kill");
  });
});
