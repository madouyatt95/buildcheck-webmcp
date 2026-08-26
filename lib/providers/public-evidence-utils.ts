import type { MarketSignal, SignalStrength, SignalType, StructuredIdea } from "@/lib/domain/types";

const genericKeywords = new Set([
  "assistant", "automatic", "build", "developer", "developers", "engineering", "generic", "lightweight", "platform", "product", "service", "small", "software", "teams", "users"
]);

export function searchTermsFor(idea: StructuredIdea): string[] {
  const candidates = idea.keywords.filter((keyword) => !genericKeywords.has(keyword.toLowerCase()));
  return (candidates.length ? candidates : idea.keywords).slice(0, 3);
}

export function normalizeForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function relevanceScore(title: string, excerpt: string, terms: string[]): number {
  if (terms.length === 0) return 0;
  const normalizedTitle = normalizeForMatch(title);
  const normalizedText = normalizeForMatch(`${title} ${excerpt}`);
  const matches = terms.map((term) => {
    const normalizedTerm = normalizeForMatch(term);
    const needle = normalizedTerm.startsWith("postgres") ? "postgres" : normalizedTerm;
    return {
      inTitle: normalizedTitle.includes(needle),
      inText: normalizedText.includes(needle)
    };
  });
  const primary = matches[0];
  const secondaryMatches = matches.slice(1).filter((match) => match.inText).length;
  if (!primary?.inText || secondaryMatches === 0) return 0;
  return (primary.inTitle ? 4 : 2) + matches.slice(1).reduce((score, match) => score + (match.inTitle ? 3 : match.inText ? 1 : 0), 0);
}

export function inferSignalType(value: string): SignalType {
  const text = value.toLowerCase();
  if (/\b(pay|paid|price|pricing|cost|budget|subscription)\b/.test(text)) return "willingness_to_pay";
  if (/\b(spreadsheet|manual|workaround|copy.paste|script|hack)\b/.test(text)) return "workaround";
  if (/\b(wish|feature request|enhancement|should support|would love|needs? to support)\b/.test(text)) return "feature_request";
  if (/\b(frustrat|pain|problem|broken|bug|error|difficult|annoy|hate|fail|waste of time)\b/.test(text)) return "pain";
  return "demand";
}

export function inferStrength(engagement: number): SignalStrength {
  if (engagement >= 80) return "strong";
  if (engagement >= 20) return "moderate";
  return "weak";
}

export function inferSentiment(value: string): MarketSignal["sentiment"] {
  if (/\b(frustrat|pain|problem|broken|bug|error|difficult|annoy|hate|fail|waste)\b/i.test(value)) return "negative";
  if (/\b(love|great|recommend|useful|works well)\b/i.test(value)) return "positive";
  return "neutral";
}
