import type { EditorDocument, EditorMediaBlock, EditorTextBlock } from "@/lib/editor-schema";

function getAspectClass(aspect: EditorMediaBlock["aspect"]) {
  switch (aspect) {
    case "portrait":
      return "aspect-[4/5]";
    case "square":
      return "aspect-square";
    case "ultrawide":
      return "aspect-[21/9]";
    default:
      return "aspect-[16/10]";
  }
}

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

function getEmbedSource(block: EditorMediaBlock) {
  if (block.mediaType === "embed") {
    return block.url;
  }

  if (block.mediaType === "video") {
    if (block.url.includes("youtube.com") || block.url.includes("youtu.be")) {
      return getYoutubeEmbed(block.url);
    }

    if (block.url.includes("vimeo.com")) {
      return getVimeoEmbed(block.url);
    }
  }

  return block.url;
}

function TextBlock({ block }: { block: EditorTextBlock }) {
  return (
    <section className={block.width === "narrow" ? "mx-auto max-w-3xl" : "max-w-6xl"}>
      <div
        className="cms-richtext text-[clamp(1.05rem,1.2vw,1.25rem)] leading-[1.8] tracking-[-0.01em] text-white/88"
        dangerouslySetInnerHTML={{ __html: block.html }}
      />
    </section>
  );
}

function MediaBlock({ block }: { block: EditorMediaBlock }) {
  const source = getEmbedSource(block);
  const cardClass =
    block.emphasis === "feature"
      ? "border-white/30 bg-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_40px_120px_rgba(0,0,0,0.45)]"
      : "border-white/14 bg-white/[0.04]";

  return (
    <section className="grid gap-5 md:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.6fr)] md:items-end">
      <div className={`overflow-hidden rounded-[2rem] border ${cardClass}`}>
        <div className={`${getAspectClass(block.aspect)} w-full bg-black`}>
          {block.mediaType === "image" ? (
            block.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={block.url} alt={block.alt || block.title} className="h-full w-full object-cover" />
            ) : (
              <div className="relative flex h-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_35%),linear-gradient(135deg,#131313_0%,#080808_45%,#151515_100%)] text-sm uppercase tracking-[0.3em] text-white/35">
                <div className="absolute inset-0 bg-[linear-gradient(transparent_0,transparent_96%,rgba(255,255,255,0.08)_96%,rgba(255,255,255,0.08)_100%)] bg-[length:100%_20px]" />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0,transparent_96%,rgba(255,255,255,0.08)_96%,rgba(255,255,255,0.08)_100%)] bg-[length:20px_100%]" />
                <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                  <span>{block.title || "Image placeholder"}</span>
                  <span className="text-[0.68rem] tracking-[0.24em] text-white/25">Recovered media missing</span>
                </div>
              </div>
            )
          ) : block.mediaType === "video" && /\.(mp4|webm|ogg)(\?.*)?$/i.test(block.url) ? (
            <video src={block.url} controls playsInline className="h-full w-full object-cover" />
          ) : source ? (
            <iframe
              src={source}
              title={block.title || "Embedded media"}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <div className="relative flex h-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_35%),linear-gradient(135deg,#131313_0%,#080808_45%,#151515_100%)] text-sm uppercase tracking-[0.3em] text-white/35">
              <div className="absolute inset-0 bg-[linear-gradient(transparent_0,transparent_96%,rgba(255,255,255,0.08)_96%,rgba(255,255,255,0.08)_100%)] bg-[length:100%_20px]" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0,transparent_96%,rgba(255,255,255,0.08)_96%,rgba(255,255,255,0.08)_100%)] bg-[length:20px_100%]" />
              <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                <span>{block.title || "Media placeholder"}</span>
                <span className="text-[0.68rem] tracking-[0.24em] text-white/25">Recovered media missing</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 md:pb-2">
        <p className="text-[0.7rem] uppercase tracking-[0.38em] text-white/35">
          {block.mediaType === "embed" ? "Embedded website" : block.mediaType}
        </p>
        <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">{block.title || "Untitled media box"}</h3>
        {block.caption ? <p className="max-w-md text-sm leading-7 text-white/70">{block.caption}</p> : null}
        {block.url ? (
          <a href={block.url} target="_blank" rel="noreferrer" className="inline-flex text-sm text-white/65 underline-offset-4 hover:underline">
            Open source
          </a>
        ) : null}
      </div>
    </section>
  );
}

export function SiteBlockRenderer({ document }: { document: EditorDocument }) {
  return (
    <div className="space-y-12 md:space-y-20">
      {document.blocks.map((block) =>
        block.type === "text" ? <TextBlock key={block.id} block={block} /> : <MediaBlock key={block.id} block={block} />,
      )}
    </div>
  );
}
