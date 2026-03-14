"use client";

import { useState } from "react";
import Link from "next/link";
import { stripHtml, type EditorMediaBlock, type EditorTextBlock } from "@/lib/editor-schema";
import { getRecoveredMediaBlock } from "@/lib/media-inference";
import type { HomeBookHeroSection } from "@/lib/site-page-schema";
import { getRecoveryContentRecordBySourceId, getRecoverySnapshot } from "@/lib/wordpress-data";
import type { WorkspaceEntry } from "@/lib/server/workspace-store";

type BookHeroProps = {
  section: HomeBookHeroSection;
  posts: WorkspaceEntry[];
};

type SpreadKey = "overview" | "image" | "video";

function getYouTubeEmbed(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }

    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
  } catch {
    return url;
  }

  return url;
}

function getVimeoEmbed(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : url;
    }
  } catch {
    return url;
  }

  return url;
}

function getEmbedSource(url: string) {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return getYouTubeEmbed(url);
  }

  if (url.includes("vimeo.com")) {
    return getVimeoEmbed(url);
  }

  return url;
}

function getProjectText(entry: WorkspaceEntry) {
  const textBlocks = entry.editorDocument.blocks.filter((block): block is EditorTextBlock => block.type === "text");
  const documentText = textBlocks
    .map((block) => stripHtml(block.html))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return entry.excerpt || documentText || "Open the project to read the full work.";
}

function getProjectMedia(entry: WorkspaceEntry) {
  const snapshot = getRecoverySnapshot();
  const recoveryRecord = getRecoveryContentRecordBySourceId(entry.sourceId);
  const linkedAttachmentIds = Array.from(new Set([...(recoveryRecord?.linkedAttachmentIds ?? []), ...entry.linkedAttachmentIds]));
  const attachments = snapshot.attachments.filter((attachment) => linkedAttachmentIds.includes(attachment.id));
  const primaryMedia = getRecoveredMediaBlock(entry.editorDocument, attachments, { includeLegacyHtml: true });
  const mediaBlocks = entry.editorDocument.blocks.filter(
    (block): block is EditorMediaBlock => block.type === "media" && block.url.trim().length > 0,
  );
  const imageMedia =
    mediaBlocks.find((block) => block.mediaType === "image") ??
    (primaryMedia?.mediaType === "image" ? primaryMedia : null);
  const videoMedia =
    mediaBlocks.find((block) => block.mediaType === "video" || block.mediaType === "embed") ??
    (primaryMedia && (primaryMedia.mediaType === "video" || primaryMedia.mediaType === "embed") ? primaryMedia : null);

  return {
    primaryMedia,
    imageMedia,
    videoMedia,
  };
}

function SpreadMedia({ media, title }: { media: EditorMediaBlock | null; title: string }) {
  if (!media?.url) {
    return (
      <div className="flex h-full min-h-[280px] items-end rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_32%),linear-gradient(135deg,#f6f0e2_0%,#dbcda8_52%,#bca36d_100%)] p-6 text-[#1e160a]">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.34em] text-[#1e160a]/50">Media</p>
          <p className="mt-3 max-w-sm text-2xl font-semibold tracking-[-0.05em]">{title}</p>
          <p className="mt-3 max-w-md text-sm leading-7 text-[#1e160a]/68">Add image or video blocks to the selected work to stage them here.</p>
        </div>
      </div>
    );
  }

  if (media.mediaType === "image") {
    return (
      <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#16120d]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.url} alt={media.alt || media.title || title} className="h-full min-h-[280px] w-full object-cover" />
      </div>
    );
  }

  if (media.mediaType === "video" && /\.(mp4|webm|ogg)(\?.*)?$/i.test(media.url)) {
    return (
      <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#090909]">
        <video src={media.url} controls muted playsInline className="h-full min-h-[280px] w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#090909]">
      <iframe
        src={getEmbedSource(media.url)}
        title={media.title || title}
        className="h-[320px] w-full md:h-[420px]"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}

export function HomepageBookHero({ section, posts }: BookHeroProps) {
  const entry =
    (section.featuredPostSourceId !== null
      ? posts.find((post) => post.sourceId === section.featuredPostSourceId) ?? null
      : null) ??
    (section.fallbackFeaturedSlug ? posts.find((post) => post.slug === section.fallbackFeaturedSlug) ?? null : null) ??
    posts[0] ??
    null;

  const [isOpen, setIsOpen] = useState(false);
  const [activeSpread, setActiveSpread] = useState<SpreadKey>("overview");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  if (!entry) {
    return (
      <section className="grid gap-8 border-b border-white/10 py-10 md:py-16">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.34em] text-white/28">{section.eyebrow}</p>
          <h1 className="mt-4 text-[clamp(2.8rem,8vw,6rem)] font-semibold leading-[0.9] tracking-[-0.08em] text-white">{section.title}</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/58">{section.description}</p>
        </div>
        <div className="rounded-[2.2rem] border border-dashed border-white/16 bg-white/[0.03] p-8 text-sm text-white/58">
          No published work is available yet for the book hero.
        </div>
      </section>
    );
  }

  const projectText = getProjectText(entry);
  const projectMedia = getProjectMedia(entry);
  const spreadTabs: Array<{ key: SpreadKey; label: string; enabled: boolean }> = [
    { key: "overview", label: "Text", enabled: true },
    { key: "image", label: "Image", enabled: Boolean(projectMedia.imageMedia || projectMedia.primaryMedia) },
    { key: "video", label: "Video", enabled: Boolean(projectMedia.videoMedia) },
  ];
  const availableSpread = spreadTabs.find((tab) => tab.key === activeSpread && tab.enabled) ? activeSpread : "overview";
  const projectHref = `/works/${encodeURIComponent(entry.slug)}`;

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 12;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -10;
    setTilt({ x: Number(y.toFixed(2)), y: Number(x.toFixed(2)) });
  };

  return (
    <section className="border-b border-white/10 py-10 md:py-16">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-6 lg:sticky lg:top-8">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.34em] text-white/28">{section.eyebrow}</p>
            <h1 className="mt-5 text-[clamp(3.6rem,8vw,8.2rem)] font-semibold leading-[0.84] tracking-[-0.09em] text-white">{section.title}</h1>
          </div>
          <p className="max-w-xl text-sm leading-7 text-white/58">{section.description}</p>
          <div className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
            <div className="bg-[#050505] px-5 py-5">
              <p className="text-[0.68rem] uppercase tracking-[0.32em] text-white/28">Project</p>
              <p className="mt-4 text-3xl font-semibold tracking-[-0.05em]">{entry.title}</p>
              <p className="mt-3 text-sm leading-7 text-white/52">{projectText}</p>
            </div>
            <div className="bg-[#050505] px-5 py-5">
              <p className="text-[0.68rem] uppercase tracking-[0.32em] text-white/28">Book mode</p>
              <p className="mt-4 text-3xl font-semibold tracking-[-0.05em]">{isOpen ? "Open" : "Closed"}</p>
              <p className="mt-3 text-sm leading-7 text-white/52">The cover opens into spreads that can stage text, recovered images, and video from the selected work.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsOpen((current) => !current)}
              className="rounded-full bg-[#efe3bf] px-5 py-3 text-sm font-medium text-[#1a140a] transition hover:opacity-90"
            >
              {isOpen ? "Close cover" : section.ctaLabel}
            </button>
            <Link
              href={projectHref}
              className="rounded-full border border-white/14 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.05]"
            >
              {section.secondaryCtaLabel}
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {spreadTabs
              .filter((tab) => tab.enabled)
              .map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setIsOpen(true);
                    setActiveSpread(tab.key);
                  }}
                  className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.28em] transition ${
                    availableSpread === tab.key ? "border-[#efe3bf] bg-[#efe3bf] text-[#1a140a]" : "border-white/14 text-white/58 hover:bg-white/[0.05]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
          </div>
        </div>

        <div className="relative" style={{ perspective: "2400px" }}>
          <div
            className="relative mx-auto aspect-[1.18/1] w-full max-w-[860px]"
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setTilt({ x: 0, y: 0 })}
          >
            <div
              className="absolute inset-0 transition duration-500 ease-out"
              style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
            >
              <div className="absolute inset-[2%] rounded-[2.4rem] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.1),transparent_28%),linear-gradient(140deg,#0f0e0c_0%,#080808_46%,#12110f_100%)] shadow-[0_40px_120px_rgba(0,0,0,0.45)]" />

              <div className="absolute inset-[4%] rounded-[2.2rem] bg-[#15110c] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
                <div className="absolute inset-[1.8%] rounded-[2rem] bg-[#f4ead2] shadow-[inset_0_0_0_1px_rgba(85,63,22,0.08)]" />
              </div>

              <div className="absolute inset-[5.5%] overflow-hidden rounded-[2rem] [transform-style:preserve-3d]">
                <div className="absolute inset-0 grid grid-cols-2 bg-[#f8f0dd] text-[#1b1409]">
                  <div className="relative border-r border-[#b79d6c]/30 p-6 sm:p-8">
                    <div className="absolute inset-y-6 right-0 w-px bg-[linear-gradient(to_bottom,transparent,rgba(123,92,39,0.22),transparent)]" />
                    <p className="text-[0.62rem] uppercase tracking-[0.34em] text-[#5f4a22]/55">{entry.slug}</p>
                    <h2 className="mt-5 max-w-md text-[clamp(2rem,4vw,4rem)] font-semibold leading-[0.9] tracking-[-0.06em]">{entry.title}</h2>
                    <p className="mt-5 max-w-md text-sm leading-7 text-[#43341b]/78">{projectText}</p>
                    <div className="mt-8 space-y-3 text-[0.7rem] uppercase tracking-[0.28em] text-[#5f4a22]/55">
                      <p>Spread {availableSpread === "overview" ? "01" : availableSpread === "image" ? "02" : "03"}</p>
                      <p>{availableSpread === "overview" ? "Editorial overview" : availableSpread === "image" ? "Recovered image" : "Recovered video"}</p>
                    </div>
                  </div>

                  <div className="bg-[#f5ebd5] p-4 sm:p-6">
                    {availableSpread === "overview" ? (
                      <div className="flex h-full min-h-[280px] flex-col justify-between rounded-[1.6rem] border border-[#c8b386]/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.5),rgba(239,227,191,0.3))] p-6">
                        <div>
                          <p className="text-[0.62rem] uppercase tracking-[0.34em] text-[#5f4a22]/55">Spread notes</p>
                          <p className="mt-5 max-w-sm text-3xl font-semibold leading-[0.95] tracking-[-0.05em]">A homepage project hero that opens like a case-study object.</p>
                        </div>
                        <div className="grid gap-3 text-sm leading-7 text-[#43341b]/78">
                          <p>The selected work supplies the title, route, and recovered media.</p>
                          <p>Use the spread buttons to stage an image or video inside the open book without leaving the homepage.</p>
                        </div>
                      </div>
                    ) : availableSpread === "image" ? (
                      <SpreadMedia media={projectMedia.imageMedia ?? projectMedia.primaryMedia} title={entry.title} />
                    ) : (
                      <SpreadMedia media={projectMedia.videoMedia} title={entry.title} />
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen((current) => !current)}
                  className="absolute inset-0 origin-left rounded-[2rem] bg-[linear-gradient(140deg,#ead79a_0%,#b9924f_42%,#6a4a20_100%)] text-left text-[#201406] shadow-[20px_0_60px_rgba(0,0,0,0.28)] transition duration-700 [backface-visibility:hidden]"
                  style={{
                    transform: isOpen ? "rotateY(-158deg)" : "rotateY(0deg)",
                    transformStyle: "preserve-3d",
                  }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_30%),linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.18)_100%)]" />
                  <div className="absolute inset-y-0 left-[9%] w-[2px] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.14),rgba(0,0,0,0.22),rgba(255,255,255,0.1))]" />
                  <div className="relative flex h-full flex-col justify-between p-7 sm:p-10">
                    <div>
                      <p className="text-[0.68rem] uppercase tracking-[0.36em] text-[#2a1b08]/55">{section.eyebrow}</p>
                      <div className="mt-10 max-w-[18rem] rounded-[1.6rem] border border-black/8 bg-white/10 p-5 backdrop-blur-sm">
                        <p className="text-[0.62rem] uppercase tracking-[0.32em] text-[#2a1b08]/55">Featured work</p>
                        <p className="mt-4 text-[clamp(2rem,4vw,4rem)] font-semibold leading-[0.9] tracking-[-0.06em]">{entry.title}</p>
                      </div>
                    </div>
                    <div className="max-w-xs">
                      <p className="text-sm leading-7 text-[#2a1b08]/78">{section.description}</p>
                      <p className="mt-6 text-[0.68rem] uppercase tracking-[0.32em] text-[#2a1b08]/55">{isOpen ? "Click to close the cover" : "Click to open the book"}</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
