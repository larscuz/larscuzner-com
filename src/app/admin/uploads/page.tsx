import Link from "next/link";
import { UploadsBrowser } from "@/components/admin/uploads-browser";
import { getMediaLibrary } from "@/lib/media-library";
import { logoutAction, requireAdmin } from "@/lib/server/auth";

export default async function AdminUploadsPage() {
  await requireAdmin();
  const library = getMediaLibrary();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-6">
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
        <p className="text-xs uppercase tracking-[0.3em] text-black/45">Uploads inventory</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Recovered media library</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-black/68">
          This section inventories media across the downloaded source folders, not just WordPress attachments already
          linked to entries. It pulls from `wp-content/uploads`, `blog/wp-content/uploads`, `media`, `static`,
          `imagesonline`, and `personal`.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-black/[0.05] px-4 py-2">{library.totals.originalFiles} original files</span>
          <span className="rounded-full bg-black/[0.05] px-4 py-2">{library.totals.rawFiles} raw files scanned</span>
          <span className="rounded-full bg-black/[0.05] px-4 py-2">{library.collections.length} source collections</span>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[color:var(--line)] bg-white/80 p-6">
        <h2 className="text-xl font-semibold">Collections</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {library.collections.map((collection) => (
            <article key={collection.key} className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-black/45">{collection.key}</p>
              <p className="mt-2 font-mono text-xs text-black/55">{collection.relativePath}</p>
              <p className="mt-4 text-3xl font-semibold tracking-tight">{collection.count}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {Object.entries(collection.byType).map(([type, count]) => (
                  <span key={type} className="rounded-full border border-[color:var(--line)] px-3 py-1">
                    {type}: {count}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <UploadsBrowser collections={library.collections} items={library.items} generatedAt={library.generatedAt} />
    </main>
  );
}
