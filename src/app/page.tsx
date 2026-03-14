import Link from "next/link";
import { compactNumber, formatDate, getRecoverySnapshot } from "@/lib/wordpress-data";

const snapshot = getRecoverySnapshot();

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "accent" | "signal";
}) {
  const toneClass =
    tone === "accent"
      ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]"
      : tone === "signal"
        ? "border-[color:var(--signal)] bg-white/80"
        : "border-[color:var(--line)] bg-[color:var(--panel)]";

  return (
    <div className={`rounded-[1.6rem] border p-5 shadow-[0_24px_80px_rgba(31,36,48,0.08)] ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.28em] text-black/45">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-6 shadow-[0_32px_120px_rgba(31,36,48,0.08)] backdrop-blur">
      <p className="text-xs uppercase tracking-[0.32em] text-black/45">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ContentTable({
  rows,
  kind,
  emptyLabel,
}: {
  rows: Array<{
    id: number;
    title: string;
    slug: string;
    date: string;
    status: string;
    excerpt: string;
  }>;
  kind: "posts" | "pages";
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-black/55">{emptyLabel}</p>;
  }

  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-[color:var(--line)]">
      <table className="min-w-full divide-y divide-black/8 text-left text-sm">
        <thead className="bg-black/[0.03] text-xs uppercase tracking-[0.22em] text-black/55">
          <tr>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Slug</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/6 bg-white/70">
          {rows.map((row) => (
            <tr key={`${row.slug}-${row.date}`}>
              <td className="px-4 py-3 align-top">
                <Link href={`/content/${kind}/${row.id}`} className="font-medium hover:underline">
                  {row.title}
                </Link>
                {row.excerpt ? <p className="mt-1 max-w-xl text-xs text-black/55">{row.excerpt}</p> : null}
              </td>
              <td className="px-4 py-3 align-top font-mono text-xs text-black/70">{row.slug || "untitled"}</td>
              <td className="px-4 py-3 align-top text-black/70">{row.date}</td>
              <td className="px-4 py-3 align-top text-black/70">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Home() {
  const taxonomyHighlights = snapshot.taxonomies.slice(0, 16);
  const attachmentHighlights = snapshot.attachments.slice(0, 12);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2.4rem] border border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(255,252,246,0.94),rgba(255,247,237,0.88))] p-6 shadow-[0_36px_140px_rgba(31,36,48,0.1)] sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-black/45">Migration Recovery Admin</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl">
              Fresh backend, recovered WordPress structure, no ongoing dependency on the old site.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-black/68 sm:text-lg">
              This workspace reads the exported WordPress database and XML snapshot, then turns them into a browsable
              editorial inventory. It is the starting point for a new CMS and frontend, not a skin over WordPress.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-black/70">
              <span className="rounded-full bg-[color:var(--accent-soft)] px-4 py-2">Active root theme: {snapshot.rootSite.template || "Unknown"}</span>
              <span className="rounded-full bg-black/[0.05] px-4 py-2">Permalinks: {snapshot.rootSite.permalinkStructure || "Unknown"}</span>
              <span className="rounded-full bg-black/[0.05] px-4 py-2">Generated: {formatDate(snapshot.generatedAt)}</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Open editable CMS admin
              </Link>
              <Link
                href="/menus"
                className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-[color:var(--background)] transition hover:opacity-90"
              >
                Inspect reconstructed menus
              </Link>
              <Link
                href={snapshot.pages[0] ? `/content/pages/${snapshot.pages[0].id}` : "/"}
                className="rounded-full border border-[color:var(--line)] px-5 py-3 text-sm font-medium transition hover:bg-black/[0.03]"
              >
                Open a recovered page
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <StatCard label="Published posts" value={compactNumber(snapshot.posts.length)} tone="accent" />
            <StatCard label="Published pages" value={compactNumber(snapshot.pages.length)} />
            <StatCard label="Attachments" value={compactNumber(snapshot.attachments.length)} />
            <StatCard label="Tracked taxonomies" value={compactNumber(snapshot.taxonomies.length)} tone="signal" />
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <Section eyebrow="Configuration" title="Recovered site settings">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/70 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-black/45">Root install</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-black/55">Site URL</dt>
                  <dd className="text-right font-medium">{snapshot.rootSite.siteUrl || "Unavailable"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-black/55">Home URL</dt>
                  <dd className="text-right font-medium">{snapshot.rootSite.homeUrl || "Unavailable"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-black/55">Theme</dt>
                  <dd className="text-right font-medium">{snapshot.rootSite.template || "Unavailable"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-black/55">Front page mode</dt>
                  <dd className="text-right font-medium">{snapshot.rootSite.showOnFront || "Unavailable"}</dd>
                </div>
                <div>
                  <dt className="text-black/55">Active plugins</dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {snapshot.rootSite.activePlugins.map((plugin) => (
                      <span key={plugin} className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs">
                        {plugin}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/70 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-black/45">Legacy /blog install</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-black/55">Site URL</dt>
                  <dd className="text-right font-medium">{snapshot.blogSite.siteUrl || "Unavailable"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-black/55">Theme</dt>
                  <dd className="text-right font-medium">{snapshot.blogSite.template || "Unavailable"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-black/55">Permalinks</dt>
                  <dd className="text-right font-medium">{snapshot.blogSite.permalinkStructure || "Default"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-black/55">Content</dt>
                  <dd className="text-right font-medium">
                    {snapshot.legacyBlog.posts} posts / {snapshot.legacyBlog.pages} pages
                  </dd>
                </div>
                <div>
                  <dt className="text-black/55">Active plugins</dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {snapshot.blogSite.activePlugins.map((plugin) => (
                      <span key={plugin} className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs">
                        {plugin}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </Section>

        <Section eyebrow="Signals" title="What the old stack tells us">
          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/70 p-5">
              <p className="text-sm font-medium">Import confidence</p>
              <p className="mt-2 text-sm leading-6 text-black/65">
                The SQL dump is the authoritative source. The XML export confirms the current WordPress site title, base
                URL, and content mix. This lets us rebuild the editorial backend from exports instead of holding onto
                WordPress as a permanent system.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Visual Composer"
                value={snapshot.signals.usesVisualComposerShortcodes ? "Detected" : "Not detected"}
                tone={snapshot.signals.usesVisualComposerShortcodes ? "signal" : "default"}
              />
              <StatCard
                label="Elementor"
                value={snapshot.signals.usesElementorTaxonomy ? "Detected" : "Not detected"}
                tone={snapshot.signals.usesElementorTaxonomy ? "signal" : "default"}
              />
              <StatCard
                label="Woo taxonomies"
                value={snapshot.signals.usesWooCommerceTaxonomies ? "Detected" : "Not detected"}
                tone={snapshot.signals.usesWooCommerceTaxonomies ? "signal" : "default"}
              />
            </div>
            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/70 p-5 text-sm">
              <p className="font-medium">Source files</p>
              <p className="mt-2 text-black/65">{snapshot.sources.sqlPath || "Unavailable"}</p>
              <p className="mt-1 text-black/65">{snapshot.sources.xmlPath || "Unavailable"}</p>
            </div>
          </div>
        </Section>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <Section eyebrow="Content" title="Recovered published pages">
          <ContentTable
            rows={snapshot.pages.map((page) => ({
              id: page.id,
              title: page.title,
              slug: page.slug,
              date: page.date,
              status: page.status,
              excerpt: page.excerpt,
            }))}
            kind="pages"
            emptyLabel="No published pages were found in the current export."
          />
        </Section>

        <Section eyebrow="Content" title="Recovered published posts">
          <ContentTable
            rows={snapshot.posts.map((post) => ({
              id: post.id,
              title: post.title,
              slug: post.slug,
              date: post.date,
              status: post.status,
              excerpt: post.excerpt,
            }))}
            kind="posts"
            emptyLabel="No published posts were found in the current export."
          />
        </Section>
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <Section eyebrow="Structure" title="Menus and taxonomies">
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/70 p-5">
              <p className="text-sm font-medium">Recovered menus</p>
              <div className="mt-4 space-y-3">
                {snapshot.menus.length > 0 ? (
                  snapshot.menus.map((menu) => (
                    <div key={menu.id} className="rounded-2xl border border-[color:var(--line)] px-4 py-3">
                      <Link href="/menus" className="font-medium hover:underline">
                        {menu.name}
                      </Link>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-black/50">term #{menu.id}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-black/55">No menu terms were detected.</p>
                )}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/70 p-5">
              <p className="text-sm font-medium">Top taxonomies</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {taxonomyHighlights.map((taxonomy) => (
                  <span
                    key={`${taxonomy.taxonomy}-${taxonomy.slug}`}
                    className="rounded-full border border-[color:var(--line)] bg-black/[0.03] px-3 py-2 text-xs"
                  >
                    {taxonomy.taxonomy}: {taxonomy.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section eyebrow="Media" title="Attachment inventory">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {attachmentHighlights.map((attachment) => (
              <article
                key={`${attachment.id}-${attachment.slug}`}
                className="rounded-[1.35rem] border border-[color:var(--line)] bg-white/75 p-4"
              >
                <Link href={`/content/attachments/${attachment.id}`} className="text-sm font-medium hover:underline">
                  {attachment.title}
                </Link>
                <p className="mt-1 break-all font-mono text-[11px] text-black/55">{attachment.file || attachment.url}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-black/45">{attachment.mimeType || "Unknown mime"}</p>
              </article>
            ))}
          </div>
        </Section>
      </div>
    </main>
  );
}
