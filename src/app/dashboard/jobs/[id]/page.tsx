import { notFound } from "next/navigation";
import { getJob } from "@/lib/store";
import { JobProgress } from "@/components/job-progress";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) notFound();

  return <JobProgress jobId={job.id} />;
}
