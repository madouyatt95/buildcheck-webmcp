import { describe, expect, it } from "vitest";
import { translateText } from "@/components/language-provider";

describe("optional French localization", () => {
  it("keeps English as the default presentation", () => {
    expect(translateText("Dashboard", "en")).toBe("Dashboard");
    expect(translateText("BUILD", "en")).toBe("BUILD");
  });

  it("translates navigation and stable verdict labels without changing source values", () => {
    expect(translateText("Dashboard", "fr")).toBe("Tableau de bord");
    expect(translateText("BUILD", "fr")).toBe("CONSTRUIRE");
    expect(translateText("VALIDATE FIRST", "fr")).toBe("VALIDER D’ABORD");
  });

  it("localizes deterministic report templates", () => {
    expect(translateText("InvoiceFlow for independent consultants and freelance studios", "fr"))
      .toBe("InvoiceFlow pour consultants indépendants et studios freelances");
    expect(translateText("2 alternatives validate the category; recurring weaknesses create a possible wedge.", "fr"))
      .toContain("2 alternatives valident la catégorie");
  });
});
