"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingBag,
  Truck,
  Megaphone,
  BarChart3,
  Zap,
  Settings,
  Flame,
  Crown,
  BookOpen,
  Globe,
  Bookmark,
} from "lucide-react";
import { clsx } from "clsx";
import { useT } from "@/store/preferences";
import { useAuthStore } from "@/store/auth";

export function Sidebar() {
  const pathname = usePathname();
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const plan = user?.plan ?? "free";

  const NAV_ITEMS = [
    { href: "/",           label: t.nav.dashboard,  icon: LayoutDashboard },
    { href: "/products",   label: t.nav.products,   icon: ShoppingBag },
    { href: "/trends",     label: t.nav.trends,     icon: TrendingUp },
    { href: "/watchlist",  label: "Favoritos",       icon: Bookmark },
    { href: "/suppliers",  label: t.nav.suppliers,  icon: Truck },
    { href: "/campaigns",  label: t.nav.campaigns,  icon: Megaphone },
    { href: "/analytics",  label: t.nav.analytics,  icon: BarChart3 },
    { href: "/crawler",    label: t.nav.crawler,    icon: Zap },
  ];

  return (
    <aside className="w-64 flex flex-col border-r" style={{ backgroundColor: "var(--vc-card)", borderColor: "var(--vc-border)" }}>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b" style={{ borderColor: "var(--vc-border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">ViralCommerce</p>
            <p className="text-xs text-brand-400 leading-none mt-0.5">AI Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={`nav-${href}`}
              href={href}
              data-href={href}
              style={{ pointerEvents: "auto" }}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-brand-500/10 text-brand-400 border border-brand-500/20"
                  : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t pt-3" style={{ borderColor: "var(--vc-border)" }}>
        <Link
          href="/pricing"
          className={clsx(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            pathname === "/pricing"
              ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
              : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
          )}
        >
          <Crown className="w-4 h-4" />
          {t.nav.pricing}
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
          {t.nav.settings}
        </Link>
        <Link
          href="/docs"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          Documentação
        </Link>
        <a
          href="/landing"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
        >
          <Globe className="w-4 h-4" />
          Site público
        </a>
        {plan === "free" ? (
          <Link
            href="/pricing"
            className="mt-3 mx-3 block p-3 bg-gradient-to-br from-gray-800/80 to-gray-900/60 rounded-lg border border-gray-700/50 hover:border-brand-500/30 transition-colors"
          >
            <p className="text-xs font-semibold text-gray-400">{t.common.plan} FREE</p>
            <p className="text-xs text-brand-400 mt-1">👑 Upgrade para Pro →</p>
          </Link>
        ) : plan === "enterprise" ? (
          <div className="mt-3 mx-3 p-3 bg-gradient-to-br from-purple-900/50 to-brand-900/30 rounded-lg border border-purple-500/20">
            <p className="text-xs font-semibold text-purple-400">{t.common.plan} ENTERPRISE</p>
            <p className="text-xs text-gray-400 mt-1">Acesso total + suporte prioritário</p>
          </div>
        ) : (
          <div className="mt-3 mx-3 p-3 bg-gradient-to-br from-brand-900/50 to-purple-900/30 rounded-lg border border-brand-500/20">
            <p className="text-xs font-semibold text-brand-400">{t.common.plan} PRO</p>
            <p className="text-xs text-gray-400 mt-1">Produtos e campanhas ilimitados</p>
          </div>
        )}
      </div>
    </aside>
  );
}
