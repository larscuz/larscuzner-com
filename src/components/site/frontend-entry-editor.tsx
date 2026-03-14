"use client";

import { startTransition, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MediaLibraryPicker } from "@/components/admin/media-library-picker";
import { SiteBlockRenderer } from "@/components/cms/site-block-renderer";
import {
  type EditorDocument,
  type EditorMediaBlock,
  type EditorTextBlock,
  createMediaBlock,
  createTextBlock,
} from "@/lib/editor-schema";
import { addRecoveredOrPlaceholderMedia } from "@/lib/media-inference";
import type { MediaLibraryItem } from "@/lib/media-library";
import type { AttachmentRecord } from "@/lib/wordpress-data";
import type { WorkspaceEntry } from "@/lib/server/workspace-store";

function reorderBlock<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;

  if (nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }

  const clone = [...items];
  const [item] = clone.splice(index, 1);
  clone.splice(nextIndex, 0, item);
  return clone;
}

export function FrontendEntryEditor({
  entry,
  attachments,
  mediaLibraryItems,
  canEdit,
  saveAction,
}: {
  entry: WorkspaceEntry;
  attachments: AttachmentRecord[];
  mediaLibraryItems: MediaLibraryItem[];
  canEdit: boolean;
  saveAction: (payload: { id: string; title: string; slug?: string; editorDocument: EditorDocument }) => Promise<{
    ok: boolean;
    sourceId: number;
    slug: string;
    updatedAt: string;
  }>;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(entry.title);
  const [document, setDocument] = useState<EditorDocument>(entry.editorDocument);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(entry.editorDocument.blocks[0]?.id ?? null);
  const [editMode, setEditMode] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const renderDocument = useMemo(
    () => addRecoveredOrPlaceholderMedia(document, attachments, title || entry.title),
    [attachments, document, entry.title, title],
  );
  const selectedIndex = document.blocks.findIndex((block) => block.id === selectedBlockId);
  const selectedBlock = selectedIndex >= 0 ? document.blocks[selectedIndex] : null;

  const updateTextBlock = (blockId: string, patch: Partial<EditorTextBlock>) => {
    setDocument((current) => ({
      ...current,
      blocks: current.blocks.map((block) => (block.id === blockId && block.type === "text" ? { ...block, ...patch } : block)),
    }));
  };

  const updateMediaBlock = (blockId: string, patch: Partial<EditorMediaBlock>) => {
    setDocument((current) => ({
      ...current,
      blocks: current.blocks.map((block) => (block.id === blockId && block.type === "media" ? { ...block, ...patch } : block)),
    }));
  };

  const addText = () => {
    const block = createTextBlock("<p>New front-end text block.</p>");
    setDocument((current) => ({ ...current, blocks: [...current.blocks, block] }));
    setSelectedBlockId(block.id);
  };

  const addMedia = () => {
    const block = createMediaBlock();
    setDocument((current) => ({ ...current, blocks: [...current.blocks, block] }));
    setSelectedBlockId(block.id);
  };

  const removeSelected = () => {
    if (!selectedBlockId) {
      return;
    }

    setDocument((current) => {
      const nextBlocks = current.blocks.filter((block) => block.id !== selectedBlockId);
      setSelectedBlockId(nextBlocks[0]?.id ?? null);
      return { ...current, blocks: nextBlocks };
    });
  };

  const moveSelected = (direction: -1 | 1) => {
    if (selectedIndex < 0) {
      return;
    }

    setDocument((current) => ({
      ...current,
      blocks: reorderBlock(current.blocks, selectedIndex, direction),
    }));
  };

  const selectMediaForBlock = (item: MediaLibraryItem) => {
    if (!selectedBlock || selectedBlock.type !== "media") {
      return;
    }

    const nextMediaType: EditorMediaBlock["mediaType"] =
      item.mediaType === "video" ? "video" : item.mediaType === "image" ? "image" : "embed";

    updateMediaBlock(selectedBlock.id, {
      mediaType: nextMediaType,
      url: item.previewUrl,
      title: item.label || item.filename,
      alt: item.label || item.filename,
      caption: `Selected from ${item.collection}.`,
    });
  };

  const save = () => {
    setSaveState("saving");
    startTransition(async () => {
      try {
        await saveAction({
          id: entry.id,
          title,
          slug: entry.slug,
          editorDocument: document,
        });
        setSaveState("saved");
        router.refresh();
      } catch {
        setSaveState("error");
      }
    });
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-[1600px] px-5 py-6 sm:px-8">
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
                  {editMode ? "Close editor" : "Edit front-end"}
                </button>
                <Link href={`/admin/entry/${entry.sourceId}`} className="transition hover:text-white/70">
                  Backend
                </Link>
              </>
            ) : null}
          </div>
        </div>

        <div className={`grid gap-10 ${editMode && canEdit ? "xl:grid-cols-[minmax(0,1fr)_380px]" : ""}`}>
          <div>
            <section className="grid gap-12 px-0 py-10 md:grid-cols-[minmax(0,1fr)_280px] md:gap-16 md:py-14">
              <div className="space-y-6">
                <p className="text-[0.72rem] uppercase tracking-[0.42em] text-white/30">{entry.kind}</p>
                {editMode && canEdit ? (
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="max-w-5xl border-b border-white/20 bg-transparent text-[clamp(4rem,11vw,10rem)] font-semibold leading-[0.88] tracking-[-0.09em] text-white outline-none"
                  />
                ) : (
                  <h1 className="max-w-5xl text-[clamp(4rem,11vw,10rem)] font-semibold leading-[0.88] tracking-[-0.09em] text-white">
                    {title}
                  </h1>
                )}
              </div>

              <aside className="max-w-sm space-y-5 pt-2">
                <p className="text-sm leading-7 text-white/58">
                  {canEdit
                    ? "When you are logged in, this public page can become the editing surface. Select a block, change it here, and save without leaving the front end."
                    : "Public view of the composer-backed front end."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {entry.termLabels.map((label) => (
                    <span key={label} className="rounded-full border border-white/14 px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] text-white/45">
                      {label}
                    </span>
                  ))}
                </div>
              </aside>
            </section>

            <section className="border-t border-white/10 py-10 md:py-14">
              <SiteBlockRenderer
                document={renderDocument}
                editable={editMode && canEdit}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
              />
            </section>
          </div>

          {editMode && canEdit ? (
            <aside className="self-start xl:sticky xl:top-6">
              <div className="space-y-5 rounded-[2rem] border border-white/12 bg-white/[0.04] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-white/35">Front-end editor</p>
                    <p className="mt-2 text-sm leading-7 text-white/60">Select a block on the page, then edit it here.</p>
                  </div>
                  <button
                    type="button"
                    onClick={save}
                    className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
                  >
                    Save
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={addText} className="rounded-full border border-white/16 px-4 py-2 text-sm hover:bg-white/[0.04]">
                    Add text
                  </button>
                  <button type="button" onClick={addMedia} className="rounded-full border border-white/16 px-4 py-2 text-sm hover:bg-white/[0.04]">
                    Add media
                  </button>
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

                {saveState === "saved" ? <p className="text-sm text-[#9de4b8]">Saved to the CMS workspace.</p> : null}
                {saveState === "saving" ? <p className="text-sm text-white/55">Saving...</p> : null}
                {saveState === "error" ? <p className="text-sm text-[#f2a08b]">Could not save. Try again.</p> : null}

                {selectedBlock?.type === "text" ? (
                  <div className="grid gap-4">
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-white">Width</span>
                      <select
                        value={selectedBlock.width}
                        onChange={(event) => updateTextBlock(selectedBlock.id, { width: event.target.value as EditorTextBlock["width"] })}
                        className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                      >
                        <option value="wide">Wide</option>
                        <option value="narrow">Narrow</option>
                      </select>
                    </label>

                    <div className="grid gap-2">
                      <span className="text-sm font-medium text-white">Text</span>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(event) => updateTextBlock(selectedBlock.id, { html: event.currentTarget.innerHTML })}
                        dangerouslySetInnerHTML={{ __html: selectedBlock.html }}
                        className="cms-richtext min-h-48 rounded-[1.4rem] border border-white/12 bg-black/30 px-5 py-4 text-base leading-8 text-white outline-none"
                      />
                    </div>
                  </div>
                ) : null}

                {selectedBlock?.type === "media" ? (
                  <div className="grid gap-4">
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-white">Media type</span>
                      <select
                        value={selectedBlock.mediaType}
                        onChange={(event) => updateMediaBlock(selectedBlock.id, { mediaType: event.target.value as EditorMediaBlock["mediaType"] })}
                        className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="embed">Embedded website</option>
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-white">URL</span>
                      <input
                        value={selectedBlock.url}
                        onChange={(event) => updateMediaBlock(selectedBlock.id, { url: event.target.value })}
                        className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-white">Title</span>
                      <input
                        value={selectedBlock.title}
                        onChange={(event) => updateMediaBlock(selectedBlock.id, { title: event.target.value })}
                        className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-white">Caption</span>
                      <textarea
                        value={selectedBlock.caption}
                        onChange={(event) => updateMediaBlock(selectedBlock.id, { caption: event.target.value })}
                        rows={4}
                        className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-white">Alt text</span>
                      <input
                        value={selectedBlock.alt}
                        onChange={(event) => updateMediaBlock(selectedBlock.id, { alt: event.target.value })}
                        className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-white">Aspect</span>
                        <select
                          value={selectedBlock.aspect}
                          onChange={(event) => updateMediaBlock(selectedBlock.id, { aspect: event.target.value as EditorMediaBlock["aspect"] })}
                          className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                        >
                          <option value="landscape">Landscape</option>
                          <option value="portrait">Portrait</option>
                          <option value="square">Square</option>
                          <option value="ultrawide">Ultrawide</option>
                        </select>
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-white">Emphasis</span>
                        <select
                          value={selectedBlock.emphasis}
                          onChange={(event) => updateMediaBlock(selectedBlock.id, { emphasis: event.target.value as EditorMediaBlock["emphasis"] })}
                          className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white"
                        >
                          <option value="standard">Standard</option>
                          <option value="feature">Feature</option>
                        </select>
                      </label>
                    </div>

                    <MediaLibraryPicker items={mediaLibraryItems} onSelect={selectMediaForBlock} />
                  </div>
                ) : null}
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </main>
  );
}
