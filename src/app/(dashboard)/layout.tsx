"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { LayoutDashboard, FileUp, Settings, LogOut, ClipboardList, Radio } from "lucide-react";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard Utama", icon: LayoutDashboard },
  { href: "/prioritas", label: "Prioritas Pemenuhan Kebutuhan", icon: ClipboardList },
];

const adminNavItems = [
  { href: "/import", label: "Unggah Data", icon: FileUp },
  { href: "/master", label: "Standar Alkom", icon: Settings },
];

const pageTitles: Record<string, string> = {
  "/": "Status Kesiapan Alkom",
  "/prioritas": "Prioritas Pemenuhan Kebutuhan Alkom",
  "/import": "Unggah Inventaris Tergelar",
  "/master": "Kelola Master Standar",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "hsl(240 35% 6%)" }}
    >
      {/* ── Sidebar ── */}
      <aside
        className="w-64 flex flex-col shrink-0"
        style={{
          backgroundColor: "hsl(240 36% 8%)",
          borderRight: "1px solid hsl(240 26% 18%)",
        }}
      >
        {/* Brand */}
        <div
          className="h-14 flex items-center gap-2.5 px-5 shrink-0"
          style={{ borderBottom: "1px solid hsl(240 26% 18%)" }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, hsl(248 100% 65%), hsl(248 80% 50%))",
              boxShadow: "0 0 12px hsl(248 100% 73% / 0.4)",
            }}
          >
            <Radio size={14} className="text-white" />
          </div>
          <span
            className="font-bold text-sm tracking-wide truncate"
            style={{
              background: "linear-gradient(135deg, #a78bfa, #818cf8, #93c5fd)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            INVENTARIS ALKOM
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 flex flex-col gap-0.5 px-3">
          <p
            className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "hsl(240 18% 45%)" }}
          >
            Menu
          </p>

          {navItems.map(({ href, label, icon: Icon }) => {
            if (href === "/prioritas" && session?.user?.role === "OPERATOR_SATUAN") return null;
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={
                  active
                    ? {
                        background:
                          "linear-gradient(135deg, hsl(248 70% 30% / 0.7), hsl(248 70% 25% / 0.5))",
                        boxShadow:
                          "inset 0 0 0 1px hsl(248 100% 73% / 0.25), 0 0 12px hsl(248 100% 73% / 0.08)",
                        color: "hsl(248 100% 83%)",
                      }
                    : {
                        color: "hsl(240 20% 65%)",
                      }
                }
              >
                <Icon
                  size={17}
                  style={{ color: active ? "hsl(248 100% 80%)" : "hsl(240 20% 55%)" }}
                />
                {label}
              </Link>
            );
          })}

          {(session?.user?.role === "ADMIN" || session?.user?.role === "OPERATOR_SATUAN") && (
            <>
              {adminNavItems.map(({ href, label, icon: Icon }) => {
                if (href === "/master" && session?.user?.role !== "ADMIN") return null;
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                    style={
                      active
                        ? {
                            background:
                              "linear-gradient(135deg, hsl(248 70% 30% / 0.7), hsl(248 70% 25% / 0.5))",
                            boxShadow:
                              "inset 0 0 0 1px hsl(248 100% 73% / 0.25), 0 0 12px hsl(248 100% 73% / 0.08)",
                            color: "hsl(248 100% 83%)",
                          }
                        : {
                            color: "hsl(240 20% 65%)",
                          }
                    }
                  >
                    <Icon
                      size={17}
                      style={{ color: active ? "hsl(248 100% 80%)" : "hsl(240 20% 55%)" }}
                    />
                    {label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User footer */}
        <div
          className="p-4 shrink-0"
          style={{ borderTop: "1px solid hsl(240 26% 18%)" }}
        >
          <div
            className="flex items-center gap-3 p-3 rounded-xl mb-3"
            style={{ backgroundColor: "hsl(240 30% 13%)" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: "linear-gradient(135deg, hsl(248 70% 45%), hsl(248 60% 35%))",
                color: "white",
              }}
            >
              {session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: "hsl(240 30% 90%)" }}
              >
                {session?.user?.name}
              </p>
              <p className="text-xs" style={{ color: "hsl(240 18% 52%)" }}>
                {session?.user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2 justify-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{
              border: "1px solid hsl(240 26% 22%)",
              color: "hsl(240 20% 65%)",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "hsl(350 60% 30% / 0.3)";
              (e.currentTarget as HTMLButtonElement).style.color =
                "hsl(350 80% 72%)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "hsl(350 60% 40% / 0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.color =
                "hsl(240 20% 65%)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "hsl(240 26% 22%)";
            }}
          >
            <LogOut size={15} />
            Keluar
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="h-14 flex items-center px-6 shrink-0"
          style={{
            backgroundColor: "hsl(240 32% 10% / 0.8)",
            borderBottom: "1px solid hsl(240 26% 18%)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-1.5 h-5 rounded-full"
              style={{
                background:
                  "linear-gradient(180deg, hsl(248 100% 73%), hsl(248 80% 55%))",
              }}
            />
            <h1
              className="text-base font-semibold tracking-tight"
              style={{ color: "hsl(240 30% 92%)" }}
            >
              {pageTitles[pathname] ?? "Sistem Informasi"}
            </h1>
          </div>
        </header>

        {/* Page content */}
        <div
          className="flex-1 overflow-y-auto p-6 grid-bg"
          style={{ backgroundColor: "hsl(240 35% 6%)" }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
