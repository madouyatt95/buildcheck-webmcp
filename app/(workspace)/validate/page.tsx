import { ValidationForm } from "@/components/validation-form";
import { demoOpportunities } from "@/lib/demo/seed";
import { selectedServerDataSource } from "@/lib/providers/server-provider-factory";

export default async function ValidatePage({ searchParams }: { searchParams: Promise<{ mode?: string; opportunity?: string }> }) {
  const params = await searchParams;
  const opportunity = demoOpportunities.find((item) => item.slug === params.opportunity);
  const dataSource = selectedServerDataSource();
  const usesLiveSource = dataSource !== "mock";
  const liveSourceLabel = dataSource === "hacker-news+github"
    ? "Hacker News and GitHub Issues discussions"
    : dataSource === "github"
      ? "GitHub Issues discussions"
      : "Hacker News discussions";
  return (
    <div className="page narrow">
      <header className="page-heading">
        <div>
          <span className="eyebrow">Validate</span>
          <h1>Pressure-test the idea before the build.</h1>
          <p className="subtitle">Your description is structured, matched to {usesLiveSource ? `observed ${liveSourceLabel}` : "a transparent demo evidence set"} and scored by deterministic functions.</p>
        </div>
      </header>
      <ValidationForm
        initialRoast={params.mode === "roast"}
        dataSource={dataSource}
        initialIdea={opportunity ? {
          name: opportunity.title,
          description: opportunity.description,
          targetCustomer: opportunity.audience,
          problem: opportunity.problem,
          businessModel: `$${opportunity.pricingMin}–$${opportunity.pricingMax}/month`,
          marketType: opportunity.marketType
        } : undefined}
      />
      <p className="tiny" style={{ textAlign: "center", marginTop: 14 }}>{usesLiveSource ? "Only the configured public sources are queried. A partial failure keeps the remaining live evidence; total failure falls back to visibly marked demo data." : "Demo analyses never call Reddit, X, Google or an AI API. Evidence is simulated and visibly labeled."}</p>
    </div>
  );
}
