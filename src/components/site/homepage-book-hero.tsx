"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { stripHtml, type EditorMediaBlock, type EditorTextBlock } from "@/lib/editor-schema";
import { getRecoveredMediaBlock } from "@/lib/media-inference";
import type { HomeBookHeroSection } from "@/lib/site-page-schema";
import { getRecoveryContentRecordBySourceId, getRecoverySnapshot } from "@/lib/wordpress-data";
import type { WorkspaceEntry } from "@/lib/server/workspace-store";

type HeroMode = "video" | "image" | "notes";

type BookHeroProps = {
  section: HomeBookHeroSection;
  posts: WorkspaceEntry[];
};

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

function VideoSurface({ media, title }: { media: EditorMediaBlock | null; title: string }) {
  if (!media?.url) {
    return (
      <div className="aspect-video overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_30%),linear-gradient(145deg,#241d10_0%,#0b0b0b_44%,#17140d_100%)]">
        <div className="flex h-full items-end p-7 text-white">
          <div className="max-w-md">
            <p className="text-[0.68rem] uppercase tracking-[0.34em] text-white/42">Motion slot</p>
            <p className="mt-4 text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[0.92] tracking-[-0.06em]">{title}</p>
            <p className="mt-4 text-sm leading-7 text-white/58">This layout is built to foreground video. Add a video block or embed to the selected project and it will take over this stage automatically.</p>
          </div>
        </div>
      </div>
    );
  }

  if (media.mediaType === "video" && /\.(mp4|webm|ogg)(\?.*)?$/i.test(media.url)) {
    return (
      <div className="aspect-video overflow-hidden rounded-[2rem] border border-white/10 bg-black">
        <video src={media.url} autoPlay muted loop playsInline controls className="h-full w-full object-cover" />
      </div>
    );
  }

  if (media.mediaType === "embed" || media.mediaType === "video") {
    return (
      <div className="aspect-video overflow-hidden rounded-[2rem] border border-white/10 bg-black">
        <iframe
          src={getEmbedSource(media.url)}
          title={media.title || title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <div className="aspect-video overflow-hidden rounded-[2rem] border border-white/10 bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={media.url} alt={media.alt || media.title || title} className="h-full w-full object-cover" />
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

  const overrideVideoMedia: EditorMediaBlock | null = section.featuredVideoUrl.trim()
    ? {
        id: "featured-motion-override",
        type: "media",
        mediaType: "video",
        url: section.featuredVideoUrl.trim(),
        title: entry?.title || section.title,
        caption: "Featured motion override.",
        alt: entry?.title || section.title,
        aspect: "landscape",
        emphasis: "feature",
      }
    : null;
  const fallbackText = "Open the project to read the full work.";
  const projectText = entry ? getProjectText(entry) : fallbackText;
  const recoveredMedia = entry ? getProjectMedia(entry) : { primaryMedia: null, imageMedia: null, videoMedia: null };
  const projectMedia = {
    ...recoveredMedia,
    videoMedia: overrideVideoMedia ?? recoveredMedia.videoMedia,
  };
  const initialMode: HeroMode = projectMedia.videoMedia ? "video" : projectMedia.imageMedia ? "image" : "notes";
  const [activeMode, setActiveMode] = useState<HeroMode>(initialMode);
  const projectHref = entry ? `/works/${encodeURIComponent(entry.slug)}` : "/works";
  const displayTitle = entry?.title || "Featured motion";
  const cleanExcerpt = projectText.length > 240 ? `${projectText.slice(0, 237).trimEnd()}...` : projectText;
  const activeLabel = activeMode === "video" ? "Motion" : activeMode === "image" ? "Still" : "Notes";
  const notesText = useMemo(() => {
    if (!entry) {
      return cleanExcerpt;
    }

    const textBlocks = entry.editorDocument.blocks.filter((block): block is EditorTextBlock => block.type === "text");
    const text = textBlocks
      .map((block) => stripHtml(block.html))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return text.length > 420 ? `${text.slice(0, 417).trimEnd()}...` : text || cleanExcerpt;
  }, [cleanExcerpt, entry]);

  if (!entry && !projectMedia.videoMedia) {
    return (
      <section className="grid gap-8 border-b border-white/10 py-10 md:py-16">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.34em] text-white/28">{section.eyebrow}</p>
          <h1 className="mt-4 text-[clamp(2.8rem,8vw,6rem)] font-semibold leading-[0.9] tracking-[-0.08em] text-white">{section.title}</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/58">{section.description}</p>
        </div>
        <div className="rounded-[2.2rem] border border-dashed border-white/16 bg-white/[0.03] p-8 text-sm text-white/58">
          No published work is available yet for the featured video hero.
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden border-b border-white/10 py-10 md:py-16">
      <div className="absolute inset-x-[-10%] top-[-4rem] h-[28rem] bg-[radial-gradient(circle_at_center,rgba(182,153,90,0.18),transparent_58%)] blur-3xl" />
      <div className="absolute right-[-10%] top-[18%] h-[18rem] w-[18rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_68%)] blur-3xl" />

      <div className="relative grid gap-8 xl:grid-cols-[minmax(0,0.74fr)_minmax(0,1fr)] xl:gap-12">
        <div className="space-y-6">
          <p className="text-[0.72rem] uppercase tracking-[0.34em] text-white/28">{section.eyebrow}</p>
          <h1 className="max-w-3xl text-[clamp(3.6rem,9vw,8.6rem)] font-semibold leading-[0.82] tracking-[-0.09em] text-white">{section.title}</h1>
          <p className="max-w-xl text-base leading-8 text-white/60">{section.description}</p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveMode(projectMedia.videoMedia ? "video" : projectMedia.imageMedia ? "image" : "notes")}
              className="rounded-full bg-[#ebd58c] px-5 py-3 text-sm font-medium text-[#120f09] transition hover:opacity-90"
            >
              {section.ctaLabel}
            </button>
            <Link
              href={projectHref}
              className="rounded-full border border-white/14 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.05]"
            >
              {section.secondaryCtaLabel}
            </Link>
          </div>

          <div className="grid gap-px overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/10 sm:grid-cols-3">
            {[
              { key: "video" as const, label: "Play", enabled: Boolean(projectMedia.videoMedia) },
              { key: "image" as const, label: "Freeze", enabled: Boolean(projectMedia.imageMedia || projectMedia.primaryMedia) },
              { key: "notes" as const, label: "Read", enabled: true },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveMode(item.key)}
                disabled={!item.enabled}
                className={`px-4 py-4 text-left transition ${
                  activeMode === item.key ? "bg-[#f2ead7] text-[#17120b]" : "bg-[#050505] text-white/68 hover:bg-white/[0.04]"
                } ${item.enabled ? "" : "cursor-not-allowed text-white/25"}`}
              >
                <p className="text-[0.62rem] uppercase tracking-[0.32em]">{item.label}</p>
                <p className="mt-3 text-xl font-semibold tracking-[-0.04em]">
                  {item.key === "video" ? "Video stage" : item.key === "image" ? "Image drift" : "Project notes"}
                </p>
              </button>
            ))}
          </div>

          <div className="grid gap-4 text-sm leading-7 text-white/56 sm:grid-cols-2">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[0.64rem] uppercase tracking-[0.32em] text-white/34">Selected work</p>
              <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">{displayTitle}</p>
              <p className="mt-3">{cleanExcerpt}</p>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[0.64rem] uppercase tracking-[0.32em] text-white/34">Active layer</p>
              <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">{activeLabel}</p>
              <p className="mt-3">The homepage now behaves like a motion-led editorial stage instead of an object animation.</p>
            </div>
          </div>
        </div>

        <div className="relative min-h-[36rem]">
          <div className="absolute left-[2%] top-[4%] h-[14rem] w-[14rem] rounded-full border border-white/10 bg-[radial-gradient(circle,rgba(255,255,255,0.12),transparent_65%)] blur-2xl" />
          <div className="absolute inset-x-0 top-0 h-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)]" />

          <div className="relative rounded-[2.2rem] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.35)] sm:p-6">
            <div className="absolute inset-0 rounded-[2.2rem] bg-[linear-gradient(130deg,rgba(235,213,140,0.18),transparent_28%,transparent_72%,rgba(103,133,219,0.12))]" />

            <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-4">
                {activeMode === "notes" ? (
                  <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_30%),linear-gradient(145deg,#f1e7d0_0%,#c9b383_46%,#7c6440_100%)] p-8 text-[#17120b]">
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_0,transparent_96%,rgba(23,18,11,0.08)_96%,rgba(23,18,11,0.08)_100%)] bg-[length:100%_28px]" />
                    <div className="relative">
                      <p className="text-[0.62rem] uppercase tracking-[0.34em] text-[#17120b]/56">Editorial notes</p>
                      <p className="mt-6 max-w-xl text-[clamp(2rem,4vw,4rem)] font-semibold leading-[0.94] tracking-[-0.05em]">{displayTitle}</p>
                      <p className="mt-6 max-w-2xl text-sm leading-8 text-[#17120b]/76">{notesText}</p>
                    </div>
                  </div>
                ) : activeMode === "image" ? (
                  <div className="relative">
                    <div className="absolute -left-4 top-8 z-10 hidden h-[72%] w-[40%] rotate-[-5deg] rounded-[1.6rem] border border-white/10 bg-black/30 backdrop-blur-sm md:block" />
                    <div className="absolute -right-4 bottom-6 z-10 hidden h-[45%] w-[28%] rotate-[7deg] rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))] md:block" />
                    <div className="relative z-20">
                      <VideoSurface media={projectMedia.imageMedia ?? projectMedia.primaryMedia} title={displayTitle} />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute -left-3 top-6 z-10 h-[82%] w-[28%] rotate-[-8deg] rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.02))] backdrop-blur-sm" />
                    <div className="absolute -right-2 bottom-8 z-10 h-[34%] w-[24%] rotate-[8deg] overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/60">
                      {projectMedia.imageMedia?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={projectMedia.imageMedia.url} alt={projectMedia.imageMedia.alt || displayTitle} className="h-full w-full object-cover opacity-80" />
                      ) : (
                        <div className="flex h-full items-end p-4 text-[0.62rem] uppercase tracking-[0.28em] text-white/38">Still layer</div>
                      )}
                    </div>
                    <div className="relative z-20">
                      <VideoSurface media={projectMedia.videoMedia} title={displayTitle} />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-4 self-start">
                <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4">
                  <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">Badge</p>
                  <div className="mt-4 rounded-[1.2rem] border border-white/8 bg-black/40 p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/nominert.png" alt="Nominert" className="mx-auto h-auto w-full max-w-[180px] invert brightness-125 contrast-125" />
                  </div>
                </div>
                <div className="rounded-[1.6rem] border border-white/10 bg-[#050505] p-4">
                  <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">Now showing</p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">{activeLabel}</p>
                  <p className="mt-3 text-sm leading-7 text-white/54">Large motion surface, offset support layers, and direct entry into the project page.</p>
                </div>
                <div className="rounded-[1.6rem] border border-white/10 bg-[#050505] p-4">
                  <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">Route</p>
                  <p className="mt-3 break-all text-sm leading-7 text-white/64">{projectHref}</p>
                </div>
                {entry ? (
                  <Link
                    href={projectHref}
                    className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
                  >
                    <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">Project page</p>
                    <p className="mt-3 text-xl font-semibold tracking-[-0.04em] text-white">{displayTitle}</p>
                    <p className="mt-3 text-sm leading-7 text-white/54">Open the full work and continue through the media sequence.</p>
                  </Link>
                ) : (
                  <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">Featured motion</p>
                    <p className="mt-3 text-xl font-semibold tracking-[-0.04em] text-white">{displayTitle}</p>
                    <p className="mt-3 text-sm leading-7 text-white/54">This hero is currently being driven by a direct video source override.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
