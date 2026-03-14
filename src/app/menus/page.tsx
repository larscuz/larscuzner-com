import Link from "next/link";
import { getMenuTree, getRecoverySnapshot } from "@/lib/wordpress-data";

const snapshot = getRecoverySnapshot();

function MenuBranch({
  items,
}: {
  items: Array<{
    id: number;
    label: string;
    type: string;
    objectType: string;
    url: string;
    children: ReturnType<typeof getMenuTree>[number]["children"];
  }>;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-[1.2rem] border border-[color:var(--line)] bg-white/70 p-4">
          <p className="font-medium">{item.label}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-black/45">
            {item.type || "unknown"} / {item.objectType || "unknown"}
          </p>
          <p className="mt-2 break-all text-sm text-black/65">{item.url || "No URL recovered"}</p>
          {item.children.length > 0 ? (
            <div className="mt-4 border-l border-[color:var(--line)] pl-4">
              <MenuBranch items={item.children} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function MenusPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1080px] flex-col gap-6 px-4 py-8 sm:px-6">
      <Link href="/" className="text-sm text-black/60 underline-offset-4 hover:underline">
        Back to dashboard
      </Link>

      <section className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-6 shadow-[0_24px_100px_rgba(31,36,48,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-black/45">Information architecture</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Recovered menus</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-black/68">
          These menu trees are reconstructed from WordPress nav menu terms, nav menu item posts, and menu-item post
          meta in the SQL dump.
        </p>
      </section>

      <div className="grid gap-6">
        {snapshot.menus.map((menu) => {
          const tree = getMenuTree(menu.id);

          return (
            <section
              key={menu.id}
              className="rounded-[2rem] border border-[color:var(--line)] bg-white/80 p-6 shadow-[0_20px_80px_rgba(31,36,48,0.06)]"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-black/45">Menu #{menu.id}</p>
              <h2 className="mt-2 text-2xl font-semibold">{menu.name}</h2>
              <p className="mt-1 text-sm text-black/60">{menu.slug}</p>
              <div className="mt-5">
                {tree.length > 0 ? (
                  <MenuBranch items={tree} />
                ) : (
                  <p className="text-sm text-black/55">No menu items were linked to this menu term.</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
