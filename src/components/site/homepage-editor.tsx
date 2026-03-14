"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EntryCardVisual } from "@/components/site/entry-card-visual";
import {
  createHomeSection,
  type HomeEntryPointsSection,
  type HomePageDocument,
  type HomeSection,
} from "@/lib/site-page-schema";
import type { WorkspaceEntry } from "@/lib/server/workspace-store";

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
  section,
  selected,
  editable,
  onSelect,
  children,
}: {
  section: HomeSection;
  selected: boolean;
  editable: boolean;
  onSelect: (id: string) => void;
  children: React.ReactNode;
}) {
  if (!editable) {
    return <>{children}</>;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(section.id)}
      className={`block w-full rounded-[2rem] border border-dashed p-3 text-left transition ${
        selected ? "border-white/55 bg-white/[0.04]" : "border-white/12 hover:border-white/28 hover:bg-white/[0.02]"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3 text-[0.68rem] uppercase tracking-[0.28em] text-white/35">
        <span>{section.type}</span>
        <span>{section.id}</span>
      </div>
      {children}
    </button>
  );
}

export function HomepageEditor({
  document: initialDocument,
  featuredPages,
  featuredPosts,
  pages,
  posts,
  canEdit,
  saveAction,
}: {
  document: HomePageDocument;
  featuredPages: WorkspaceEntry[];
  featuredPosts: WorkspaceEntry[];
  pages: WorkspaceEntry[];
  posts: WorkspaceEntry[];
  canEdit: boolean;
  saveAction: (payload: { homepage: HomePageDocument }) => Promise<{ ok: boolean }>;
}) {
  const router = useRouter();
  const [document, setDocument] = useState(initialDocument);
  const [editMode, setEditMode] = useState(false);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(initialDocument.sections[0]?.id ?? null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const hero = featuredPosts[0] ?? posts[0] ?? null;
  const selectedIndex = document.sections.findIndex((section) => section.id === selectedSectionId);
  const selectedSection = selectedIndex >= 0 ? document.sections[selectedIndex] : null;
  const visibleSections = document.sections.filter((section) => section.enabled);
  const viewportClass =
    viewport === "mobile"
      ? "max-w-[420px]"
      : viewport === "tablet"
        ? "max-w-[900px]"
        : "max-w-[1500px]";

  const updateSection = (sectionId: string, patch: Partial<HomeSection>) => {
    setDocument((current) => ({
      ...current,
      sections: current.sections.map((section) => (section.id === sectionId ? ({ ...section, ...patch } as HomeSection) : section)),
    }));
  };

  const updateEntryPoint = (sectionId: string, itemId: string, patch: Partial<HomeEntryPointsSection["items"][number]>) => {
    setDocument((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== sectionId || section.type !== "entryPoints") {
          return section;
        }

        return {
          ...section,
          items: section.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
        };
      }),
    }));
  };

  const addSection = (type: HomeSection["type"]) => {
    const next = createHomeSection(type);
    setDocument((current) => ({
      ...current,
      sections: [...current.sections, next],
    }));
    setSelectedSectionId(next.id);
  };

  const removeSelected = () => {
    if (!selectedSectionId) {
      return;
    }

    setDocument((current) => {
      const nextSections = current.sections.filter((section) => section.id !== selectedSectionId);
      setSelectedSectionId(nextSections[0]?.id ?? null);
      return {
        ...current,
        sections: nextSections,
      };
    });
  };

  const moveSelected = (direction: -1 | 1) => {
    if (selectedIndex < 0) {
      return;
    }

    setDocument((current) => ({
      ...current,
      sections: reorder(current.sections, selectedIndex, direction),
    }));
  };

  const save = () => {
    setSaveState("saving");
    startTransition(async () => {
      try {
        await saveAction({ homepage: document });
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
              {canEdit ? (
                <>
                  <button type="button" onClick={() => setEditMode((current) => !current)} className="transition hover:text-white/70">
                    {editMode ? "Close editor" : "Edit homepage"}
                  </button>
                  <Link href="/admin" className="transition hover:text-white/70">
                    Backend
                  </Link>
                </>
              ) : (
                <Link href="/admin" className="transition hover:text-white/70">
                  Backend
                </Link>
              )}
            </div>
          </div>
        </header>
      </div>

      <div className={`mx-auto grid gap-10 px-5 pb-10 sm:px-8 ${editMode && canEdit ? "max-w-[1900px] xl:grid-cols-[minmax(0,1fr)_400px]" : viewportClass}`}>
        <div className={editMode && canEdit ? viewportClass : ""}>
          {visibleSections.map((section) => {
            if (section.type === "hero") {
              return (
                <SectionFrame
                  key={section.id}
                  section={section}
                  editable={editMode && canEdit}
                  selected={selectedSectionId === section.id}
                  onSelect={setSelectedSectionId}
                >
                  <section className="grid gap-10 py-10 md:grid-cols-[minmax(0,1.15fr)_minmax(240px,0.55fr)] md:gap-16 md:py-16">
                    <div>
                      <p className="text-[0.74rem] uppercase tracking-[0.42em] text-white/26">{section.eyebrow}</p>
                      <h1 className="mt-5 max-w-6xl text-[clamp(4.4rem,13vw,11rem)] font-semibold leading-[0.84] tracking-[-0.1em] text-white">
                        {section.title}
                      </h1>
                    </div>
                    <div className="space-y-5 pt-2">
                      <p className="text-sm leading-7 text-white/58">{section.description}</p>
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
                </SectionFrame>
              );
            }

            if (section.type === "featuredWork") {
              return (
                <SectionFrame
                  key={section.id}
                  section={section}
                  editable={editMode && canEdit}
                  selected={selectedSectionId === section.id}
                  onSelect={setSelectedSectionId}
                >
                  <section className="grid gap-px border-y border-white/10 py-0 md:grid-cols-[1.2fr_0.8fr]">
                    <div className="border-b border-white/10 px-0 py-8 md:border-b-0 md:border-r md:border-white/10 md:px-0 md:py-10">
                      <p className="text-[0.72rem] uppercase tracking-[0.34em] text-white/28">{section.eyebrow}</p>
                      {hero ? (
                        <Link href={`/works/${encodeURIComponent(hero.slug)}`} className="group block pt-6">
                          <div className="mb-8 overflow-hidden border border-white/10">
                            <EntryCardVisual entry={hero} />
                          </div>
                          <h2 className="max-w-4xl text-[clamp(2.8rem,7vw,6.5rem)] font-semibold leading-[0.9] tracking-[-0.08em] text-white transition group-hover:text-white/82">
                            {hero.title}
                          </h2>
                          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/55">{hero.excerpt || section.emptyText}</p>
                          <p className="mt-8 text-xs uppercase tracking-[0.28em] text-white/35">{section.ctaLabel}</p>
                        </Link>
                      ) : (
                        <p className="pt-6 text-sm text-white/55">{section.emptyText}</p>
                      )}
                    </div>

                    <div className="px-0 py-8 md:px-0 md:py-10">
                      <div className="space-y-5">
                        <p className="text-[0.72rem] uppercase tracking-[0.34em] text-white/28">{section.title}</p>
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
                </SectionFrame>
              );
            }

            if (section.type === "entryPoints") {
              return (
                <SectionFrame
                  key={section.id}
                  section={section}
                  editable={editMode && canEdit}
                  selected={selectedSectionId === section.id}
                  onSelect={setSelectedSectionId}
                >
                  <section className="border-t border-white/10 py-10 md:py-16">
                    <p className="text-[0.72rem] uppercase tracking-[0.34em] text-white/28">{section.eyebrow}</p>
                    <div className="mt-6 grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
                      {section.items.map((item) => (
                        <Link key={item.id} href={item.href} className="bg-[#050505] px-5 py-5 transition hover:bg-white/[0.03]">
                          <p className="text-2xl font-semibold tracking-[-0.05em]">{item.title}</p>
                          <p className="mt-2 text-sm leading-7 text-white/52">{item.description}</p>
                        </Link>
                      ))}
                    </div>
                  </section>
                </SectionFrame>
              );
            }

            if (section.type === "pagesSpotlight") {
              return (
                <SectionFrame
                  key={section.id}
                  section={section}
                  editable={editMode && canEdit}
                  selected={selectedSectionId === section.id}
                  onSelect={setSelectedSectionId}
                >
                  <section className="grid gap-10 py-10 md:grid-cols-[0.9fr_1.1fr] md:py-16">
                    <div className="space-y-5">
                      <p className="text-[0.72rem] uppercase tracking-[0.34em] text-white/28">{section.eyebrow}</p>
                      <h2 className="max-w-xl text-[clamp(2.4rem,5vw,4.4rem)] font-semibold leading-[0.92] tracking-[-0.07em]">
                        {section.title}
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
                </SectionFrame>
              );
            }

            return (
              <SectionFrame
                key={section.id}
                section={section}
                editable={editMode && canEdit}
                selected={selectedSectionId === section.id}
                onSelect={setSelectedSectionId}
              >
                <section className="border-t border-white/10 py-10 md:py-16">
                  <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-[0.72rem] uppercase tracking-[0.34em] text-white/28">{section.eyebrow}</p>
                      <h2 className="mt-3 text-[clamp(2.4rem,5vw,4.4rem)] font-semibold leading-[0.92] tracking-[-0.07em]">
                        {section.title}
                      </h2>
                    </div>
                    <Link href="/works" className="text-xs uppercase tracking-[0.28em] text-white/38 transition hover:text-white/70">
                      {section.ctaLabel}
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
              </SectionFrame>
            );
          })}
        </div>

        {editMode && canEdit ? (
          <aside className="self-start xl:sticky xl:top-6">
            <div className="space-y-5 rounded-[2rem] border border-white/12 bg-white/[0.04] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/35">Homepage builder</p>
                  <p className="mt-2 text-sm leading-7 text-white/60">Select a section to edit its content and layout order.</p>
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

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => addSection("hero")} className="rounded-full border border-white/16 px-4 py-2 text-sm hover:bg-white/[0.04]">
                  Add hero
                </button>
                <button type="button" onClick={() => addSection("featuredWork")} className="rounded-full border border-white/16 px-4 py-2 text-sm hover:bg-white/[0.04]">
                  Add featured
                </button>
                <button type="button" onClick={() => addSection("entryPoints")} className="rounded-full border border-white/16 px-4 py-2 text-sm hover:bg-white/[0.04]">
                  Add links
                </button>
                <button type="button" onClick={() => addSection("pagesSpotlight")} className="rounded-full border border-white/16 px-4 py-2 text-sm hover:bg-white/[0.04]">
                  Add pages
                </button>
                <button type="button" onClick={() => addSection("recentWorks")} className="rounded-full border border-white/16 px-4 py-2 text-sm hover:bg-white/[0.04]">
                  Add works
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => moveSelected(-1)} className="rounded-full border border-white/16 px-4 py-2 text-sm hover:bg-white/[0.04]">
                  Move up
                </button>
                <button type="button" onClick={() => moveSelected(1)} className="rounded-full border border-white/16 px-4 py-2 text-sm hover:bg-white/[0.04]">
                  Move down
                </button>
                <button type="button" onClick={removeSelected} className="rounded-full border border-white/16 px-4 py-2 text-sm text-[#f2a08b] hover:bg-white/[0.04]">
                  Remove
                </button>
              </div>

              {saveState === "saved" ? <p className="text-sm text-[#9de4b8]">Homepage saved.</p> : null}
              {saveState === "saving" ? <p className="text-sm text-white/55">Saving...</p> : null}
              {saveState === "error" ? <p className="text-sm text-[#f2a08b]">Could not save. Try again.</p> : null}

              {selectedSection ? (
                <div className="grid gap-4">
                  <label className="flex items-center gap-3 text-sm text-white">
                    <input
                      type="checkbox"
                      checked={selectedSection.enabled}
                      onChange={(event) => updateSection(selectedSection.id, { enabled: event.target.checked })}
                    />
                    Section enabled
                  </label>

                  {"eyebrow" in selectedSection ? (
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-white">Eyebrow</span>
                      <input
                        value={selectedSection.eyebrow}
                        onChange={(event) => updateSection(selectedSection.id, { eyebrow: event.target.value })}
                        className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                      />
                    </label>
                  ) : null}

                  {"title" in selectedSection ? (
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-white">Title</span>
                      <textarea
                        value={selectedSection.title}
                        onChange={(event) => updateSection(selectedSection.id, { title: event.target.value })}
                        rows={selectedSection.type === "hero" ? 4 : 2}
                        className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                      />
                    </label>
                  ) : null}

                  {selectedSection.type === "hero" ? (
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-white">Description</span>
                      <textarea
                        value={selectedSection.description}
                        onChange={(event) => updateSection(selectedSection.id, { description: event.target.value })}
                        rows={5}
                        className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                      />
                    </label>
                  ) : null}

                  {selectedSection.type === "featuredWork" ? (
                    <>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-white">Empty text</span>
                        <textarea
                          value={selectedSection.emptyText}
                          onChange={(event) => updateSection(selectedSection.id, { emptyText: event.target.value })}
                          rows={3}
                          className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-white">CTA label</span>
                        <input
                          value={selectedSection.ctaLabel}
                          onChange={(event) => updateSection(selectedSection.id, { ctaLabel: event.target.value })}
                          className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                        />
                      </label>
                    </>
                  ) : null}

                  {selectedSection.type === "recentWorks" ? (
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-white">CTA label</span>
                      <input
                        value={selectedSection.ctaLabel}
                        onChange={(event) => updateSection(selectedSection.id, { ctaLabel: event.target.value })}
                        className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                      />
                    </label>
                  ) : null}

                  {selectedSection.type === "entryPoints" ? (
                    <div className="grid gap-3">
                      {selectedSection.items.map((item) => (
                        <div key={item.id} className="grid gap-2 rounded-[1rem] border border-white/12 bg-black/20 p-3">
                          <input
                            value={item.title}
                            onChange={(event) => updateEntryPoint(selectedSection.id, item.id, { title: event.target.value })}
                            className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                          />
                          <textarea
                            value={item.description}
                            onChange={(event) =>
                              updateEntryPoint(selectedSection.id, item.id, { description: event.target.value })
                            }
                            rows={3}
                            className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                          />
                          <input
                            value={item.href}
                            onChange={(event) => updateEntryPoint(selectedSection.id, item.id, { href: event.target.value })}
                            className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-white/55">Select a section to edit it.</p>
              )}
            </div>
          </aside>
        ) : null}
      </div>
    </main>
  );
}
