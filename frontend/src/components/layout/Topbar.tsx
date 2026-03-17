"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, LogOut, Settings, User, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import Link from "next/link";
import { useT } from "@/store/preferences";
import { api } from "@/lib/api";

export function Topbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifProducts, setNotifProducts] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const t = useT();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!notifOpen) return;
    setNotifLoading(true);
    api.get("/notifications/viral-products/recent", { params: { min_score: 80, hours: 24 } })
      .then(r => setNotifProducts(r.data || []))
      .catch(() => setNotifProducts([]))
      .finally(() => setNotifLoading(false));
  }, [notifOpen]);

  useEffect(() => {
    api.get("/notifications/viral-products/recent", { params: { min_score: 80, hours: 24 } })
      .then(r => setNotifProducts(r.data || []))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "VC";

  return (
    <header className="h-16 border-b flex items-center justify-between px-6 flex-shrink-0" style={{ backgroundColor: "var(--vc-card)", borderColor: "var(--vc-border)" }}>
      {/* Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder={t.common.search + "..."}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Live indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-green-400 font-medium">{t.nav.crawler}</span>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notifProducts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-300">🔥 Alertas Virais (24h)</p>
                <span className="text-xs text-gray-600">{notifProducts.length} novos</span>
              </div>
              {notifLoading ? (
                <div className="flex items-center justify-center h-20">
                  <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-20 text-gray-600 text-xs">
                  <Bell className="w-6 h-6 mb-1 opacity-30" />
                  Nenhum produto viral nas últimas 24h
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  {notifProducts.slice(0, 8).map((p: any) => (
                    <Link
                      key={p.id}
                      href={`/products/${p.id}`}
                      onClick={() => setNotifOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">📦</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-200 truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.category}</p>
                      </div>
                      <span className={`text-xs font-bold flex-shrink-0 ${
                        p.viral_score >= 95 ? "text-red-400" : p.viral_score >= 85 ? "text-orange-400" : "text-yellow-400"
                      }`}>
                        {Math.round(p.viral_score)}🔥
                      </span>
                    </Link>
                  ))}
                </div>
              )}
              <div className="px-4 py-2 border-t border-gray-800">
                <Link
                  href="/products"
                  onClick={() => setNotifOpen(false)}
                  className="block text-center text-xs text-sky-400 hover:text-sky-300"
                >
                  Ver todos os produtos virais →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {initials}
            </div>
            {user && (
              <div className="hidden md:block text-left">
                <p className="text-xs font-medium text-gray-200 leading-none">
                  {user.full_name ?? user.email.split("@")[0]}
                </p>
                <p className="text-xs text-gray-500 leading-none mt-0.5 capitalize">{t.common.plan} {user.plan}</p>
              </div>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-1 z-50">
              {/* Email header */}
              <div className="px-4 py-2.5 border-b border-gray-800">
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <span className="text-xs font-semibold text-brand-400 capitalize">{t.common.plan} {user?.plan}</span>
              </div>

              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
                {t.nav.settings}
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t.common.signout}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
