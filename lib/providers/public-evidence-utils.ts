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

export function plainPublicText(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&apos;|&#x27;|&#39;/gi, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Math.min(0x10ffff, Number(code))))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) => String.fromCodePoint(Math.min(0x10ffff, Number.parseInt(code, 16))))
    .replace(/[#>*_~|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerptAroundTerms(value: string, terms: string[], limit = 360): string {
  const text = plainPublicText(value).slice(0, 12_000);
  const normalized = text.toLowerCase();
  const firstMatch = terms
    .map((term) => normalized.indexOf(term.toLowerCase()))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  const start = firstMatch === undefined ? 0 : Math.max(0, firstMatch - 90);
  return text.slice(start, start + limit).trim();
}

export function safeEvidenceId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100);
}

export function isSafePublicHttpsUrl(value: string, allowedHosts?: string[]): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) return false;
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === "localhost"
      || hostname.endsWith(".local")
      || hostname === "[::1]"
      || /^\[(?:fc|fd|fe80):/i.test(hostname)
      || /^(?:0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(hostname)
    ) return false;
    return !allowedHosts?.length || allowedHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}
