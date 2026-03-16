import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/server/auth";
import { normalizeIntelligencePartyDocument } from "@/lib/project-room-schema";
import { readIntelligencePartyDocument, saveIntelligencePartyDocument } from "@/lib/server/site-documents";

export default async function IntelligencePartyAdminPage() {
  await requireAdmin();
  const document = await readIntelligencePartyDocument();

  async function saveAction(formData: FormData) {
    "use server";

    await requireAdmin();

    const nextDocument = normalizeIntelligencePartyDocument({
      ...document,
      introKicker: String(formData.get("introKicker") || ""),
      introTagline: String(formData.get("introTagline") || ""),
      currentReadingTitle: String(formData.get("currentReadingTitle") || ""),
      currentReadingBody: String(formData.get("currentReadingBody") || ""),
      sectionHeading: String(formData.get("sectionHeading") || ""),
      sectionDescription: String(formData.get("sectionDescription") || ""),
      mediaItems: JSON.parse(String(formData.get("mediaItems") || "[]")),
      entryPoints: JSON.parse(String(formData.get("entryPoints") || "[]")),
      timeline: JSON.parse(String(formData.get("timeline") || "[]")),
      ambiguityScale: JSON.parse(String(formData.get("ambiguityScale") || "[]")),
    });

    await saveIntelligencePartyDocument({ document: nextDocument });
    redirect("/admin/project-room/intelligence-party?saved=1");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/admin" className="text-sm text-black/60 underline-offset-4 hover:underline">
          Back to admin
        </Link>
        <Link href="/works/post-2735" className="text-sm text-black/60 underline-offset-4 hover:underline">
          Open project room
        </Link>
      </div>

      <section className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-6 shadow-[0_24px_100px_rgba(31,36,48,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-black/45">Special project page</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Intelligence Party room</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-black/68">
          This editor controls the canonical project room at <code>/works/post-2735</code>. It is separate from the
          source post editor so the room can stay a custom experience without creating a second competing public page.
        </p>
      </section>

      <form action={saveAction} className="grid gap-6">
        <section className="rounded-[2rem] border border-[color:var(--line)] bg-white/80 p-6">
          <h2 className="text-xl font-semibold">Core text</h2>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Intro kicker</span>
              <input name="introKicker" defaultValue={document.introKicker} className="rounded-xl border border-black/12 px-4 py-3 text-sm" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Intro tagline</span>
              <textarea name="introTagline" defaultValue={document.introTagline} rows={3} className="rounded-xl border border-black/12 px-4 py-3 text-sm" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Current reading title</span>
              <input name="currentReadingTitle" defaultValue={document.currentReadingTitle} className="rounded-xl border border-black/12 px-4 py-3 text-sm" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Current reading body</span>
              <textarea name="currentReadingBody" defaultValue={document.currentReadingBody} rows={4} className="rounded-xl border border-black/12 px-4 py-3 text-sm" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Media section heading</span>
              <input name="sectionHeading" defaultValue={document.sectionHeading} className="rounded-xl border border-black/12 px-4 py-3 text-sm" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Media section description</span>
              <textarea name="sectionDescription" defaultValue={document.sectionDescription} rows={4} className="rounded-xl border border-black/12 px-4 py-3 text-sm" />
            </label>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[color:var(--line)] bg-white/80 p-6">
          <h2 className="text-xl font-semibold">Structured data</h2>
          <p className="mt-2 text-sm leading-7 text-black/62">
            These arrays drive the room itself. Edit them here and save to update the canonical project-room page.
          </p>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Media items JSON</span>
              <textarea name="mediaItems" defaultValue={JSON.stringify(document.mediaItems, null, 2)} rows={16} className="rounded-xl border border-black/12 px-4 py-3 font-mono text-xs" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Entry points JSON</span>
              <textarea name="entryPoints" defaultValue={JSON.stringify(document.entryPoints, null, 2)} rows={16} className="rounded-xl border border-black/12 px-4 py-3 font-mono text-xs" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Timeline JSON</span>
              <textarea name="timeline" defaultValue={JSON.stringify(document.timeline, null, 2)} rows={12} className="rounded-xl border border-black/12 px-4 py-3 font-mono text-xs" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Ambiguity scale JSON</span>
              <textarea name="ambiguityScale" defaultValue={JSON.stringify(document.ambiguityScale, null, 2)} rows={10} className="rounded-xl border border-black/12 px-4 py-3 font-mono text-xs" />
            </label>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white">
            Save project room
          </button>
          <Link href="/works/post-2735" className="rounded-full border border-black/12 px-5 py-3 text-sm hover:bg-black/[0.03]">
            View room
          </Link>
        </div>
      </form>
    </main>
  );
}
