import { loginAction } from "@/lib/server/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col justify-center px-4 py-8 sm:px-6">
      <section className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-6 shadow-[0_24px_100px_rgba(31,36,48,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-black/45">Admin access</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-3 text-sm leading-7 text-black/68">
          This gate protects the editable CMS layer and unpublished imported content.
        </p>

        <form action={loginAction} className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Password</span>
            <input
              type="password"
              name="password"
              className="rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
            />
          </label>

          {query.error === "1" ? <p className="text-sm text-[color:var(--signal)]">Incorrect password.</p> : null}

          <button
            type="submit"
            className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-[color:var(--background)] transition hover:opacity-90"
          >
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
