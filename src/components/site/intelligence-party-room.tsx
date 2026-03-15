"use client";

import { useState } from "react";
import Link from "next/link";
import { stripHtml, type EditorTextBlock } from "@/lib/editor-schema";
import type { WorkspaceEntry } from "@/lib/server/workspace-store";

type MediaItem = {
  id: string;
  label: string;
  type: "youtube" | "video";
  url: string;
  caption: string;
  note: string;
  thumbnail: string;
  size: "hero" | "wide" | "tall" | "standard";
};

type EntryPoint = {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
};

const mediaItems: MediaItem[] = [
  {
    id: "main-film",
    label: "Campaign film",
    type: "youtube",
    url: "https://www.youtube.com/embed/LMVOKQ6hIbY",
    caption: "The central project video: campaign rhetoric delivered with enough conviction to unsettle easy dismissal.",
    note: "Entry point: start here for the official pitch voice.",
    thumbnail: "https://img.youtube.com/vi/LMVOKQ6hIbY/maxresdefault.jpg",
    size: "hero",
  },
  {
    id: "oslo-clip",
    label: "Oslo activation",
    type: "video",
    url: "https://pub-b53c56f5af3e471cb8b3610afdc49a36.r2.dev/Intelligenspartiet2027.mp4",
    caption: "A broader public-facing cut that lets the project operate in the register of outreach, agitation, and performance.",
    note: "Entry point: use this if you want the work to read as a live campaign machine.",
    thumbnail: "https://pub-b53c56f5af3e471cb8b3610afdc49a36.r2.dev/intelligenspartiet-still-1.jpg",
    size: "tall",
  },
  {
    id: "street-interview",
    label: "Street interview",
    type: "youtube",
    url: "https://www.youtube.com/embed/jRMVo8HWcwo",
    caption: "The project in contact with passersby, where the satire has to survive public misunderstanding in real time.",
    note: "Entry point: watch how the script changes when it meets actual people.",
    thumbnail: "https://img.youtube.com/vi/jRMVo8HWcwo/maxresdefault.jpg",
    size: "standard",
  },
  {
    id: "broadcast-cut",
    label: "Broadcast cut",
    type: "youtube",
    url: "https://www.youtube.com/embed/ZBEsYI_y4AI",
    caption: "A media-facing version of the work where the campaign aesthetic starts to impersonate institutional seriousness.",
    note: "Entry point: useful for reading the work as a feedback loop with journalism.",
    thumbnail: "https://img.youtube.com/vi/ZBEsYI_y4AI/maxresdefault.jpg",
    size: "wide",
  },
  {
    id: "field-footage",
    label: "Field footage",
    type: "youtube",
    url: "https://www.youtube.com/embed/o2QgghxfQLw",
    caption: "A looser field fragment that reveals the mechanics, repetition, and friction behind the public persona.",
    note: "Entry point: the work becomes more legible once you see the seams.",
    thumbnail: "https://img.youtube.com/vi/o2QgghxfQLw/maxresdefault.jpg",
    size: "standard",
  },
];

const entryPoints: EntryPoint[] = [
  {
    id: "proposal",
    label: "Policy proposal",
    eyebrow: "Entry point 01",
    title: "Read it as a proposal that weaponizes contradiction.",
    description:
      "The project argues for expanded voting rights, but stages that argument through conservative language, cultural protectionism, and strategic discomfort.",
    bullets: [
      "Universal suffrage is framed as a supposedly traditional value.",
      "The rhetoric sounds right-wing while the demand points elsewhere.",
      "The viewer is forced to decide whether the contradiction is cynical, tactical, or generative.",
    ],
  },
  {
    id: "persona",
    label: "Campaign persona",
    eyebrow: "Entry point 02",
    title: "Read it as a performed candidate entering public space.",
    description:
      "The project works because it does not remain an essay. It becomes a body, a costume, a tone of voice, a flyer, a slogan, and a repeated public encounter.",
    bullets: [
      "The candidate persona is polished enough to be mistaken for real politics.",
      "The absurd slogans keep threatening to collapse the whole operation.",
      "That instability is part of the work, not a bug in it.",
    ],
  },
  {
    id: "genealogy",
    label: "Historical genealogy",
    eyebrow: "Entry point 03",
    title: "Read it through Norway’s original Intelligenspartiet.",
    description:
      "The project borrows the historical party name to connect nineteenth-century culture wars to present-day anxieties around nation, belonging, and electoral legitimacy.",
    bullets: [
      "J.S. Welhaven and H. Wergeland become prototypes for a recurring split.",
      "Protectionism and openness are staged as cultural scripts, not settled positions.",
      "The project keeps history active instead of treating it as background decoration.",
    ],
  },
  {
    id: "reception",
    label: "Reception machine",
    eyebrow: "Entry point 04",
    title: "Read it through what critics and media do to it.",
    description:
      "The work becomes clearer when you track its reception: some frames call it necessary, some call it absurd, and many cannot decide whether it is intervention or parody.",
    bullets: [
      "Art writing validates the paradox as a legitimate artistic method.",
      "Public reaction often tries to force the work into propaganda or mockery.",
      "The project room makes that instability visible instead of smoothing it away.",
    ],
  },
];

const timeline = [
  {
    year: "1830s",
    title: "Original Intelligenspartiet",
    body: "The historical party name anchors the work in an earlier cultural-political split around nationalism, influence, and the future of the nation.",
  },
  {
    year: "2018",
    title: "Graz campaign fiction",
    body: "The Intelligence Party appears as a fictional-yet-operational campaign platform, staged with enough realism to circulate beyond art-space irony.",
  },
  {
    year: "2018",
    title: "Critical response",
    body: "Reviews and art writing frame the project as timely because it inserts a left demand into a right rhetorical shell without resolving the contradiction.",
  },
  {
    year: "2019",
    title: "Oslo and Brussels afterlife",
    body: "The work continues as a distributed campaign form, migrating between contexts and gathering new meanings as it travels.",
  },
];

const ambiguityScale = [
  { label: "Satire", value: "Uses mimicry, excess, and wrong-sounding slogans to destabilize political speech." },
  { label: "Tool", value: "Behaves like an actual campaign apparatus with legible outreach and repeated messaging." },
  { label: "Warning", value: "Shows how easily public language can host contradictory commitments without collapsing." },
  { label: "Proposal", value: "Keeps open the possibility that tactical contradiction can still produce political thought." },
];

function getOverviewText(entry: WorkspaceEntry) {
  const text = entry.editorDocument.blocks
    .filter((block): block is EditorTextBlock => block.type === "text")
    .map((block) => stripHtml(block.html))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > 540 ? `${text.slice(0, 537).trimEnd()}...` : text;
}

function getMediaCardClasses(item: MediaItem) {
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

function getMediaAspectClass(item: MediaItem) {
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

export function IntelligencePartyRoom({ entry }: { entry: WorkspaceEntry }) {
  const [activeMediaId, setActiveMediaId] = useState(mediaItems[0].id);
  const [activeEntryPointId, setActiveEntryPointId] = useState(entryPoints[0].id);

  const activeMedia = mediaItems.find((item) => item.id === activeMediaId) ?? mediaItems[0];
  const activeEntryPoint = entryPoints.find((item) => item.id === activeEntryPointId) ?? entryPoints[0];
  const overview = getOverviewText(entry);

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
            <a href={entry.publicUrl} className="transition hover:text-white/70" target="_blank" rel="noreferrer">
              Legacy page
            </a>
          </div>
        </div>

        <section className="relative overflow-hidden border-b border-white/10 py-8 sm:py-10 xl:py-14">
          <div className="absolute inset-x-[-10%] top-[-5rem] h-[22rem] bg-[radial-gradient(circle_at_center,rgba(180,143,69,0.18),transparent_58%)] blur-3xl" />
          <div className="relative grid gap-8 xl:grid-cols-[minmax(320px,0.55fr)_minmax(0,1.45fr)] xl:gap-12">
            <div className="space-y-6">
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.36em] text-white/28">Project room</p>
                <div className="mt-4 flex flex-wrap gap-2 text-[0.62rem] uppercase tracking-[0.28em] text-white/38">
                  <span className="rounded-full border border-[#ebd58c]/25 bg-[#ebd58c]/10 px-3 py-1 text-[#f2dfa5]">Campaign fiction</span>
                  <span className="rounded-full border border-white/10 px-3 py-1">2018-2019</span>
                  <span className="rounded-full border border-white/10 px-3 py-1">Oslo / Graz / Brussels</span>
                </div>
                <h1 className="mt-5 max-w-[9ch] text-[clamp(3.2rem,7vw,5.8rem)] font-semibold leading-[0.9] tracking-[-0.075em] text-white/96">
                  {entry.title}
                </h1>
                <p className="mt-4 max-w-lg text-[1.02rem] leading-8 text-white/60">
                  A project interface for navigating the work as campaign artifact, historical echo, public intervention, and unstable proposition.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">Current reading</p>
                  <p className="mt-3 text-xl font-semibold tracking-[-0.04em]">Satire that keeps leaking into sincerity.</p>
                  <p className="mt-3 text-sm leading-7 text-white/55">
                    The room is designed to keep both readings alive: the work is funny, strategic, dangerous, and pedagogical at the same time.
                  </p>
                </div>
                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">Overview</p>
                  <p className="mt-3 text-sm leading-7 text-white/55">{overview}</p>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-white/10 bg-[#090909] p-5">
                <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">Ambiguity scale</p>
                <div className="mt-5 grid gap-3">
                  {ambiguityScale.map((item, index) => (
                    <div key={item.label} className="grid gap-2 rounded-[1rem] border border-white/8 bg-white/[0.02] p-3">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium tracking-[-0.02em]">{item.label}</p>
                        <p className="text-[0.62rem] uppercase tracking-[0.3em] text-white/30">0{index + 1}</p>
                      </div>
                      <p className="text-sm leading-6 text-white/54">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">Screening room</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{activeMedia.label}</p>
                  </div>
                  <p className="max-w-sm text-sm leading-6 text-white/54">{activeMedia.note}</p>
                </div>

                <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
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

                <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55">{activeMedia.caption}</p>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">Media spread</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Different scales, same campaign machine.</p>
                  </div>
                  <p className="max-w-md text-sm leading-6 text-white/54">
                    Use the blocks as alternate entrances. Each one changes the project’s tone before you even press play.
                  </p>
                </div>

                <div className="mt-5 grid auto-rows-[minmax(180px,1fr)] gap-3 md:grid-cols-3">
                  {mediaItems.map((item) => {
                    const isActive = activeMediaId === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveMediaId(item.id)}
                        className={`group relative overflow-hidden rounded-[1.5rem] border text-left transition ${getMediaCardClasses(item)} ${
                          isActive
                            ? "border-[#ebd58c]/60 bg-[#ebd58c]/10 shadow-[0_0_0_1px_rgba(235,213,140,0.1)]"
                            : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className={`relative w-full overflow-hidden ${getMediaAspectClass(item)}`}>
                          <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.04]"
                            style={{ backgroundImage: `url("${item.thumbnail}")` }}
                          />
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.12),rgba(5,5,5,0.78))]" />
                          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[0.58rem] uppercase tracking-[0.3em] text-white/44">Media</p>
                              {isActive ? (
                                <span className="rounded-full border border-[#ebd58c]/45 bg-[#ebd58c]/15 px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.28em] text-[#f2dfa5]">
                                  Active
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 text-lg font-medium tracking-[-0.04em] text-white">{item.label}</p>
                            <p className="mt-2 max-w-[32ch] text-sm leading-6 text-white/68">{item.note}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(320px,0.72fr)]">
                <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">Entry points</p>
                      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Many ways in, no safe reading out.</p>
                    </div>
                    <p className="max-w-sm text-sm leading-6 text-white/54">Use these as guided doors into the project rather than as definitive interpretations.</p>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {entryPoints.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveEntryPointId(item.id)}
                        className={`rounded-[1.3rem] border p-4 text-left transition ${
                          activeEntryPointId === item.id
                            ? "border-[#ebd58c]/60 bg-[#ebd58c]/10"
                            : "border-white/10 bg-black/20 hover:bg-white/[0.04]"
                        }`}
                      >
                        <p className="text-[0.58rem] uppercase tracking-[0.3em] text-white/34">{item.eyebrow}</p>
                        <p className="mt-2 text-base font-medium tracking-[-0.03em]">{item.label}</p>
                        <p className="mt-2 text-sm leading-6 text-white/52">{item.description}</p>
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-[#070707] p-5">
                    <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">{activeEntryPoint.eyebrow}</p>
                    <h2 className="mt-3 text-[clamp(1.6rem,3vw,2.4rem)] font-semibold tracking-[-0.05em]">{activeEntryPoint.title}</h2>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58">{activeEntryPoint.description}</p>
                    <div className="mt-5 grid gap-3">
                      {activeEntryPoint.bullets.map((bullet) => (
                        <div key={bullet} className="rounded-[1rem] border border-white/8 bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/58">
                          {bullet}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                  <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/34">Timeline</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">A project that behaves like a lineage and a campaign.</p>
                  <div className="mt-5 grid gap-3">
                    {timeline.map((item) => (
                      <div key={`${item.year}-${item.title}`} className="grid grid-cols-[76px_1fr] gap-4 rounded-[1.2rem] border border-white/8 bg-black/20 p-4">
                        <p className="text-sm font-medium text-[#ebd58c]">{item.year}</p>
                        <div>
                          <p className="text-base font-medium tracking-[-0.03em]">{item.title}</p>
                          <p className="mt-2 text-sm leading-6 text-white/55">{item.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-[1.3rem] border border-white/8 bg-[#090909] p-4">
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
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
