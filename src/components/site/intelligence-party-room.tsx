"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { stripHtml, type EditorTextBlock } from "@/lib/editor-schema";
import type {
  IntelligencePartyDocument,
  ProjectRoomEntryPoint,
  ProjectRoomMediaItem,
  ProjectRoomTimelineItem,
} from "@/lib/project-room-schema";
import type { WorkspaceEntry } from "@/lib/server/workspace-store";

type SectionId = "intro" | "current-reading" | "ambiguity" | "screening" | "entry-points" | "timeline";

function getOverviewText(entry: WorkspaceEntry) {
  const text = entry.editorDocument.blocks
    .filter((block): block is EditorTextBlock => block.type === "text")
    .map((block) => stripHtml(block.html))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > 540 ? `${text.slice(0, 537).trimEnd()}...` : text;
}

function getMediaCardClasses(item: ProjectRoomMediaItem) {
  if (item.size === "hero") {
    return "md:col-span-2 md:row-span-2";
  }

  if (item.size === "wide") {
    return "md:col-span-2";
  }

  if (item.size === "tall") {
    return "md:row-span-2";
  }

  return "";
}

function getMediaAspectClass(item: ProjectRoomMediaItem) {
  if (item.size === "hero") {
    return "aspect-[16/10]";
  }

  if (item.size === "wide") {
    return "aspect-[16/8]";
  }

  if (item.size === "tall") {
    return "aspect-[4/5] md:aspect-auto md:h-full md:min-h-[23rem]";
  }

  return "aspect-[4/3]";
}

function reorder<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }
  const clone = [...items];
  const [item] = clone.splice(index, 1);
  clone.splice(nextIndex, 0, item);
  return clone;
}

function SectionFrame({
  sectionId,
  selected,
  editable,
  onSelect,
  children,
}: {
  sectionId: SectionId;
  selected: boolean;
  editable: boolean;
  onSelect: (id: SectionId) => void;
  children: React.ReactNode;
}) {
  if (!editable) {
    return <>{children}</>;
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(sectionId);
      }}
      className={`block w-full rounded-[2rem] border border-dashed p-3 text-left transition ${
        selected ? "border-[#ebd58c]/55 bg-[#ebd58c]/[0.06]" : "border-white/12 hover:border-white/28 hover:bg-white/[0.02]"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3 text-[0.68rem] uppercase tracking-[0.28em] text-white/35">
        <span>{sectionId}</span>
      </div>
      {children}
    </div>
  );
}

export function IntelligencePartyRoom({
  entry,
  document: initialDocument,
  canEdit = false,
  saveAction,
}: {
  entry: WorkspaceEntry;
  document: IntelligencePartyDocument;
  canEdit?: boolean;
  saveAction?: (payload: { document: IntelligencePartyDocument }) => Promise<{ ok: boolean }>;
}) {
  const router = useRouter();
  const [document, setDocument] = useState(initialDocument);
  const [activeMediaId, setActiveMediaId] = useState(initialDocument.mediaItems[0]?.id ?? "");
  const [activeEntryPointId, setActiveEntryPointId] = useState(initialDocument.entryPoints[0]?.id ?? "");
  const [editMode, setEditMode] = useState(false);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [selectedSectionId, setSelectedSectionId] = useState<SectionId>("intro");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [rawDocument, setRawDocument] = useState(JSON.stringify(initialDocument, null, 2));

  const activeMedia = document.mediaItems.find((item) => item.id === activeMediaId) ?? document.mediaItems[0];
  const activeEntryPoint = document.entryPoints.find((item) => item.id === activeEntryPointId) ?? document.entryPoints[0];
  const selectedMediaIndex = document.mediaItems.findIndex((item) => item.id === activeMediaId);
  const selectedEntryPointIndex = document.entryPoints.findIndex((item) => item.id === activeEntryPointId);
  const overview = getOverviewText(entry);
  const viewportClass =
    viewport === "mobile" ? "max-w-[420px]" : viewport === "tablet" ? "max-w-[900px]" : "max-w-[1650px]";

  useEffect(() => {
    setRawDocument(JSON.stringify(document, null, 2));
  }, [document]);

  if (!activeMedia || !activeEntryPoint) {
    return null;
  }

  const updateMediaItem = (itemId: string, patch: Partial<ProjectRoomMediaItem>) => {
    setDocument((current) => ({
      ...current,
      mediaItems: current.mediaItems.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    }));
  };

  const updateEntryPoint = (itemId: string, patch: Partial<ProjectRoomEntryPoint>) => {
    setDocument((current) => ({
      ...current,
      entryPoints: current.entryPoints.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    }));
  };

  const updateTimelineItem = (index: number, patch: Partial<ProjectRoomTimelineItem>) => {
    setDocument((current) => ({
      ...current,
      timeline: current.timeline.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }));
  };

  const moveActiveMedia = (direction: -1 | 1) => {
    if (selectedMediaIndex < 0) {
      return;
    }

    setDocument((current) => ({
      ...current,
      mediaItems: reorder(current.mediaItems, selectedMediaIndex, direction),
    }));
  };

  const moveActiveEntryPoint = (direction: -1 | 1) => {
    if (selectedEntryPointIndex < 0) {
      return;
    }

    setDocument((current) => ({
      ...current,
      entryPoints: reorder(current.entryPoints, selectedEntryPointIndex, direction),
    }));
  };

  const save = () => {
    if (!saveAction) {
      return;
    }

    setSaveState("saving");
    startTransition(async () => {
      try {
        await saveAction({ document: JSON.parse(rawDocument) as IntelligencePartyDocument });
        setSaveState("saved");
        router.refresh();
      } catch {
        setSaveState("error");
      }
    });
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className={`mx-auto px-5 py-6 sm:px-8 ${viewportClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <Link href="/" className="text-xs uppercase tracking-[0.34em] text-white/45 transition hover:text-white/70">
            Lars Cuzner
          </Link>
          <div className="flex flex-wrap gap-5 text-xs uppercase tracking-[0.3em] text-white/35">
            <Link href="/works" className="transition hover:text-white/70">
              Works
            </Link>
            <Link href="/info" className="transition hover:text-white/70">
              Info
            </Link>
            {canEdit ? (
              <>
                <button type="button" onClick={() => setEditMode((current) => !current)} className="transition hover:text-white/70">
                  {editMode ? "Close editor" : "Edit project room"}
                </button>
                <Link href="/admin/project-room/intelligence-party" className="transition hover:text-white/70">
                  Backend
                </Link>
              </>
            ) : null}
            <a href={entry.publicUrl} className="transition hover:text-white/70" target="_blank" rel="noreferrer">
              Legacy page
            </a>
          </div>
        </div>
      </div>

      <div className={`mx-auto grid gap-4 px-5 pb-6 sm:gap-6 sm:px-8 sm:pb-8 ${editMode && canEdit ? "max-w-[2100px] xl:grid-cols-[minmax(0,1fr)_420px]" : viewportClass}`}>
        <div className={editMode && canEdit ? viewportClass : ""}>
          <SectionFrame sectionId="intro" editable={editMode && canEdit} selected={selectedSectionId === "intro"} onSelect={setSelectedSectionId}>
            <section className="relative overflow-hidden border-b border-white/10 py-8 sm:py-10 xl:py-14">
              <div className="absolute inset-x-[-10%] top-[-5rem] h-[22rem] bg-[radial-gradient(circle_at_center,rgba(180,143,69,0.18),transparent_58%)] blur-3xl" />
              <div className="relative space-y-10">
                <div className="space-y-6 border-b border-white/10 pb-8">
                  <p className="text-[0.72rem] uppercase tracking-[0.36em] text-white/26">{document.introKicker}</p>
                  <div className="flex flex-wrap gap-2 text-[0.6rem] uppercase tracking-[0.28em] text-white/40">
                    <span className="rounded-full border border-[#ebd58c]/30 bg-[#ebd58c]/10 px-3 py-1 text-[#f2dfa5]">{document.badgePrimary}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1">{document.badgeYears}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1">{document.badgePlaces}</span>
                  </div>
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] xl:items-end">
                    <div>
                      <h1 className="max-w-[10ch] text-[clamp(3.2rem,8vw,6.6rem)] font-semibold leading-[0.9] tracking-[-0.085em] text-white">
                        {document.projectTitle}
                      </h1>
                    </div>
                    <p className="max-w-xl text-[1rem] leading-8 text-white/60 xl:justify-self-end">{document.introTagline}</p>
                  </div>
                  {canEdit ? (
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setEditMode((current) => !current)}
                        className="rounded-full border border-[#ebd58c]/35 bg-[#ebd58c]/10 px-4 py-2 text-[0.65rem] uppercase tracking-[0.32em] text-[#f2dfa5] transition hover:border-[#ebd58c]/55 hover:bg-[#ebd58c]/16"
                      >
                        {editMode ? "Close editor" : "Edit project room"}
                      </button>
                      <p className="self-center text-sm leading-6 text-white/45">
                        This slug stays the canonical project room. Click a section to edit it directly on the page.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </SectionFrame>

          <div className="grid gap-8 xl:grid-cols-[minmax(300px,0.48fr)_minmax(0,1.52fr)] xl:gap-10">
            <SectionFrame sectionId="current-reading" editable={editMode && canEdit} selected={selectedSectionId === "current-reading"} onSelect={setSelectedSectionId}>
              <div className="space-y-8">
                <div className="border-l border-[#ebd58c]/30 pl-5">
                  <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">{document.currentReadingLabel}</p>
                  <p className="mt-3 text-[1.55rem] font-semibold leading-tight tracking-[-0.05em] text-white">
                    {document.currentReadingTitle}
                  </p>
                  <p className="mt-4 max-w-sm text-sm leading-7 text-white/55">{document.currentReadingBody}</p>
                </div>

                <SectionFrame sectionId="ambiguity" editable={editMode && canEdit} selected={selectedSectionId === "ambiguity"} onSelect={setSelectedSectionId}>
                  <div className="space-y-4 border-t border-white/10 pt-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">{document.ambiguityLabel}</p>
                      <p className="text-[0.58rem] uppercase tracking-[0.28em] text-white/24">{document.ambiguityMetaLabel}</p>
                    </div>
                    <div className="space-y-3">
                      {document.ambiguityScale.map((item, index) => (
                        <div key={item.label} className="grid grid-cols-[auto_1fr_auto] items-start gap-3 border-b border-white/8 pb-3 last:border-b-0">
                          <p className="text-sm font-medium tracking-[-0.02em] text-white">{item.label}</p>
                          <p className="text-sm leading-6 text-white/52">{item.value}</p>
                          <p className="pt-0.5 text-[0.58rem] uppercase tracking-[0.3em] text-white/26">0{index + 1}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionFrame>

                <div className="border-t border-white/10 pt-5">
                  <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">{document.overviewLabel}</p>
                  <p className="mt-4 max-w-md text-sm leading-7 text-white/55">{overview}</p>
                </div>
              </div>
            </SectionFrame>

            <SectionFrame sectionId="screening" editable={editMode && canEdit} selected={selectedSectionId === "screening"} onSelect={setSelectedSectionId}>
              <div className="space-y-5">
                <div className="overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">{document.mainScreeningLabel}</p>
                      <p className="mt-2 text-[1.9rem] font-semibold tracking-[-0.05em] text-white">{activeMedia.label}</p>
                    </div>
                    <p className="max-w-sm text-sm leading-6 text-white/52">{activeMedia.note}</p>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-[1.7rem] border border-white/10 bg-black shadow-[0_26px_90px_rgba(0,0,0,0.35)]">
                    <div className="aspect-video w-full">
                      {activeMedia.type === "youtube" ? (
                        <iframe
                          src={activeMedia.url}
                          title={activeMedia.label}
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      ) : (
                        <video src={activeMedia.url} controls playsInline className="h-full w-full object-cover" />
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 md:grid-cols-[1fr_auto] md:items-start">
                    <p className="max-w-3xl text-sm leading-7 text-white/55">{activeMedia.caption}</p>
                    <span className="rounded-full border border-[#ebd58c]/35 bg-[#ebd58c]/10 px-3 py-1 text-[0.58rem] uppercase tracking-[0.28em] text-[#f2dfa5]">
                      {document.activeClipLabel}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {document.mediaItems.map((item) => {
                    const isActive = activeMediaId === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveMediaId(item.id)}
                        className={`group rounded-[1.35rem] border p-3 text-left transition ${
                          isActive
                            ? "border-[#ebd58c]/55 bg-[#ebd58c]/10"
                            : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="relative aspect-[16/10] overflow-hidden rounded-[1rem]">
                          <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.04]"
                            style={{ backgroundImage: `url("${item.thumbnail}")` }}
                          />
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.02),rgba(5,5,5,0.74))]" />
                          <div className="absolute inset-x-0 bottom-0 p-4">
                            <p className="text-lg font-medium tracking-[-0.04em] text-white">{item.label}</p>
                          </div>
                        </div>
                        <div className="flex items-start justify-between gap-3 px-1 pb-1 pt-3">
                          <p className="max-w-[28ch] text-sm leading-6 text-white/58">{item.note}</p>
                          {isActive ? (
                            <span className="mt-0.5 rounded-full border border-[#ebd58c]/35 px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.28em] text-[#f2dfa5]">
                              Active
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </SectionFrame>
          </div>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] xl:gap-10">
            <SectionFrame sectionId="screening" editable={editMode && canEdit} selected={selectedSectionId === "screening"} onSelect={setSelectedSectionId}>
              <div className="space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">{document.mediaSequenceLabel}</p>
                    <p className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-white">{document.sectionHeading}</p>
                  </div>
                  <p className="max-w-md text-sm leading-6 text-white/54">{document.sectionDescription}</p>
                </div>

                <div className="grid auto-rows-[minmax(200px,1fr)] gap-3 md:grid-cols-3">
                  {document.mediaItems.map((item) => {
                    const isActive = activeMediaId === item.id;

                    return (
                      <button
                        key={`${item.id}-spread`}
                        type="button"
                        onClick={() => setActiveMediaId(item.id)}
                        className={`group relative overflow-hidden rounded-[1.7rem] border text-left transition ${getMediaCardClasses(item)} ${
                          isActive
                            ? "border-[#ebd58c]/55 shadow-[0_0_0_1px_rgba(235,213,140,0.12)]"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className={`relative w-full overflow-hidden ${getMediaAspectClass(item)}`}>
                          <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.04]"
                            style={{ backgroundImage: `url("${item.thumbnail}")` }}
                          />
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.08),rgba(5,5,5,0.82))]" />
                          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[0.58rem] uppercase tracking-[0.3em] text-white/42">{document.mediaMetaLabel}</p>
                              <p className="text-[0.58rem] uppercase tracking-[0.3em] text-white/26">{item.size}</p>
                            </div>
                            <p className="mt-2 text-[1.1rem] font-medium tracking-[-0.04em] text-white">{item.label}</p>
                            <p className="mt-2 max-w-[30ch] text-sm leading-6 text-white/68">{item.caption}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </SectionFrame>

            <SectionFrame sectionId="entry-points" editable={editMode && canEdit} selected={selectedSectionId === "entry-points"} onSelect={setSelectedSectionId}>
              <div className="space-y-8">
                <div>
                  <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">{document.entryPointsLabel}</p>
                  <h2 className="mt-3 max-w-[12ch] text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[0.95] tracking-[-0.06em] text-white">
                    {document.entryPointsHeading}
                  </h2>
                  <p className="mt-4 max-w-md text-sm leading-7 text-white/55">{document.entryPointsDescription}</p>
                </div>

                <div className="grid gap-3">
                  {document.entryPoints.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveEntryPointId(item.id)}
                      className={`rounded-[1.35rem] border p-4 text-left transition ${
                        activeEntryPointId === item.id
                          ? "border-[#ebd58c]/55 bg-[#ebd58c]/10"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[0.58rem] uppercase tracking-[0.3em] text-white/34">{item.eyebrow}</p>
                          <p className="mt-2 text-lg font-medium tracking-[-0.03em] text-white">{item.label}</p>
                        </div>
                        {activeEntryPointId === item.id ? (
                          <span className="rounded-full border border-[#ebd58c]/35 px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.28em] text-[#f2dfa5]">
                            Selected
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-white/54">{item.description}</p>
                    </button>
                  ))}
                </div>

                <div className="rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 sm:p-6">
                  <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">{activeEntryPoint.eyebrow}</p>
                  <h3 className="mt-3 text-[clamp(1.65rem,3vw,2.5rem)] font-semibold leading-[1] tracking-[-0.05em] text-white">
                    {activeEntryPoint.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-white/58">{activeEntryPoint.description}</p>
                  <div className="mt-5 space-y-3">
                    {activeEntryPoint.bullets.map((bullet) => (
                      <div key={bullet} className="border-l border-[#ebd58c]/28 pl-4 text-sm leading-6 text-white/58">
                        {bullet}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionFrame>
          </div>

          <SectionFrame sectionId="timeline" editable={editMode && canEdit} selected={selectedSectionId === "timeline"} onSelect={setSelectedSectionId}>
            <div className="grid gap-8 border-t border-white/10 pt-8 xl:grid-cols-[minmax(280px,0.42fr)_minmax(0,1.58fr)] xl:gap-10">
              <div className="space-y-6">
                <div>
                  <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">{document.archiveExitsLabel}</p>
                  <div className="mt-4 grid gap-3 text-sm leading-6 text-white/58">
                    {document.archiveLinks.map((link) => (
                      <a key={`${link.href}-${link.label}`} href={link.href} target="_blank" rel="noreferrer" className="transition hover:text-white">
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">{document.roomNoteLabel}</p>
                  <p className="mt-4 max-w-sm text-sm leading-7 text-white/55">{document.roomNote}</p>
                </div>
              </div>

              <div>
                <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">{document.timelineLabel}</p>
                <p className="mt-2 max-w-xl text-[2rem] font-semibold leading-tight tracking-[-0.05em] text-white">
                  {document.timelineHeading}
                </p>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">{document.timelineDescription}</p>
                <div className="mt-6 border-l border-white/10 pl-6">
                  {document.timeline.map((item, index) => (
                    <div key={`${item.year}-${item.title}`} className={`relative pb-8 ${index === document.timeline.length - 1 ? "pb-0" : ""}`}>
                      <span className="absolute -left-[2.05rem] top-1 h-3 w-3 rounded-full border border-[#ebd58c]/40 bg-[#050505]" />
                      <div className="grid gap-2 md:grid-cols-[88px_1fr] md:items-start md:gap-5">
                        <p className="text-sm font-medium text-[#ebd58c]">{item.year}</p>
                        <div>
                          <p className="text-xl font-medium tracking-[-0.03em] text-white">{item.title}</p>
                          <p className="mt-2 max-w-3xl text-sm leading-7 text-white/55">{item.body}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionFrame>
        </div>

        {editMode && canEdit ? (
          <aside className="self-start xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto xl:pr-1">
            <div className="space-y-5 rounded-[2rem] border border-white/12 bg-white/[0.04] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/35">Project room builder</p>
                  <p className="mt-2 text-sm leading-7 text-white/60">Click a section in the room, then edit it here.</p>
                </div>
                <button type="button" onClick={save} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:opacity-90">
                  Save
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setViewport("desktop")} className="rounded-full border border-white/16 px-4 py-2 text-sm hover:bg-white/[0.04]">
                  Desktop
                </button>
                <button type="button" onClick={() => setViewport("tablet")} className="rounded-full border border-white/16 px-4 py-2 text-sm hover:bg-white/[0.04]">
                  Tablet
                </button>
                <button type="button" onClick={() => setViewport("mobile")} className="rounded-full border border-white/16 px-4 py-2 text-sm hover:bg-white/[0.04]">
                  Mobile
                </button>
              </div>

              {saveState === "saved" ? <p className="text-sm text-[#9de4b8]">Project room saved.</p> : null}
              {saveState === "saving" ? <p className="text-sm text-white/55">Saving...</p> : null}
              {saveState === "error" ? <p className="text-sm text-[#f2a08b]">Could not save. Try again.</p> : null}

              {selectedSectionId === "intro" ? (
                <div className="grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Project title</span>
                    <input
                      value={document.projectTitle}
                      onChange={(event) => setDocument((current) => ({ ...current, projectTitle: event.target.value }))}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Intro kicker</span>
                    <input
                      value={document.introKicker}
                      onChange={(event) => setDocument((current) => ({ ...current, introKicker: event.target.value }))}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Intro tagline</span>
                    <textarea
                      value={document.introTagline}
                      onChange={(event) => setDocument((current) => ({ ...current, introTagline: event.target.value }))}
                      rows={5}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Primary badge</span>
                    <input
                      value={document.badgePrimary}
                      onChange={(event) => setDocument((current) => ({ ...current, badgePrimary: event.target.value }))}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Years badge</span>
                    <input
                      value={document.badgeYears}
                      onChange={(event) => setDocument((current) => ({ ...current, badgeYears: event.target.value }))}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Places badge</span>
                    <input
                      value={document.badgePlaces}
                      onChange={(event) => setDocument((current) => ({ ...current, badgePlaces: event.target.value }))}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                </div>
              ) : null}

              {selectedSectionId === "current-reading" ? (
                <div className="grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Section label</span>
                    <input
                      value={document.currentReadingLabel}
                      onChange={(event) => setDocument((current) => ({ ...current, currentReadingLabel: event.target.value }))}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Current reading title</span>
                    <input
                      value={document.currentReadingTitle}
                      onChange={(event) => setDocument((current) => ({ ...current, currentReadingTitle: event.target.value }))}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Current reading body</span>
                    <textarea
                      value={document.currentReadingBody}
                      onChange={(event) => setDocument((current) => ({ ...current, currentReadingBody: event.target.value }))}
                      rows={5}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                </div>
              ) : null}

              {selectedSectionId === "ambiguity" ? (
                <div className="grid gap-3">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Section label</span>
                    <input
                      value={document.ambiguityLabel}
                      onChange={(event) => setDocument((current) => ({ ...current, ambiguityLabel: event.target.value }))}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Meta label</span>
                    <input
                      value={document.ambiguityMetaLabel}
                      onChange={(event) => setDocument((current) => ({ ...current, ambiguityMetaLabel: event.target.value }))}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Overview label</span>
                    <input
                      value={document.overviewLabel}
                      onChange={(event) => setDocument((current) => ({ ...current, overviewLabel: event.target.value }))}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  {document.ambiguityScale.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="grid gap-2 rounded-[1rem] border border-white/12 bg-black/20 p-3">
                      <input
                        value={item.label}
                        onChange={(event) =>
                          setDocument((current) => ({
                            ...current,
                            ambiguityScale: current.ambiguityScale.map((scaleItem, scaleIndex) =>
                              scaleIndex === index ? { ...scaleItem, label: event.target.value } : scaleItem,
                            ),
                          }))
                        }
                        className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                      />
                      <textarea
                        value={item.value}
                        onChange={(event) =>
                          setDocument((current) => ({
                            ...current,
                            ambiguityScale: current.ambiguityScale.map((scaleItem, scaleIndex) =>
                              scaleIndex === index ? { ...scaleItem, value: event.target.value } : scaleItem,
                            ),
                          }))
                        }
                        rows={3}
                        className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              {selectedSectionId === "screening" ? (
                <div className="grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Main screening label</span>
                    <input
                      value={document.mainScreeningLabel}
                      onChange={(event) => setDocument((current) => ({ ...current, mainScreeningLabel: event.target.value }))}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Active clip badge</span>
                    <input
                      value={document.activeClipLabel}
                      onChange={(event) => setDocument((current) => ({ ...current, activeClipLabel: event.target.value }))}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Media sequence label</span>
                    <input
                      value={document.mediaSequenceLabel}
                      onChange={(event) => setDocument((current) => ({ ...current, mediaSequenceLabel: event.target.value }))}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Section heading</span>
                    <input
                      value={document.sectionHeading}
                      onChange={(event) => setDocument((current) => ({ ...current, sectionHeading: event.target.value }))}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Section description</span>
                    <textarea
                      value={document.sectionDescription}
                      onChange={(event) => setDocument((current) => ({ ...current, sectionDescription: event.target.value }))}
                      rows={4}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Media meta label</span>
                    <input
                      value={document.mediaMetaLabel}
                      onChange={(event) => setDocument((current) => ({ ...current, mediaMetaLabel: event.target.value }))}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Active media</span>
                    <select
                      value={activeMediaId}
                      onChange={(event) => setActiveMediaId(event.target.value)}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    >
                      {document.mediaItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => moveActiveMedia(-1)} className="rounded-full border border-white/16 px-4 py-2 text-sm hover:bg-white/[0.04]">
                      Move up
                    </button>
                    <button type="button" onClick={() => moveActiveMedia(1)} className="rounded-full border border-white/16 px-4 py-2 text-sm hover:bg-white/[0.04]">
                      Move down
                    </button>
                  </div>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Label</span>
                    <input value={activeMedia.label} onChange={(event) => updateMediaItem(activeMedia.id, { label: event.target.value })} className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white" />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">URL</span>
                    <input value={activeMedia.url} onChange={(event) => updateMediaItem(activeMedia.id, { url: event.target.value })} className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white" />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Thumbnail</span>
                    <input value={activeMedia.thumbnail} onChange={(event) => updateMediaItem(activeMedia.id, { thumbnail: event.target.value })} className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white" />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Type</span>
                    <select
                      value={activeMedia.type}
                      onChange={(event) => updateMediaItem(activeMedia.id, { type: event.target.value as ProjectRoomMediaItem["type"] })}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    >
                      <option value="youtube">YouTube/embed</option>
                      <option value="video">Video file</option>
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Size</span>
                    <select
                      value={activeMedia.size}
                      onChange={(event) => updateMediaItem(activeMedia.id, { size: event.target.value as ProjectRoomMediaItem["size"] })}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    >
                      <option value="hero">Hero</option>
                      <option value="wide">Wide</option>
                      <option value="tall">Tall</option>
                      <option value="standard">Standard</option>
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Note</span>
                    <textarea value={activeMedia.note} onChange={(event) => updateMediaItem(activeMedia.id, { note: event.target.value })} rows={3} className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white" />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Caption</span>
                    <textarea value={activeMedia.caption} onChange={(event) => updateMediaItem(activeMedia.id, { caption: event.target.value })} rows={4} className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white" />
                  </label>
                </div>
              ) : null}

              {selectedSectionId === "entry-points" ? (
                <div className="grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Section label</span>
                    <input
                      value={document.entryPointsLabel}
                      onChange={(event) => setDocument((current) => ({ ...current, entryPointsLabel: event.target.value }))}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Section heading</span>
                    <textarea
                      value={document.entryPointsHeading}
                      onChange={(event) => setDocument((current) => ({ ...current, entryPointsHeading: event.target.value }))}
                      rows={3}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Section description</span>
                    <textarea
                      value={document.entryPointsDescription}
                      onChange={(event) =>
                        setDocument((current) => ({ ...current, entryPointsDescription: event.target.value }))
                      }
                      rows={4}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Active entry point</span>
                    <select
                      value={activeEntryPointId}
                      onChange={(event) => setActiveEntryPointId(event.target.value)}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    >
                      {document.entryPoints.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => moveActiveEntryPoint(-1)} className="rounded-full border border-white/16 px-4 py-2 text-sm hover:bg-white/[0.04]">
                      Move up
                    </button>
                    <button type="button" onClick={() => moveActiveEntryPoint(1)} className="rounded-full border border-white/16 px-4 py-2 text-sm hover:bg-white/[0.04]">
                      Move down
                    </button>
                  </div>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Eyebrow</span>
                    <input value={activeEntryPoint.eyebrow} onChange={(event) => updateEntryPoint(activeEntryPoint.id, { eyebrow: event.target.value })} className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white" />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Label</span>
                    <input value={activeEntryPoint.label} onChange={(event) => updateEntryPoint(activeEntryPoint.id, { label: event.target.value })} className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white" />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Title</span>
                    <textarea value={activeEntryPoint.title} onChange={(event) => updateEntryPoint(activeEntryPoint.id, { title: event.target.value })} rows={3} className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white" />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Description</span>
                    <textarea value={activeEntryPoint.description} onChange={(event) => updateEntryPoint(activeEntryPoint.id, { description: event.target.value })} rows={4} className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white" />
                  </label>
                  <div className="grid gap-2">
                    <span className="text-sm font-medium text-white">Bullets</span>
                    {activeEntryPoint.bullets.map((bullet, index) => (
                      <textarea
                        key={`${activeEntryPoint.id}-bullet-${index}`}
                        value={bullet}
                        onChange={(event) =>
                          updateEntryPoint(activeEntryPoint.id, {
                            bullets: activeEntryPoint.bullets.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)),
                          })
                        }
                        rows={2}
                        className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedSectionId === "timeline" ? (
                <div className="grid gap-3">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Archive label</span>
                    <input
                      value={document.archiveExitsLabel}
                      onChange={(event) => setDocument((current) => ({ ...current, archiveExitsLabel: event.target.value }))}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Room note label</span>
                    <input
                      value={document.roomNoteLabel}
                      onChange={(event) => setDocument((current) => ({ ...current, roomNoteLabel: event.target.value }))}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Timeline label</span>
                    <input
                      value={document.timelineLabel}
                      onChange={(event) => setDocument((current) => ({ ...current, timelineLabel: event.target.value }))}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Timeline heading</span>
                    <textarea
                      value={document.timelineHeading}
                      onChange={(event) => setDocument((current) => ({ ...current, timelineHeading: event.target.value }))}
                      rows={3}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Timeline intro</span>
                    <textarea
                      value={document.timelineDescription}
                      onChange={(event) =>
                        setDocument((current) => ({ ...current, timelineDescription: event.target.value }))
                      }
                      rows={4}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Room note</span>
                    <textarea
                      value={document.roomNote}
                      onChange={(event) => setDocument((current) => ({ ...current, roomNote: event.target.value }))}
                      rows={4}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <div className="grid gap-2">
                    <span className="text-sm font-medium text-white">Archive links</span>
                    {document.archiveLinks.map((link, index) => (
                      <div key={`${link.href}-${index}`} className="grid gap-2 rounded-[1rem] border border-white/12 bg-black/20 p-3">
                        <input
                          value={link.label}
                          onChange={(event) =>
                            setDocument((current) => ({
                              ...current,
                              archiveLinks: current.archiveLinks.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, label: event.target.value } : item,
                              ),
                            }))
                          }
                          className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                        />
                        <input
                          value={link.href}
                          onChange={(event) =>
                            setDocument((current) => ({
                              ...current,
                              archiveLinks: current.archiveLinks.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, href: event.target.value } : item,
                              ),
                            }))
                          }
                          className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                        />
                      </div>
                    ))}
                  </div>
                  {document.timeline.map((item, index) => (
                    <div key={`${item.year}-${index}`} className="grid gap-2 rounded-[1rem] border border-white/12 bg-black/20 p-3">
                      <input
                        value={item.year}
                        onChange={(event) => updateTimelineItem(index, { year: event.target.value })}
                        className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                      />
                      <input
                        value={item.title}
                        onChange={(event) => updateTimelineItem(index, { title: event.target.value })}
                        className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                      />
                      <textarea
                        value={item.body}
                        onChange={(event) => updateTimelineItem(index, { body: event.target.value })}
                        rows={4}
                        className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                      />
                    </div>
                  ))}
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-white">Raw document JSON</span>
                    <textarea
                      value={rawDocument}
                      onChange={(event) => {
                        setRawDocument(event.target.value);
                        try {
                          setDocument(JSON.parse(event.target.value) as IntelligencePartyDocument);
                        } catch {
                          // Wait for valid JSON before syncing preview.
                        }
                      }}
                      rows={18}
                      className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 font-mono text-xs text-white"
                    />
                  </label>
                </div>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>
    </main>
  );
}
