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
} from "lucide-react";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { href: "/",              label: "Dashboard",    icon: LayoutDashboard },
  { href: "/products",      label: "Products",     icon: ShoppingBag },
  { href: "/trends",        label: "Trend Radar",  icon: TrendingUp },
  { href: "/suppliers",     label: "Suppliers",    icon: Truck },
  { href: "/campaigns",     label: "Campaigns",    icon: Megaphone },
  { href: "/analytics",     label: "Analytics",    icon: BarChart3 },
  { href: "/crawler",       label: "Crawler",      icon: Zap },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
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
              key={href}
              href={href}
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
      <div className="px-3 pb-4 border-t border-gray-800 pt-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <div className="mt-3 mx-3 p-3 bg-gradient-to-br from-brand-900/50 to-purple-900/30 rounded-lg border border-brand-500/20">
          <p className="text-xs font-semibold text-brand-400">PRO Plan</p>
          <p className="text-xs text-gray-400 mt-1">Unlimited products & campaigns</p>
        </div>
      </div>
    </aside>
  );
}
