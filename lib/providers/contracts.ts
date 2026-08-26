import type {
  Competitor,
  DistributionChannel,
  IdeaInput,
  MarketSignal,
  MvpRecommendation,
  Pivot,
  StructuredIdea
} from "@/lib/domain/types";

export interface EvidenceBundle {
  signals: MarketSignal[];
  competitors: Competitor[];
  channels: DistributionChannel[];
  meta: {
    providerId: string;
    providerName: string;
    mode: "demo" | "live" | "fallback";
    warnings: string[];
  };
}

export interface AIProvider {
  readonly name: string;
  structureIdea(input: IdeaInput): Promise<StructuredIdea>;
  classifySignal(signal: MarketSignal): Promise<MarketSignal["signalType"]>;
  summarizeEvidence(idea: StructuredIdea, signals: MarketSignal[]): Promise<string>;
  generatePivots(idea: StructuredIdea, signals: MarketSignal[]): Promise<Pivot[]>;
  generateMVP(idea: StructuredIdea, signals: MarketSignal[]): Promise<MvpRecommendation>;
  roastIdea(
    idea: StructuredIdea,
    signals: MarketSignal[]
  ): Promise<{ risks: string[]; changeOurMind: string[]; betterAngle: string; estimatedScore: number }>;
}

export interface DataSourceProvider {
  readonly name: string;
  collect(idea: StructuredIdea, projectId: string): Promise<EvidenceBundle>;
}
