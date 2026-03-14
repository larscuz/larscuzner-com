"use client";

import { useMemo, useState } from "react";
import {
  formatFileSize,
  searchMediaItems,
  type MediaCollectionSummary,
  type MediaLibraryItem,
} from "@/lib/media-library";

function PreviewCard({
  title,
  previewUrl,
  mediaType,
}: {
  title: string;
  previewUrl: string;
  mediaType: string;
}) {
  if (mediaType === "image") {
    return (
      <div className="relative aspect-[4/3] overflow-hidden bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt={title} className="h-full w-full object-cover" />
      </div>
    );
  }

  const label = mediaType === "video" ? "Video file" : mediaType === "audio" ? "Audio file" : "Document";

  return (
    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#0f0f0f_0%,#060606_100%)] text-white/35">
      <span className="text-[0.72rem] uppercase tracking-[0.3em]">{label}</span>
    </div>
  );
}

export function UploadsBrowser({
  collections,
  items,
  generatedAt,
}: {
  collections: MediaCollectionSummary[];
  items: MediaLibraryItem[];
  generatedAt: string;
}) {
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<MediaLibraryItem["mediaType"] | "all">("all");
  const [collection, setCollection] = useState("all");

  const filteredItems = useMemo(
    () => searchMediaItems(items, query, mediaType, collection),
    [collection, items, mediaType, query],
  );

  return (
    <section className="rounded-[2rem] border border-[color:var(--line)] bg-white/80 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">All uploads</h2>
          <p className="mt-2 text-sm text-black/60">Search by filename or path, filter by type, and browse the recovered originals.</p>
        </div>
        <p className="text-xs uppercase tracking-[0.22em] text-black/45">Generated {generatedAt}</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_220px]">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Search uploads</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search filename, title, path..."
            className="rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Media type</span>
          <select
            value={mediaType}
            onChange={(event) => setMediaType(event.target.value as MediaLibraryItem["mediaType"] | "all")}
            className="rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
          >
            <option value="all">All types</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="document">Document</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Collection</span>
          <select
            value={collection}
            onChange={(event) => setCollection(event.target.value)}
            className="rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
          >
            <option value="all">All collections</option>
            {collections.map((item) => (
              <option key={item.key} value={item.key}>
                {item.key}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-black/[0.05] px-4 py-2">{filteredItems.length} matching files</span>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filteredItems.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-[1.5rem] border border-[color:var(--line)] bg-white shadow-[0_18px_50px_rgba(31,36,48,0.06)]">
            <PreviewCard title={item.label} previewUrl={item.previewUrl} mediaType={item.mediaType} />
            <div className="space-y-3 p-5">
              <div className="flex flex-wrap gap-2 text-[0.68rem] uppercase tracking-[0.24em] text-black/45">
                <span>{item.mediaType}</span>
                <span>{item.collection}</span>
                {item.variantCount > 0 ? <span>{item.variantCount} variants</span> : null}
              </div>
              <h3 className="text-xl font-semibold tracking-tight">{item.label || item.filename}</h3>
              <p className="break-all font-mono text-xs leading-6 text-black/55">{item.relativePath}</p>
              <div className="flex flex-wrap gap-3 text-sm text-black/62">
                <span>{formatFileSize(item.fileSizeBytes)}</span>
                <span>.{item.fileExtension}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <a href={item.previewUrl} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                  Open source URL
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
