import { notFound } from "next/navigation";
import { PublicEntryShell } from "@/components/site/public-entry-shell";
import { getPublicEntry, getPublishedPosts } from "@/lib/server/public-site";

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((entry) => ({ slug: entry.slug }));
}

export default async function WorkEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getPublicEntry("post", slug);

  if (!entry) {
    notFound();
  }

  return <PublicEntryShell entry={entry} />;
}
