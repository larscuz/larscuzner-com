"use client";

import { useMemo, useState } from "react";
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
import { SiteBlockRenderer } from "@/components/cms/site-block-renderer";
import { MediaLibraryPicker } from "@/components/admin/media-library-picker";

type WorkspaceStatus = "published" | "draft" | "review";

type WorkspaceEntryShape = {
  id: string;
  sourceId: number;
  kind: "page" | "post";
  title: string;
  slug: string;
  originalStatus: string;
  workflowStatus: WorkspaceStatus;
  excerpt: string;
  body: string;
  publicUrl: string;
  termLabels: string[];
  linkedAttachmentIds: number[];
  notes: string;
  updatedAt: string;
  editorDocument: EditorDocument;
};

type ComposerProps = {
  entry: WorkspaceEntryShape;
  attachments: AttachmentRecord[];
  mediaLibraryItems: MediaLibraryItem[];
  saveAction: (formData: FormData) => void | Promise<void>;
};

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

export function EntryComposer({ entry, attachments, mediaLibraryItems, saveAction }: ComposerProps) {
  const [title, setTitle] = useState(entry.title);
  const [slug, setSlug] = useState(entry.slug);
  const [workflowStatus, setWorkflowStatus] = useState(entry.workflowStatus);
  const [notes, setNotes] = useState(entry.notes);
  const [document, setDocument] = useState<EditorDocument>(entry.editorDocument);

  const attachmentSuggestions = useMemo(
    () =>
      attachments.map((attachment) => ({
        label: `${attachment.title} (${attachment.mimeType || "file"})`,
        value: attachment.url,
      })),
    [attachments],
  );
  const previewDocument = useMemo(() => addRecoveredOrPlaceholderMedia(document, attachments, title || entry.title), [attachments, document, entry.title, title]);

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

  const selectMediaForBlock = (blockId: string, item: MediaLibraryItem) => {
    const nextMediaType: EditorMediaBlock["mediaType"] =
      item.mediaType === "video" ? "video" : item.mediaType === "image" ? "image" : "embed";

    updateMediaBlock(blockId, {
      mediaType: nextMediaType,
      url: item.previewUrl,
      title: item.label || item.filename,
      alt: item.label || item.filename,
      caption: `Selected from ${item.collection}.`,
    });
  };

  const removeBlock = (blockId: string) => {
    setDocument((current) => ({
      ...current,
      blocks: current.blocks.filter((block) => block.id !== blockId),
    }));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    setDocument((current) => ({
      ...current,
      blocks: reorderBlock(current.blocks, index, direction),
    }));
  };

  return (
    <form action={saveAction} className="grid gap-6">
      <input type="hidden" name="id" value={entry.id} />
      <input type="hidden" name="editorDocument" value={JSON.stringify(document)} />

      <section className="rounded-[2rem] border border-[color:var(--line)] bg-white/80 p-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid gap-5">
            <div className="grid gap-2">
              <span className="text-sm font-medium">Title</span>
              <input
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end">
              <label className="grid gap-2">
                <span className="text-sm font-medium">Slug</span>
                <input
                  name="slug"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  className="rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 font-mono text-sm"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Workflow status</span>
                <select
                  name="workflowStatus"
                  value={workflowStatus}
                  onChange={(event) => setWorkflowStatus(event.target.value as WorkspaceStatus)}
                  className="rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="review">In review</option>
                </select>
              </label>
            </div>

            <div className="grid gap-3 rounded-[1.6rem] border border-dashed border-[color:var(--line)] bg-black/[0.02] p-4">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setDocument((current) => ({
                      ...current,
                      blocks: [...current.blocks, createTextBlock("<p>New text block.</p>")],
                    }))
                  }
                  className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm hover:bg-black/[0.03]"
                >
                  Add text block
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDocument((current) => ({
                      ...current,
                      blocks: [...current.blocks, createMediaBlock()],
                    }))
                  }
                  className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm hover:bg-black/[0.03]"
                >
                  Add media box
                </button>
              </div>
              <p className="text-xs leading-6 text-black/55">
                Media boxes support images, direct video files, YouTube/Vimeo links, and embeddable websites. Some
                websites block iframes, so an embed may still need an external link fallback.
              </p>
            </div>

            <div className="grid gap-4">
              {document.blocks.map((block, index) => (
                <article key={block.id} className="rounded-[1.8rem] border border-[color:var(--line)] bg-[color:var(--panel)] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-black/45">
                        {block.type === "text" ? "Text block" : "Media box"}
                      </p>
                      <p className="mt-1 font-mono text-xs text-black/45">{block.id}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <button type="button" onClick={() => moveBlock(index, -1)} className="rounded-full border border-[color:var(--line)] px-3 py-1.5 hover:bg-black/[0.03]">
                        Up
                      </button>
                      <button type="button" onClick={() => moveBlock(index, 1)} className="rounded-full border border-[color:var(--line)] px-3 py-1.5 hover:bg-black/[0.03]">
                        Down
                      </button>
                      <button type="button" onClick={() => removeBlock(block.id)} className="rounded-full border border-[color:var(--line)] px-3 py-1.5 text-[color:var(--signal)] hover:bg-black/[0.03]">
                        Remove
                      </button>
                    </div>
                  </div>

                  {block.type === "text" ? (
                    <div className="mt-4 grid gap-4">
                      <label className="grid gap-2">
                        <span className="text-sm font-medium">Width</span>
                        <select
                          value={block.width}
                          onChange={(event) => updateTextBlock(block.id, { width: event.target.value as EditorTextBlock["width"] })}
                          className="max-w-[220px] rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
                        >
                          <option value="wide">Wide</option>
                          <option value="narrow">Narrow</option>
                        </select>
                      </label>
                      <div className="grid gap-2">
                        <span className="text-sm font-medium">Rich text</span>
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onInput={(event) => updateTextBlock(block.id, { html: event.currentTarget.innerHTML })}
                          dangerouslySetInnerHTML={{ __html: block.html }}
                          className="cms-richtext min-h-48 rounded-[1.4rem] border border-[color:var(--line)] bg-white px-5 py-4 text-base leading-8 outline-none focus:border-black/30"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div className="grid gap-4">
                        <label className="grid gap-2">
                          <span className="text-sm font-medium">Media type</span>
                          <select
                            value={block.mediaType}
                            onChange={(event) => updateMediaBlock(block.id, { mediaType: event.target.value as EditorMediaBlock["mediaType"] })}
                            className="rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
                          >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                            <option value="embed">Embedded website</option>
                          </select>
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-medium">URL</span>
                          <input
                            list="attachment-suggestions"
                            value={block.url}
                            onChange={(event) => updateMediaBlock(block.id, { url: event.target.value })}
                            placeholder="https://..."
                            className="rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-medium">Title</span>
                          <input
                            value={block.title}
                            onChange={(event) => updateMediaBlock(block.id, { title: event.target.value })}
                            className="rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-medium">Caption</span>
                          <textarea
                            value={block.caption}
                            onChange={(event) => updateMediaBlock(block.id, { caption: event.target.value })}
                            rows={4}
                            className="rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4">
                        <label className="grid gap-2">
                          <span className="text-sm font-medium">Alt text</span>
                          <input
                            value={block.alt}
                            onChange={(event) => updateMediaBlock(block.id, { alt: event.target.value })}
                            className="rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
                          />
                        </label>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="grid gap-2">
                            <span className="text-sm font-medium">Aspect</span>
                            <select
                              value={block.aspect}
                              onChange={(event) => updateMediaBlock(block.id, { aspect: event.target.value as EditorMediaBlock["aspect"] })}
                              className="rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
                            >
                              <option value="landscape">Landscape</option>
                              <option value="portrait">Portrait</option>
                              <option value="square">Square</option>
                              <option value="ultrawide">Ultrawide</option>
                            </select>
                          </label>

                          <label className="grid gap-2">
                            <span className="text-sm font-medium">Emphasis</span>
                            <select
                              value={block.emphasis}
                              onChange={(event) => updateMediaBlock(block.id, { emphasis: event.target.value as EditorMediaBlock["emphasis"] })}
                              className="rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
                            >
                              <option value="standard">Standard</option>
                              <option value="feature">Feature</option>
                            </select>
                          </label>
                        </div>

                        <div className="rounded-[1.2rem] border border-[color:var(--line)] bg-black/[0.02] p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-black/45">Embed note</p>
                          <p className="mt-2 text-sm leading-7 text-black/60">
                            Use direct image URLs, MP4/WebM files, YouTube/Vimeo links, or embeddable web pages. Some
                            sites send anti-embed headers, so they may show only the external link.
                          </p>
                        </div>

                        <MediaLibraryPicker items={mediaLibraryItems} onSelect={(item) => selectMediaForBlock(block.id, item)} />
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>

          <aside className="grid gap-5 self-start xl:sticky xl:top-6">
            <label className="grid gap-2 rounded-[1.6rem] border border-[color:var(--line)] bg-white/70 p-4">
              <span className="text-sm font-medium">Editorial notes</span>
              <textarea
                name="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={8}
                className="rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
              />
            </label>

            <div className="rounded-[1.6rem] border border-[color:var(--line)] bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-black/45">Recovered attachments</p>
              <div className="mt-3 max-h-80 space-y-2 overflow-auto pr-1 text-sm">
                {attachments.length > 0 ? (
                  attachments.map((attachment) => (
                    <div key={attachment.id} className="rounded-xl border border-[color:var(--line)] bg-white px-3 py-2">
                      <p className="font-medium">{attachment.title}</p>
                      <p className="mt-1 break-all text-xs text-black/50">{attachment.url}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-black/55">No linked attachments inferred for this entry.</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-[color:var(--background)] transition hover:opacity-90"
            >
              Save composition
            </button>
          </aside>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/12 bg-[#050505]">
        <div className="border-b border-white/10 px-6 py-4">
          <p className="text-xs uppercase tracking-[0.32em] text-white/35">Live preview</p>
        </div>
        <div className="px-6 py-8 md:px-10 md:py-12">
          <div className="mx-auto max-w-6xl">
            <header className="mb-10 space-y-4 border-b border-white/10 pb-8">
              <p className="text-[0.72rem] uppercase tracking-[0.42em] text-white/32">{entry.kind}</p>
              <h2 className="max-w-5xl text-[clamp(3rem,9vw,7rem)] font-semibold leading-[0.92] tracking-[-0.08em] text-white">
                {title || "Untitled"}
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-white/55">
                Composer preview for larscuzner.com. This layout direction borrows from the terminal-style editorial
                pacing of the reference while staying editable in your own CMS.
              </p>
            </header>
            <SiteBlockRenderer document={previewDocument} />
          </div>
        </div>
      </section>

      <datalist id="attachment-suggestions">
        {attachmentSuggestions.map((suggestion) => (
          <option key={`${suggestion.value}-${suggestion.label}`} value={suggestion.value}>
            {suggestion.label}
          </option>
        ))}
      </datalist>
    </form>
  );
}
