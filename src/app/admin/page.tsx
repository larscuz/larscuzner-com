import Link from "next/link";
import { logoutAction, requireAdmin } from "@/lib/server/auth";
import { createWorkspaceEntry, readWorkspace } from "@/lib/server/workspace-store";
import { formatDate, getRecoveryPublishedDateBySourceId } from "@/lib/wordpress-data";

function sortEntriesNewestFirst(entries: Awaited<ReturnType<typeof readWorkspace>>["entries"]) {
  return [...entries].sort((left, right) => {
    const rightPublishedAt = getRecoveryPublishedDateBySourceId(right.sourceId) ?? right.updatedAt;
    const leftPublishedAt = getRecoveryPublishedDateBySourceId(left.sourceId) ?? left.updatedAt;
    return rightPublishedAt.localeCompare(leftPublishedAt);
  });
}

export default async function AdminPage() {
  await requireAdmin();
  const workspace = await readWorkspace();
  const sortedEntries = sortEntriesNewestFirst(workspace.entries);
  const unpublished = sortedEntries.filter((entry) => entry.originalStatus !== "publish");
  const createPostAction = createWorkspaceEntry.bind(null, "post");
  const createPageAction = createWorkspaceEntry.bind(null, "page");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="text-sm text-black/60 underline-offset-4 hover:underline">
          Back to site homepage
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-black/60 underline-offset-4 hover:underline">
            Sign out
          </button>
        </form>
      </div>

      <section className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-6 shadow-[0_24px_100px_rgba(31,36,48,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-black/45">Editable CMS layer</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Workspace admin</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-black/68">
          This is the writable editorial layer on top of the recovered WordPress data. It includes unpublished content
          imported from the SQL dump, so you can work with drafts, pending items, and private records alongside
          published material.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-black/[0.05] px-4 py-2">{sortedEntries.length} editable entries</span>
          <span className="rounded-full bg-black/[0.05] px-4 py-2">{unpublished.length} unpublished/imported entries</span>
          <form action={createPostAction}>
            <button type="submit" className="rounded-full border border-[color:var(--line)] px-4 py-2 hover:bg-black/[0.03]">
              New post
            </button>
          </form>
          <form action={createPageAction}>
            <button type="submit" className="rounded-full border border-[color:var(--line)] px-4 py-2 hover:bg-black/[0.03]">
              New page
            </button>
          </form>
          <Link href="/admin/uploads" className="rounded-full border border-[color:var(--line)] px-4 py-2 hover:bg-black/[0.03]">
            Open uploads
          </Link>
          <Link href="/admin/project-room/intelligence-party" className="rounded-full border border-[color:var(--line)] px-4 py-2 hover:bg-black/[0.03]">
            Edit project room
          </Link>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[color:var(--line)] bg-white/80 p-6">
        <h2 className="text-xl font-semibold">Entries</h2>
        <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-[color:var(--line)]">
          <table className="min-w-full divide-y divide-black/8 text-left text-sm">
            <thead className="bg-black/[0.03] text-xs uppercase tracking-[0.22em] text-black/55">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Kind</th>
                <th className="px-4 py-3">Original</th>
                <th className="px-4 py-3">Workspace</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/6 bg-white/70">
              {sortedEntries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 align-top">
                    <Link href={`/admin/entry/${entry.sourceId}`} className="font-medium hover:underline">
                      {entry.title}
                    </Link>
                    <p className="mt-1 font-mono text-xs text-black/55">{entry.slug || "untitled"}</p>
                  </td>
                  <td className="px-4 py-3 align-top">{entry.kind}</td>
                  <td className="px-4 py-3 align-top">{entry.originalStatus}</td>
                  <td className="px-4 py-3 align-top">{entry.workflowStatus}</td>
                  <td className="px-4 py-3 align-top text-black/65">{formatDate(getRecoveryPublishedDateBySourceId(entry.sourceId))}</td>
                  <td className="px-4 py-3 align-top text-black/65">{formatDate(entry.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
