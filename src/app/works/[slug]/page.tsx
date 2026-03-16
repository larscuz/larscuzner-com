import { notFound } from "next/navigation";
import { IntelligencePartyRoom } from "@/components/site/intelligence-party-room";
import { PublicEntryShell } from "@/components/site/public-entry-shell";
import { isAdminAuthenticated } from "@/lib/server/auth";
import { readIntelligencePartyDocument, saveIntelligencePartyDocument } from "@/lib/server/site-documents";
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

  const canEdit = await isAdminAuthenticated();

  if (
    (["post-2735", "the-intelligence-party", "intelligenspartiet"].includes(slug) ||
      /intelligence party|intelligenspartiet/i.test(entry.title))
  ) {
    const document = await readIntelligencePartyDocument();
    return <IntelligencePartyRoom entry={entry} document={document} canEdit={canEdit} saveAction={saveIntelligencePartyDocument} />;
  }

  return <PublicEntryShell entry={entry} />;
}
