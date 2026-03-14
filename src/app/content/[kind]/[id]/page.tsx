import Link from "next/link";
import { notFound } from "next/navigation";
import { getContentCollection, getContentRecord, type AttachmentRecord, type ContentRecord } from "@/lib/wordpress-data";

export function generateStaticParams() {
  return ["posts", "pages", "attachments"].flatMap((kind) =>
    getContentCollection(kind).map((record) => ({
      kind,
      id: String(record.id),
    })),
  );
}

export default async function ContentRecordPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const { kind, id } = await params;
  const record = getContentRecord(kind, id);

  if (!record) {
    notFound();
  }

  const isAttachment = kind === "attachments";
  const contentRecord = !isAttachment ? (record as ContentRecord) : null;
  const attachmentRecord = isAttachment ? (record as AttachmentRecord) : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1080px] flex-col gap-6 px-4 py-8 sm:px-6">
      <Link href="/" className="text-sm text-black/60 underline-offset-4 hover:underline">
        Back to dashboard
      </Link>

      <section className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-6 shadow-[0_24px_100px_rgba(31,36,48,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-black/45">{kind.slice(0, -1)} record</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{record.title}</h1>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-black/65">
          <span className="rounded-full bg-black/[0.05] px-3 py-2">ID {record.id}</span>
          {"slug" in record ? <span className="rounded-full bg-black/[0.05] px-3 py-2">/{record.slug || "untitled"}/</span> : null}
          {"status" in record ? <span className="rounded-full bg-black/[0.05] px-3 py-2">{record.status}</span> : null}
        </div>
      </section>

      {!isAttachment && contentRecord ? (
        <>
          <section className="rounded-[2rem] border border-[color:var(--line)] bg-white/80 p-6">
            <h2 className="text-xl font-semibold">Summary</h2>
            <p className="mt-3 text-sm leading-7 text-black/70">{contentRecord.excerpt || "No excerpt available."}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-black/45">Public URL</p>
                <p className="mt-2 break-all text-sm">{contentRecord.url}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-black/45">Taxonomies</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {contentRecord.terms.length > 0 ? (
                    contentRecord.terms.map((term) => (
                      <span key={`${term.taxonomy}-${term.slug}`} className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs">
                        {term.taxonomy}: {term.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-black/55">None assigned</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[color:var(--line)] bg-white/80 p-6">
            <h2 className="text-xl font-semibold">Recovered body HTML</h2>
            <pre className="mt-4 overflow-x-auto rounded-[1.25rem] bg-black/[0.04] p-4 text-xs leading-6 whitespace-pre-wrap text-black/75">
              {contentRecord.content || "No body content recovered."}
            </pre>
          </section>

          <section className="rounded-[2rem] border border-[color:var(--line)] bg-white/80 p-6">
            <h2 className="text-xl font-semibold">Linked media</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {contentRecord.linkedAttachmentIds.length > 0 ? (
                contentRecord.linkedAttachmentIds.map((attachmentId) => (
                  <Link
                    key={attachmentId}
                    href={`/content/attachments/${attachmentId}`}
                    className="rounded-[1.2rem] border border-[color:var(--line)] px-4 py-3 text-sm hover:bg-black/[0.03]"
                  >
                    Attachment #{attachmentId}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-black/55">No linked media was inferred from the exported content.</p>
              )}
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-[2rem] border border-[color:var(--line)] bg-white/80 p-6">
          <h2 className="text-xl font-semibold">Attachment details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-black/55">File</dt>
              <dd className="break-all text-right">{attachmentRecord?.file || "Unavailable"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-black/55">Mime type</dt>
              <dd className="text-right">{attachmentRecord?.mimeType || "Unavailable"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-black/55">URL</dt>
              <dd className="break-all text-right">{attachmentRecord?.url || "Unavailable"}</dd>
            </div>
          </dl>
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.22em] text-black/45">Linked from</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {attachmentRecord && attachmentRecord.linkedFrom.length > 0 ? (
                attachmentRecord.linkedFrom.map((item) => (
                  <Link
                    key={`${item.kind}-${item.id}`}
                    href={`/content/${item.kind}/${item.id}`}
                    className="rounded-[1.2rem] border border-[color:var(--line)] px-4 py-3 text-sm hover:bg-black/[0.03]"
                  >
                    {item.title}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-black/55">No inbound content links were inferred yet.</p>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
