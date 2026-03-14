import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteBlockRenderer } from "@/components/cms/site-block-renderer";
import { findWorkspaceEntryBySlug, readWorkspace } from "@/lib/server/workspace-store";

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

  const entry = await findWorkspaceEntryBySlug(kind, slug);

  if (!entry) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <Link href="/" className="text-xs uppercase tracking-[0.34em] text-white/45 transition hover:text-white/70">
            Lars Cuzner
          </Link>
          <Link
            href={`/admin/entry/${encodeURIComponent(entry.id)}`}
            className="text-xs uppercase tracking-[0.3em] text-white/35 transition hover:text-white/65"
          >
            Open in admin
          </Link>
        </div>

        <section className="grid gap-12 px-0 py-10 md:grid-cols-[minmax(0,1fr)_280px] md:gap-16 md:py-14">
          <div className="space-y-6">
            <p className="text-[0.72rem] uppercase tracking-[0.42em] text-white/30">{entry.kind}</p>
            <h1 className="max-w-5xl text-[clamp(4rem,11vw,10rem)] font-semibold leading-[0.88] tracking-[-0.09em] text-white">
              {entry.title}
            </h1>
          </div>

          <aside className="max-w-sm space-y-5 pt-2">
            <p className="text-sm leading-7 text-white/58">
              This page is rendered from the new block composer. It is designed as a stark editorial canvas inspired by
              the terminal-style reference while remaining editable in your own CMS.
            </p>
            <div className="flex flex-wrap gap-2">
              {entry.termLabels.map((label) => (
                <span key={label} className="rounded-full border border-white/14 px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] text-white/45">
                  {label}
                </span>
              ))}
            </div>
          </aside>
        </section>

        <section className="border-t border-white/10 py-10 md:py-14">
          <SiteBlockRenderer document={entry.editorDocument} />
        </section>
      </div>
    </main>
  );
}
