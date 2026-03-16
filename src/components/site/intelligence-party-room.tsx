"use client";

import { useState } from "react";
import Link from "next/link";
import { stripHtml, type EditorTextBlock } from "@/lib/editor-schema";
import type { IntelligencePartyDocument, ProjectRoomMediaItem } from "@/lib/project-room-schema";
import type { WorkspaceEntry } from "@/lib/server/workspace-store";

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

export function IntelligencePartyRoom({
  entry,
  document,
  canEdit = false,
}: {
  entry: WorkspaceEntry;
  document: IntelligencePartyDocument;
  canEdit?: boolean;
}) {
  const [activeMediaId, setActiveMediaId] = useState(document.mediaItems[0]?.id ?? "");
  const [activeEntryPointId, setActiveEntryPointId] = useState(document.entryPoints[0]?.id ?? "");

  const activeMedia = document.mediaItems.find((item) => item.id === activeMediaId) ?? document.mediaItems[0];
  const activeEntryPoint = document.entryPoints.find((item) => item.id === activeEntryPointId) ?? document.entryPoints[0];
  const overview = getOverviewText(entry);

  if (!activeMedia || !activeEntryPoint) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-[1650px] px-5 py-6 sm:px-8">
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
                <Link href="/admin/project-room/intelligence-party" className="transition hover:text-white/70">
                  Edit project room
                </Link>
                <Link href="/admin" className="transition hover:text-white/70">
                  Backend
                </Link>
              </>
            ) : null}
            <a href={entry.publicUrl} className="transition hover:text-white/70" target="_blank" rel="noreferrer">
              Legacy page
            </a>
          </div>
        </div>

        <section className="relative overflow-hidden border-b border-white/10 py-8 sm:py-10 xl:py-14">
          <div className="absolute inset-x-[-10%] top-[-5rem] h-[22rem] bg-[radial-gradient(circle_at_center,rgba(180,143,69,0.18),transparent_58%)] blur-3xl" />
          <div className="relative space-y-10">
            <div className="space-y-6 border-b border-white/10 pb-8">
              <p className="text-[0.72rem] uppercase tracking-[0.36em] text-white/26">{document.introKicker}</p>
              <div className="flex flex-wrap gap-2 text-[0.6rem] uppercase tracking-[0.28em] text-white/40">
                <span className="rounded-full border border-[#ebd58c]/30 bg-[#ebd58c]/10 px-3 py-1 text-[#f2dfa5]">Campaign fiction</span>
                <span className="rounded-full border border-white/10 px-3 py-1">2018-2019</span>
                <span className="rounded-full border border-white/10 px-3 py-1">Oslo / Graz / Brussels</span>
              </div>
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] xl:items-end">
                <div>
                  <h1 className="max-w-[10ch] text-[clamp(3.2rem,8vw,6.6rem)] font-semibold leading-[0.9] tracking-[-0.085em] text-white">
                    {entry.title}
                  </h1>
                </div>
                <p className="max-w-xl text-[1rem] leading-8 text-white/60 xl:justify-self-end">{document.introTagline}</p>
              </div>
              {canEdit ? (
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/admin/project-room/intelligence-party"
                    className="rounded-full border border-[#ebd58c]/35 bg-[#ebd58c]/10 px-4 py-2 text-[0.65rem] uppercase tracking-[0.32em] text-[#f2dfa5] transition hover:border-[#ebd58c]/55 hover:bg-[#ebd58c]/16"
                  >
                    Edit project room
                  </Link>
                  <p className="self-center text-sm leading-6 text-white/45">
                    This slug stays the canonical project room. Edit the room content directly here instead of opening the underlying post.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="grid gap-8 xl:grid-cols-[minmax(300px,0.48fr)_minmax(0,1.52fr)] xl:gap-10">
              <div className="space-y-8">
                <div className="border-l border-[#ebd58c]/30 pl-5">
                  <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">Current reading</p>
                  <p className="mt-3 text-[1.55rem] font-semibold leading-tight tracking-[-0.05em] text-white">
                    {document.currentReadingTitle}
                  </p>
                  <p className="mt-4 max-w-sm text-sm leading-7 text-white/55">{document.currentReadingBody}</p>
                </div>

                <div className="space-y-4 border-t border-white/10 pt-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">Ambiguity scale</p>
                    <p className="text-[0.58rem] uppercase tracking-[0.28em] text-white/24">Unresolved on purpose</p>
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

                <div className="border-t border-white/10 pt-5">
                  <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">Overview</p>
                  <p className="mt-4 max-w-md text-sm leading-7 text-white/55">{overview}</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">Main screening</p>
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
                      Active clip
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
            </div>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] xl:gap-10">
              <div className="space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">Media sequence</p>
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
                              <p className="text-[0.58rem] uppercase tracking-[0.3em] text-white/42">Media</p>
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

              <div className="space-y-8">
                <div>
                  <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">Entry points</p>
                  <h2 className="mt-3 max-w-[12ch] text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[0.95] tracking-[-0.06em] text-white">
                    Many ways in, no safe reading out.
                  </h2>
                  <p className="mt-4 max-w-md text-sm leading-7 text-white/55">
                    Use these as guided doors into the project rather than final interpretations. Each one changes the political temperature of the same material.
                  </p>
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
            </div>

            <div className="grid gap-8 border-t border-white/10 pt-8 xl:grid-cols-[minmax(280px,0.42fr)_minmax(0,1.58fr)] xl:gap-10">
              <div className="space-y-6">
                <div>
                  <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">Archive exits</p>
                  <div className="mt-4 grid gap-3 text-sm leading-6 text-white/58">
                    <a href="http://www.artmagazine.cc/content104549.html" target="_blank" rel="noreferrer" className="transition hover:text-white">
                      artmagazine review
                    </a>
                    <a href="https://subjekt.no/2018/09/18/hvit-mann-proklamerer-i-understand-white-people-i-mangfoldig-strok-kunst-eller-propaganda/" target="_blank" rel="noreferrer" className="transition hover:text-white">
                      Subjekt article
                    </a>
                    <a href="https://www.hatjecantz.de/volksfronten-popular-fronts-7542-1.html" target="_blank" rel="noreferrer" className="transition hover:text-white">
                      The Great Replacement book reference
                    </a>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">Room note</p>
                  <p className="mt-4 max-w-sm text-sm leading-7 text-white/55">
                    This page should behave more like a reading environment than a catalog card: one work, several thresholds, no clean handoff between parody and proposition.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">Timeline</p>
                <p className="mt-2 max-w-xl text-[2rem] font-semibold leading-tight tracking-[-0.05em] text-white">
                  A project that behaves like a lineage and a campaign.
                </p>
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
          </div>
        </section>
      </div>
    </main>
  );
}
