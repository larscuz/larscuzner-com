import Link from "next/link";
import { getPublishedPosts } from "@/lib/server/public-site";

export default async function WorksPage() {
  const posts = await getPublishedPosts();

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8">
        <header className="border-b border-white/10 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="text-xs uppercase tracking-[0.34em] text-white/45 transition hover:text-white/70">
              Lars Cuzner
            </Link>
            <div className="flex flex-wrap gap-5 text-xs uppercase tracking-[0.3em] text-white/35">
              <Link href="/works" className="text-white/70">
                Works
              </Link>
              <Link href="/info" className="transition hover:text-white/70">
                Info
              </Link>
              <Link href="/admin" className="transition hover:text-white/70">
                Admin
              </Link>
            </div>
          </div>
          <h1 className="mt-10 max-w-5xl text-[clamp(4rem,10vw,8rem)] font-semibold leading-[0.9] tracking-[-0.08em]">
            Works
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58">
            Published entries recovered from the WordPress export and now routed through the new front-end layer.
          </p>
        </header>

        <section className="grid gap-px py-8 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((entry, index) => (
            <Link
              key={entry.id}
              href={`/works/${encodeURIComponent(entry.slug)}`}
              className="group border border-white/10 px-5 py-6 transition hover:bg-white/[0.03]"
            >
              <p className="text-[0.72rem] uppercase tracking-[0.34em] text-white/28">{String(index + 1).padStart(2, "0")}</p>
              <h2 className="mt-6 text-3xl font-semibold tracking-[-0.05em] text-white transition group-hover:text-white/92">
                {entry.title}
              </h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/55">{entry.excerpt || "Open work"}</p>
              <p className="mt-8 text-xs uppercase tracking-[0.28em] text-white/35">{entry.slug}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
