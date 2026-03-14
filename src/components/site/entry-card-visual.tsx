import { getRecoveredMediaBlock } from "@/lib/media-inference";
import { getRecoverySnapshot } from "@/lib/wordpress-data";
import type { WorkspaceEntry } from "@/lib/server/workspace-store";

function getYoutubeEmbed(url: string) {
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
    return getYoutubeEmbed(url);
  }

  if (url.includes("vimeo.com")) {
    return getVimeoEmbed(url);
  }

  return url;
}

export function EntryCardVisual({ entry }: { entry: WorkspaceEntry }) {
  const snapshot = getRecoverySnapshot();
  const attachments = snapshot.attachments.filter((attachment) => entry.linkedAttachmentIds.includes(attachment.id));
  const media = getRecoveredMediaBlock(entry.editorDocument, attachments);

  if (media?.mediaType === "image" && media.url) {
    return (
      <div className="aspect-[16/10] overflow-hidden bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.url} alt={media.alt || media.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
      </div>
    );
  }

  if (media?.mediaType === "video" && media.url && /\.(mp4|webm|ogg)(\?.*)?$/i.test(media.url)) {
    return (
      <div className="aspect-[16/10] overflow-hidden bg-black">
        <video src={media.url} muted playsInline className="h-full w-full object-cover" />
      </div>
    );
  }

  if (media?.url && (media.mediaType === "embed" || media.mediaType === "video")) {
    return (
      <div className="aspect-[16/10] overflow-hidden bg-black">
        <iframe
          src={getEmbedSource(media.url)}
          title={media.title || entry.title}
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
    <div className="relative aspect-[16/10] overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_35%),linear-gradient(135deg,#131313_0%,#080808_45%,#151515_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(transparent_0,transparent_96%,rgba(255,255,255,0.08)_96%,rgba(255,255,255,0.08)_100%)] bg-[length:100%_20px]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0,transparent_96%,rgba(255,255,255,0.08)_96%,rgba(255,255,255,0.08)_100%)] bg-[length:20px_100%]" />
      <div className="relative z-10 flex h-full flex-col justify-between p-5">
        <p className="text-[0.68rem] uppercase tracking-[0.34em] text-white/25">Placeholder</p>
        <div>
          <p className="text-xl font-semibold tracking-[-0.05em] text-white/88">{media?.title || entry.title}</p>
          <p className="mt-2 text-[0.72rem] uppercase tracking-[0.26em] text-white/30">
            {media?.caption || "No linked media yet"}
          </p>
        </div>
      </div>
    </div>
  );
}
