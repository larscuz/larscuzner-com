import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecoverySnapshot } from "@/lib/wordpress-data";
import { logoutAction, requireAdmin } from "@/lib/server/auth";
import { getWorkspaceEntry, readWorkspace, updateWorkspaceEntry } from "@/lib/server/workspace-store";

export async function generateStaticParams() {
  const workspace = await readWorkspace();
  return workspace.entries.map((entry) => ({ id: entry.id }));
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
  const attachments = recovery.attachments.filter((attachment) => entry.linkedAttachmentIds.includes(attachment.id));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1080px] flex-col gap-6 px-4 py-8 sm:px-6">
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
        <p className="text-xs uppercase tracking-[0.3em] text-black/45">Entry editor</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{entry.title}</h1>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-black/65">
          <span className="rounded-full bg-black/[0.05] px-3 py-2">Source #{entry.sourceId}</span>
          <span className="rounded-full bg-black/[0.05] px-3 py-2">Original: {entry.originalStatus}</span>
          <span className="rounded-full bg-black/[0.05] px-3 py-2">Workspace: {entry.workflowStatus}</span>
        </div>
        {query.saved === "1" ? <p className="mt-4 text-sm text-[color:var(--accent)]">Changes saved.</p> : null}
      </section>

      <form action={updateWorkspaceEntry} className="grid gap-6">
        <input type="hidden" name="id" value={entry.id} />

        <section className="rounded-[2rem] border border-[color:var(--line)] bg-white/80 p-6">
          <h2 className="text-xl font-semibold">Editable fields</h2>
          <div className="mt-5 grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Title</span>
              <input
                name="title"
                defaultValue={entry.title}
                className="rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
              />
            </label>

            <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
              <label className="grid gap-2">
                <span className="text-sm font-medium">Slug</span>
                <input
                  name="slug"
                  defaultValue={entry.slug}
                  className="rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Workspace status</span>
                <select
                  name="workflowStatus"
                  defaultValue={entry.workflowStatus}
                  className="rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
                >
                  <option value="draft">draft</option>
                  <option value="review">review</option>
                  <option value="published">published</option>
                </select>
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Excerpt</span>
              <textarea
                name="excerpt"
                defaultValue={entry.excerpt}
                rows={4}
                className="rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Body</span>
              <textarea
                name="body"
                defaultValue={entry.body}
                rows={20}
                className="rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 font-mono text-xs leading-6"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Editorial notes</span>
              <textarea
                name="notes"
                defaultValue={entry.notes}
                rows={6}
                className="rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
              />
            </label>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-[color:var(--background)] transition hover:opacity-90"
            >
              Save entry
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[color:var(--line)] bg-white/80 p-6">
          <h2 className="text-xl font-semibold">Recovered metadata</h2>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-black/45">Source URL</p>
              <p className="mt-2 break-all text-sm text-black/70">{entry.publicUrl}</p>
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

          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-black/45">Linked attachments</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {attachments.length > 0 ? (
                attachments.map((attachment) => (
                  <Link
                    key={attachment.id}
                    href={`/content/attachments/${attachment.id}`}
                    className="rounded-[1.2rem] border border-[color:var(--line)] px-4 py-3 text-sm hover:bg-black/[0.03]"
                  >
                    {attachment.title}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-black/55">No linked attachments inferred for this entry.</p>
              )}
            </div>
          </div>
        </section>
      </form>
    </main>
  );
}
