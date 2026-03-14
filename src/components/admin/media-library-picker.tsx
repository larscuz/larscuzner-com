"use client";

import { useMemo, useState } from "react";
import { searchMediaItems, type MediaLibraryItem } from "@/lib/media-library";

function PickerPreview({ item }: { item: MediaLibraryItem }) {
  if (item.mediaType === "image") {
    return (
      <div className="aspect-[4/3] overflow-hidden bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.previewUrl} alt={item.label} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="flex aspect-[4/3] items-center justify-center bg-[linear-gradient(135deg,#0f0f0f_0%,#060606_100%)] text-[0.72rem] uppercase tracking-[0.28em] text-white/35">
      {item.mediaType}
    </div>
  );
}

export function MediaLibraryPicker({
  items,
  onSelect,
}: {
  items: MediaLibraryItem[];
  onSelect: (item: MediaLibraryItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<MediaLibraryItem["mediaType"] | "all">("all");
  const [open, setOpen] = useState(false);

  const filteredItems = useMemo(() => searchMediaItems(items, query, mediaType, "all").slice(0, 18), [items, mediaType, query]);

  return (
    <div className="rounded-[1.2rem] border border-[color:var(--line)] bg-black/[0.02] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-black/45">Recovered media library</p>
          <p className="mt-1 text-sm text-black/60">Pick from the scanned source folders instead of pasting a URL manually.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm hover:bg-black/[0.03]"
        >
          {open ? "Hide library" : "Browse library"}
        </button>
      </div>

      {open ? (
        <div className="mt-4 grid gap-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search media library..."
              className="rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
            />
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
          </div>

          <div className="grid max-h-[520px] gap-4 overflow-auto pr-1 md:grid-cols-2">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item);
                  setOpen(false);
                }}
                className="overflow-hidden rounded-[1.25rem] border border-[color:var(--line)] bg-white text-left transition hover:bg-black/[0.02]"
              >
                <PickerPreview item={item} />
                <div className="space-y-2 p-4">
                  <div className="flex flex-wrap gap-2 text-[0.68rem] uppercase tracking-[0.22em] text-black/45">
                    <span>{item.mediaType}</span>
                    <span>{item.collection}</span>
                  </div>
                  <p className="text-base font-medium">{item.label || item.filename}</p>
                  <p className="line-clamp-2 break-all font-mono text-xs leading-5 text-black/50">{item.relativePath}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
