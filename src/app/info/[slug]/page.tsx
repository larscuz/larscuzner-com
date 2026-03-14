import { notFound } from "next/navigation";
import { PublicEntryShell } from "@/components/site/public-entry-shell";
import { getPublicEntry, getPublishedPages } from "@/lib/server/public-site";

export async function generateStaticParams() {
  const pages = await getPublishedPages();
  return pages.map((entry) => ({ slug: entry.slug }));
}

export default async function InfoEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getPublicEntry("page", slug);

  if (!entry) {
    notFound();
  }

  return <PublicEntryShell entry={entry} />;
}
