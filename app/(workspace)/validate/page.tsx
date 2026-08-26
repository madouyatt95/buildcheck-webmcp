import { ValidationExperience } from "@/components/validation-form";
import { demoOpportunities } from "@/lib/demo/seed";
import { selectedServerDataSource } from "@/lib/providers/server-provider-factory";

export default async function ValidatePage({ searchParams }: { searchParams: Promise<{ mode?: string; opportunity?: string }> }) {
  const params = await searchParams;
  const opportunity = demoOpportunities.find((item) => item.slug === params.opportunity);
  const dataSource = selectedServerDataSource();
  return (
    <div className="page narrow">
      <ValidationExperience
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
    </div>
  );
}
