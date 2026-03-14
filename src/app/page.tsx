import Link from "next/link";
import { EntryCardVisual } from "@/components/site/entry-card-visual";
import { getFeaturedEntries } from "@/lib/server/public-site";

export default async function Home() {
  const { featuredPages, featuredPosts, pages, posts } = await getFeaturedEntries();
  const hero = featuredPosts[0] ?? posts[0] ?? null;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8">
        <header className="border-b border-white/10 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs uppercase tracking-[0.36em] text-white/45">Lars Cuzner</p>
            <div className="flex flex-wrap gap-5 text-xs uppercase tracking-[0.3em] text-white/35">
              <Link href="/works" className="transition hover:text-white/70">
                Works
              </Link>
              <Link href="/info" className="transition hover:text-white/70">
                Info
              </Link>
              <Link href="/admin" className="transition hover:text-white/70">
                Backend
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-10 py-10 md:grid-cols-[minmax(0,1.15fr)_minmax(240px,0.55fr)] md:gap-16 md:py-16">
          <div>
            <p className="text-[0.74rem] uppercase tracking-[0.42em] text-white/26">Artist website rebuild</p>
            <h1 className="mt-5 max-w-6xl text-[clamp(4.4rem,13vw,11rem)] font-semibold leading-[0.84] tracking-[-0.1em] text-white">
              A rebuilt Lars Cuzner site with a custom editor behind it.
            </h1>
          </div>

          <div className="space-y-5 pt-2">
            <p className="text-sm leading-7 text-white/58">
              The public site now lives separately from the backend. Works and information pages render from the new
              composer system, while `/admin` stays the editorial workspace.
            </p>
            <div className="grid grid-cols-2 gap-px border border-white/10 bg-white/10 text-sm">
              <div className="bg-[#050505] px-4 py-5">
                <p className="text-[0.7rem] uppercase tracking-[0.28em] text-white/30">Published works</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">{posts.length}</p>
              </div>
              <div className="bg-[#050505] px-4 py-5">
                <p className="text-[0.7rem] uppercase tracking-[0.28em] text-white/30">Published pages</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">{pages.length}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-px border-y border-white/10 py-0 md:grid-cols-[1.2fr_0.8fr]">
          <div className="border-b border-white/10 px-0 py-8 md:border-b-0 md:border-r md:border-white/10 md:px-0 md:py-10">
            <p className="text-[0.72rem] uppercase tracking-[0.34em] text-white/28">Featured work</p>
            {hero ? (
              <Link href={`/works/${encodeURIComponent(hero.slug)}`} className="group block pt-6">
                <div className="mb-8 overflow-hidden border border-white/10">
                  <EntryCardVisual entry={hero} />
                </div>
                <h2 className="max-w-4xl text-[clamp(2.8rem,7vw,6.5rem)] font-semibold leading-[0.9] tracking-[-0.08em] text-white transition group-hover:text-white/82">
                  {hero.title}
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/55">{hero.excerpt || "Open featured work"}</p>
                <p className="mt-8 text-xs uppercase tracking-[0.28em] text-white/35">Open work</p>
              </Link>
            ) : (
              <p className="pt-6 text-sm text-white/55">No published work is available yet.</p>
            )}
          </div>

          <div className="px-0 py-8 md:px-0 md:py-10">
            <div className="space-y-5">
              <p className="text-[0.72rem] uppercase tracking-[0.34em] text-white/28">Entry points</p>
              <div className="grid gap-px border border-white/10 bg-white/10">
                <Link href="/works" className="bg-[#050505] px-5 py-5 transition hover:bg-white/[0.03]">
                  <p className="text-2xl font-semibold tracking-[-0.05em]">Works</p>
                  <p className="mt-2 text-sm leading-7 text-white/52">Published projects, writing, and recovered posts.</p>
                </Link>
                <Link href="/info" className="bg-[#050505] px-5 py-5 transition hover:bg-white/[0.03]">
                  <p className="text-2xl font-semibold tracking-[-0.05em]">Info</p>
                  <p className="mt-2 text-sm leading-7 text-white/52">Bio, CV, text pages, and other public information.</p>
                </Link>
                <Link href="/admin" className="bg-[#050505] px-5 py-5 transition hover:bg-white/[0.03]">
                  <p className="text-2xl font-semibold tracking-[-0.05em]">Backend</p>
                  <p className="mt-2 text-sm leading-7 text-white/52">Composer, unpublished content, and editorial controls.</p>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-10 py-10 md:grid-cols-[0.9fr_1.1fr] md:py-16">
          <div className="space-y-5">
            <p className="text-[0.72rem] uppercase tracking-[0.34em] text-white/28">Public pages</p>
            <h2 className="max-w-xl text-[clamp(2.4rem,5vw,4.4rem)] font-semibold leading-[0.92] tracking-[-0.07em]">
              Core information is now surfaced as part of the site, not hidden in WordPress.
            </h2>
          </div>

          <div className="grid gap-px border border-white/10 bg-white/10">
            {featuredPages.map((entry) => (
              <Link
                key={entry.id}
                href={`/info/${encodeURIComponent(entry.slug)}`}
                className="grid gap-3 bg-[#050505] px-5 py-5 transition hover:bg-white/[0.03] md:grid-cols-[180px_minmax(0,1fr)]"
              >
                <div className="overflow-hidden border border-white/10 md:max-w-[160px]">
                  <EntryCardVisual entry={entry} />
                </div>
                <div>
                  <p className="text-[0.7rem] uppercase tracking-[0.3em] text-white/28">{entry.slug}</p>
                  <p className="text-2xl font-semibold tracking-[-0.05em] text-white">{entry.title}</p>
                  <p className="mt-2 text-sm leading-7 text-white/52">{entry.excerpt || "Open page"}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-t border-white/10 py-10 md:py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.34em] text-white/28">Recent works</p>
              <h2 className="mt-3 text-[clamp(2.4rem,5vw,4.4rem)] font-semibold leading-[0.92] tracking-[-0.07em]">
                Selected published pieces
              </h2>
            </div>
            <Link href="/works" className="text-xs uppercase tracking-[0.28em] text-white/38 transition hover:text-white/70">
              View all works
            </Link>
          </div>

          <div className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-3">
            {featuredPosts.map((entry) => (
              <Link
                key={entry.id}
                href={`/works/${encodeURIComponent(entry.slug)}`}
                className="group bg-[#050505] px-5 py-6 transition hover:bg-white/[0.03]"
              >
                <div className="-mx-5 -mt-6 mb-6 overflow-hidden border-b border-white/10">
                  <EntryCardVisual entry={entry} />
                </div>
                <p className="text-[0.7rem] uppercase tracking-[0.3em] text-white/28">{entry.slug}</p>
                <h3 className="mt-6 text-3xl font-semibold tracking-[-0.05em] text-white transition group-hover:text-white/88">
                  {entry.title}
                </h3>
                <p className="mt-5 text-sm leading-7 text-white/52">{entry.excerpt || "Open work"}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
