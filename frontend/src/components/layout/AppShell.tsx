"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/viralcommerce-admin"];

/**
 * AppShell — conditionally renders the sidebar + topbar.
 * Auth pages (/login, /register) get a bare full-screen layout.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isAuthPage) {
    // Auth pages: no sidebar, no topbar — just the page
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: "var(--vc-bg)" }}>{children}</main>
      </div>
    </div>
  );
}
