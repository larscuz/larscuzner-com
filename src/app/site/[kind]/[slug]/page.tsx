import { notFound } from "next/navigation";
import { PublicEntryShell } from "@/components/site/public-entry-shell";
import { getPublicEntry } from "@/lib/server/public-site";
import { readWorkspace } from "@/lib/server/workspace-store";

export async function generateStaticParams() {
  const workspace = await readWorkspace();
  return workspace.entries
    .filter((entry) => entry.workflowStatus === "published" && entry.slug)
    .map((entry) => ({
      kind: entry.kind,
      slug: entry.slug,
    }));
}

export default async function PublicEntryPage({
  params,
}: {
  params: Promise<{ kind: string; slug: string }>;
}) {
  const { kind, slug } = await params;

  if (kind !== "page" && kind !== "post") {
    notFound();
  }

  const entry = await getPublicEntry(kind, slug);

  if (!entry) {
    notFound();
  }

  return <PublicEntryShell entry={entry} />;
}
