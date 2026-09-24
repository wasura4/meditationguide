import { redirect } from "next/navigation";

/** Keep existing guide links pointing to the current listening experience. */
export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/kamatahan/guides/${encodeURIComponent(id)}`);
}
