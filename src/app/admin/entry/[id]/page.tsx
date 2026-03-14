import Link from "next/link";
import { notFound } from "next/navigation";
import { getMediaLibrary } from "@/lib/media-library";
import { EntryComposer } from "@/components/cms/entry-composer";
import { getRecoverySnapshot } from "@/lib/wordpress-data";
import { logoutAction, requireAdmin } from "@/lib/server/auth";
import { getWorkspaceEntry, readWorkspace, updateWorkspaceEntry } from "@/lib/server/workspace-store";

export async function generateStaticParams() {
  const workspace = await readWorkspace();
  return workspace.entries.map((entry) => ({ id: String(entry.sourceId) }));
}

export default async function AdminEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const query = await searchParams;
  const entry = await getWorkspaceEntry(id);

  if (!entry) {
    notFound();
  }

  const recovery = getRecoverySnapshot();
  const mediaLibrary = getMediaLibrary();
  const attachments = recovery.attachments.filter((attachment) => entry.linkedAttachmentIds.includes(attachment.id));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/admin" className="text-sm text-black/60 underline-offset-4 hover:underline">
          Back to workspace admin
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-black/60 underline-offset-4 hover:underline">
            Sign out
          </button>
        </form>
      </div>

      <section className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-6 shadow-[0_24px_100px_rgba(31,36,48,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-black/45">Entry composer</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">{entry.title}</h1>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-black/65">
              <span className="rounded-full bg-black/[0.05] px-3 py-2">Source #{entry.sourceId}</span>
              <span className="rounded-full bg-black/[0.05] px-3 py-2">Original: {entry.originalStatus}</span>
              <span className="rounded-full bg-black/[0.05] px-3 py-2">Workspace: {entry.workflowStatus}</span>
            </div>
          </div>

          {entry.slug ? (
            <Link
              href={`/site/${entry.kind}/${encodeURIComponent(entry.slug)}`}
              className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm hover:bg-black/[0.03]"
            >
              Open public route
            </Link>
          ) : null}
        </div>

        <div className="mt-5 grid gap-5 text-sm text-black/65 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-black/45">Recovered source URL</p>
            <p className="mt-2 break-all">{entry.publicUrl}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-black/45">Terms</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {entry.termLabels.length > 0 ? (
                entry.termLabels.map((label) => (
                  <span key={label} className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs">
                    {label}
                  </span>
                ))
              ) : (
                <span className="text-sm text-black/55">No terms assigned</span>
              )}
            </div>
          </div>
        </div>

        {query.saved === "1" ? <p className="mt-5 text-sm text-[color:var(--accent)]">Composition saved.</p> : null}
      </section>

      <EntryComposer
        entry={entry}
        attachments={attachments}
        mediaLibraryItems={mediaLibrary.items}
        saveAction={updateWorkspaceEntry}
      />
    </main>
  );
}
