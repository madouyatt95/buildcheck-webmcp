import { ProjectReport } from "@/components/project-report";

export default async function ProjectDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <ProjectReport projectId={id} initialTab={query.tab} />;
}
