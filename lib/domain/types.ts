export type ProjectStatus =
  | "draft"
  | "analyzing"
  | "build"
  | "validate"
  | "pivot"
  | "kill"
  | "archived";

export type Verdict = "BUILD" | "VALIDATE FIRST" | "PIVOT" | "KILL";

export type SignalType =
  | "pain"
  | "demand"
  | "willingness_to_pay"
  | "competitor_complaint"
  | "workaround"
  | "feature_request"
  | "churn_risk"
  | "distribution"
  | "market_growth";

export type SignalStrength = "weak" | "moderate" | "strong";
export type Sentiment = "negative" | "neutral" | "positive";
export type EvidenceProvenance = "observed" | "inferred" | "generated";

export interface IdeaInput {
  name?: string;
  description: string;
  targetCustomer?: string;
  problem?: string;
  businessModel?: string;
  competitors?: string;
  geography?: string;
  marketType?: "B2B" | "B2C" | "B2B2C";
  links?: string;
  allowExternalLookup?: boolean;
}

export interface StructuredIdea {
  name: string;
  tagline: string;
  description: string;
  problem: string;
  targetCustomer: string;
  businessModel: string;
  geography: string;
  marketType: "B2B" | "B2C" | "B2B2C";
  keywords: string[];
  explicitCompetitors: string[];
}

export interface MarketSignal {
  id: string;
  projectId: string;
  source: string;
  sourceUrl: string;
  title: string;
  excerpt: string;
  signalType: SignalType;
  strength: SignalStrength;
  sentiment: Sentiment;
  createdAt: string;
  collectedAt: string;
  provenance: EvidenceProvenance;
  reliability: number;
  isDemo: boolean;
}

export interface Competitor {
  id: string;
  name: string;
  url: string;
  positioning: string;
  pricing: string;
  targetAudience: string;
  strengths: string[];
  weaknesses: string[];
  opportunity: string;
  isDemo: boolean;
}

export type DimensionKey =
  | "demand"
  | "pain"
  | "willingnessToPay"
  | "distribution"
  | "competitionOpportunity"
  | "buildSimplicity"
  | "defensibility";

export interface ScoreDimension {
  key: DimensionKey;
  label: string;
  score: number;
  maxPoints: number;
  weightedPoints: number;
  justification: string;
  evidenceIds: string[];
}

export interface DistributionChannel {
  name: string;
  potential: "Low" | "Medium" | "Strong";
  detail: string;
  rationale: string;
}

export interface BuildComplexityInput {
  screens: number;
  integrations: number;
  roles: number;
  entities: number;
  hasAuth: boolean;
  hasPayments: boolean;
  hasRealtime: boolean;
  hasNativeApp: boolean;
  aiFeatures: number;
}

export interface BuildComplexityEstimate {
  level: "Low" | "Medium" | "High" | "Very high";
  points: number;
  estimatedHours: [number, number];
  estimatedTokens: number;
  debuggingIterations: number;
  drivers: string[];
}

export interface MvpRecommendation {
  scope: string;
  include: string[];
  exclude: string[];
  hypothesis: string;
  successCriteria: string[];
  estimatedHours: string;
}

export interface Pivot {
  concept: string;
  targetAudience: string;
  whyStronger: string;
  estimatedScore: number;
  keyDifference: string;
}

export interface Analysis {
  id: string;
  projectId: string;
  version: number;
  buildScore: number;
  verdict: Verdict;
  confidenceScore: number;
  summary: string;
  dimensions: ScoreDimension[];
  signals: MarketSignal[];
  competitors: Competitor[];
  channels: DistributionChannel[];
  frustrations: Array<{ label: string; mentions: number; intensity: "High" | "Medium" }>;
  firstHundredUsers: string[];
  complexity: BuildComplexityEstimate;
  mvp: MvpRecommendation;
  pivots: Pivot[];
  roast: {
    risks: string[];
    changeOurMind: string[];
    betterAngle: string;
    estimatedScore: number;
  };
  evidenceMeta: {
    providerId: string;
    providerName: string;
    mode: "demo" | "live" | "fallback";
    warnings: string[];
  };
  createdAt: string;
  isDemo: boolean;
}

export interface Project {
  id: string;
  userId: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  problem: string;
  targetCustomer: string;
  businessModel: string;
  geography: string;
  marketType: "B2B" | "B2C" | "B2B2C";
  externalLookupAllowed: boolean;
  status: ProjectStatus;
  updatedAt: string;
  analyses: Analysis[];
}

export interface Opportunity {
  id: string;
  title: string;
  slug: string;
  description: string;
  problem: string;
  audience: string;
  category: string;
  marketType: "B2B" | "B2C" | "B2B2C";
  opportunityScore: number;
  painScore: number;
  demandScore: number;
  competition: "Low" | "Medium" | "High";
  complexity: "Low" | "Medium" | "High";
  pricingMin: number;
  pricingMax: number;
  evidenceCount: number;
  complaints: number;
  featureRequests: number;
  competitors: number;
  isDemo: boolean;
}

export interface ValidationResult {
  project: Project;
  analysis: Analysis;
}
