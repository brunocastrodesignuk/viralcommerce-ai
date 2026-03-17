"use client";

import { useState } from "react";
import {
  Crown, DollarSign, TrendingUp, Globe, Layers, Users,
  BarChart3, Target, Zap, Package, ShoppingCart, Star,
  ArrowUpRight, ArrowDownRight, RefreshCw, Settings,
  Building2, Sparkles, Trophy, Flame, ChevronRight,
  PieChart, Activity, Landmark,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Brand {
  id: string;
  name: string;
  niche: string;
  emoji: string;
  revenue: number;
  growth: number;
  products: number;
  stores: number;
  status: "thriving" | "growing" | "launching";
}

interface Milestone {
  target: number;
  label: string;
  reached: boolean;
  date?: string;
}

interface SupplierDeal {
  supplier: string;
  country: string;
  flag: string;
  discount: string;
  moq: string;
  shipping: string;
  status: "active" | "negotiating" | "opportunity";
}

// ─── Demo Data ────────────────────────────────────────────────────────────────
const BRANDS: Brand[] = [
  { id: "b1", name: "LumiHome",   niche: "Smart Home",      emoji: "💡", revenue: 42_800, growth: 34, products: 8,  stores: 2, status: "thriving"  },
  { id: "b2", name: "BrewMatic",  niche: "Coffee & Kitchen", emoji: "☕", revenue: 18_500, growth: 67, products: 4,  stores: 1, status: "growing"   },
  { id: "b3", name: "VitaFit",    niche: "Health & Fitness", emoji: "💪", revenue: 7_200,  growth: 120, products: 3, stores: 1, status: "launching" },
];

const MILESTONES: Milestone[] = [
  { target: 1_000,    label: "Primeira venda",     reached: true,  date: "Jan 2026" },
  { target: 10_000,   label: "£10K — Validado",    reached: true,  date: "Fev 2026" },
  { target: 50_000,   label: "£50K — Escalando",   reached: true,  date: "Mar 2026" },
  { target: 100_000,  label: "£100K — Milestone!", reached: false },
  { target: 250_000,  label: "£250K — Empresa",    reached: false },
  { target: 500_000,  label: "£500K — Mid Market", reached: false },
  { target: 1_000_000, label: "£1M — 🏆 Empire",   reached: false },
];

const SUPPLIER_DEALS: SupplierDeal[] = [
  { supplier: "Yiwu Lumi Tech",  country: "China",     flag: "🇨🇳", discount: "18%",  moq: "500 un",  shipping: "8 dias",  status: "active"       },
  { supplier: "CJ Dropshipping", country: "China",     flag: "🇨🇳", discount: "12%",  moq: "1 un",    shipping: "12 dias", status: "active"       },
  { supplier: "US Warehouse Co", country: "EUA",       flag: "🇺🇸", discount: "5%",   moq: "200 un",  shipping: "2 dias",  status: "negotiating"  },
  { supplier: "EU Fulfillment",  country: "Alemanha",  flag: "🇩🇪", discount: "—",    moq: "100 un",  shipping: "3 dias",  status: "opportunity"  },
];

const TOTAL_REVENUE = BRANDS.reduce((s, b) => s + b.revenue, 0);
const REVENUE_TARGET = 1_000_000;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EmpirePage() {
  const [selectedBrand, setSelectedBrand] = useState<Brand>(BRANDS[0]);
  const [tab, setTab] = useState<"empire" | "brands" | "suppliers" | "roadmap">("empire");

  const progress = (TOTAL_REVENUE / REVENUE_TARGET) * 100;
  const nextMilestone = MILESTONES.find((m) => !m.reached);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-400" />
            Empire Builder
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Fase 4 — £100.000 → £1.000.000 · Gestão de múltiplas marcas e negociação de fornecedores
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toast.success("📊 Relatório de P&L gerado!")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            P&amp;L Report
          </button>
          <button
            onClick={() => toast.success("🤖 Empire AI a optimizar portfolio...")}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-sm font-bold rounded-lg transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Empire AI
          </button>
        </div>
      </div>

      {/* ── £1M Progress Banner ── */}
      <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-gray-900 via-amber-950/20 to-gray-900 border border-amber-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-amber-400/80 font-medium">Jornada £100 → £1.000.000</p>
              <p className="text-3xl font-black text-white mt-1">
                £{TOTAL_REVENUE.toLocaleString()}
                <span className="text-lg font-normal text-gray-400 ml-2">de £1.000.000</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Próxima meta</p>
              <p className="text-sm font-bold text-amber-400 mt-0.5">
                £{nextMilestone?.target.toLocaleString()} — {nextMilestone?.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Faltam £{((nextMilestone?.target ?? 0) - TOTAL_REVENUE).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-900 rounded-full h-4 border border-gray-800">
            <div
              className="h-full rounded-full relative overflow-hidden transition-all"
              style={{
                width: `${Math.min(progress, 100)}%`,
                background: "linear-gradient(90deg, #f59e0b, #fbbf24, #fde68a)",
              }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            </div>
          </div>

          {/* Milestone markers */}
          <div className="flex justify-between mt-3 text-xs text-gray-600">
            {MILESTONES.filter((_, i) => i % 2 === 0).map((m) => (
              <div key={m.target} className="text-center">
                <span className={m.reached ? "text-amber-400" : "text-gray-700"}>
                  £{m.target >= 1000 ? `${m.target / 1000}K` : m.target}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: "Receita Total",      value: `£${TOTAL_REVENUE.toLocaleString()}`,                      icon: DollarSign, color: "text-green-400",  bg: "bg-green-500/10" },
          { label: "Marcas Activas",     value: `${BRANDS.length}`,                                         icon: Building2,  color: "text-brand-400",  bg: "bg-brand-500/10" },
          { label: "Produtos Totais",    value: `${BRANDS.reduce((s,b) => s + b.products, 0)}`,              icon: Package,    color: "text-sky-400",    bg: "bg-sky-500/10" },
          { label: "Crescimento Médio",  value: `+${Math.round(BRANDS.reduce((s,b)=>s+b.growth,0)/BRANDS.length)}%`, icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Mercados",           value: "4 países",                                                  icon: Globe,      color: "text-amber-400",  bg: "bg-amber-500/10" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border p-4" style={{ background: "var(--vc-card)", borderColor: "var(--vc-border)" }}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">{k.label}</p>
              <div className={`p-1.5 rounded-lg ${k.bg}`}><k.icon className={`w-4 h-4 ${k.color}`} /></div>
            </div>
            <p className={`text-xl font-bold mt-2 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--vc-card)", borderColor: "var(--vc-border)" }}>
        <div className="flex border-b" style={{ borderColor: "var(--vc-border)" }}>
          {(["empire", "brands", "suppliers", "roadmap"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-amber-400 text-amber-400"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {t === "empire"    ? "🏰 Visão Geral" :
               t === "brands"    ? "🏷️ Marcas"      :
               t === "suppliers" ? "🏭 Fornecedores" :
                                   "🗺️ Roadmap"}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ── Empire Overview ── */}
          {tab === "empire" && (
            <div className="grid grid-cols-2 gap-6">
              {/* Revenue breakdown */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-4">Receita por Marca</h3>
                <div className="space-y-3">
                  {BRANDS.map((b) => (
                    <div key={b.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white">{b.emoji} {b.name}</span>
                        <span className="text-gray-400">£{b.revenue.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all"
                          style={{ width: `${(b.revenue / TOTAL_REVENUE) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mt-0.5">
                        <span>{b.niche}</span>
                        <span className="text-green-400">+{b.growth}% MoM</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key metrics */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">Saúde do Empire</h3>
                {[
                  { label: "Net Profit Margin",  value: "64%",  status: "excellent", icon: "💎" },
                  { label: "Customer LTV",        value: "£87",  status: "good",      icon: "♻️" },
                  { label: "CAC Médio",           value: "£8.40",status: "good",      icon: "🎯" },
                  { label: "Return Rate",         value: "3.1%", status: "excellent", icon: "📦" },
                  { label: "Supplier Risk",       value: "Baixo",status: "excellent", icon: "🏭" },
                ].map((m) => (
                  <div key={m.label} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/40 border border-gray-700/50">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{m.icon}</span>
                      <p className="text-sm text-gray-300">{m.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{m.value}</span>
                      <span className={`w-2 h-2 rounded-full ${m.status === "excellent" ? "bg-green-400" : "bg-amber-400"}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Brands Tab ── */}
          {tab === "brands" && (
            <div className="space-y-4">
              {BRANDS.map((brand) => (
                <div
                  key={brand.id}
                  onClick={() => setSelectedBrand(brand)}
                  className={`p-5 rounded-xl border cursor-pointer transition-all ${
                    selectedBrand.id === brand.id
                      ? "border-amber-500/50 bg-amber-500/5"
                      : "border-gray-700 hover:border-gray-600 bg-gray-800/30"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center text-2xl">
                        {brand.emoji}
                      </div>
                      <div>
                        <p className="text-base font-bold text-white">{brand.name}</p>
                        <p className="text-xs text-gray-400">{brand.niche} · {brand.stores} loja{brand.stores > 1 ? "s" : ""} · {brand.products} produtos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">£{brand.revenue.toLocaleString()}</p>
                      <p className="text-xs text-green-500">+{brand.growth}% este mês</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {[
                      { icon: BarChart3, label: "Analytics", action: () => toast.success(`📊 Analytics de ${brand.name}`) },
                      { icon: Settings,  label: "Gerir",     action: () => toast(`⚙️ Gerir ${brand.name}`) },
                      { icon: Globe,     label: "Expandir",  action: () => toast.success(`🌍 A expandir ${brand.name}...`) },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        onClick={(e) => { e.stopPropagation(); btn.action(); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                      >
                        <btn.icon className="w-3.5 h-3.5" />
                        {btn.label}
                      </button>
                    ))}
                    <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                      brand.status === "thriving"  ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                      brand.status === "growing"   ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" :
                                                     "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {brand.status === "thriving" ? "🌟 Florescendo" : brand.status === "growing" ? "📈 Crescendo" : "🚀 Lançando"}
                    </span>
                  </div>
                </div>
              ))}
              <button
                onClick={() => toast.success("✨ Assistente de criação de nova marca iniciado!")}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-gray-700 hover:border-amber-500/50 text-gray-500 hover:text-amber-400 transition-colors"
              >
                <Crown className="w-4 h-4" />
                Criar nova marca
              </button>
            </div>
          )}

          {/* ── Suppliers Tab ── */}
          {tab === "suppliers" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Acordos negociados com fornecedores premium</p>
                <button
                  onClick={() => toast.success("🤖 IA a encontrar melhores fornecedores...")}
                  className="text-xs px-3 py-1.5 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 border border-brand-500/30 rounded-lg transition-colors"
                >
                  <Zap className="w-3 h-3 inline mr-1" />
                  Encontrar novos
                </button>
              </div>
              {SUPPLIER_DEALS.map((deal) => (
                <div key={deal.supplier} className="flex items-center justify-between p-4 rounded-xl border border-gray-700 bg-gray-800/30">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{deal.flag}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{deal.supplier}</p>
                      <p className="text-xs text-gray-500">{deal.country} · MOQ: {deal.moq} · Envio: {deal.shipping}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Desconto</p>
                      <p className="text-sm font-bold text-green-400">{deal.discount}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                      deal.status === "active"       ? "bg-green-500/10 text-green-400 border-green-500/20" :
                      deal.status === "negotiating"  ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                       "bg-sky-500/10 text-sky-400 border-sky-500/20"
                    }`}>
                      {deal.status === "active" ? "✅ Activo" : deal.status === "negotiating" ? "🤝 Negociando" : "🎯 Oportunidade"}
                    </span>
                    <button
                      onClick={() => toast(`📞 A contactar ${deal.supplier}...`)}
                      className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                    >
                      Contactar
                    </button>
                  </div>
                </div>
              ))}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-300">
                  💡 <strong>Tip Empire:</strong> Com £100K em volume mensal, negocia directamente com fabricantes para descontos de 25–40%.
                  A IA vai identificar automaticamente quando atingires o threshold para cada fornecedor.
                </p>
              </div>
            </div>
          )}

          {/* ── Roadmap Tab ── */}
          {tab === "roadmap" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400 mb-4">O teu mapa para £1.000.000</p>
              {MILESTONES.map((m, i) => (
                <div key={m.target} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm ${
                      m.reached ? "bg-amber-500 text-black font-bold" : "bg-gray-800 border border-gray-700 text-gray-600"
                    }`}>
                      {m.reached ? "✓" : i + 1}
                    </div>
                    {i < MILESTONES.length - 1 && (
                      <div className={`w-0.5 flex-1 mt-1 ${m.reached ? "bg-amber-500/40" : "bg-gray-800"}`} style={{ minHeight: 28 }} />
                    )}
                  </div>
                  <div className={`flex-1 p-4 rounded-xl border mb-2 transition-all ${
                    m.reached          ? "border-amber-500/30 bg-amber-500/5 opacity-80" :
                    !MILESTONES[i-1]?.reached ? "border-brand-500/40 bg-brand-500/5" :
                                         "border-gray-800"
                  }`}
                    style={!m.reached && MILESTONES[i-1]?.reached ? {} : {}}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-white">
                          £{m.target.toLocaleString()}
                          {m.target === 1_000_000 && " 🏆"}
                        </p>
                        <p className="text-xs text-gray-400">{m.label}</p>
                      </div>
                      <div className="text-right">
                        {m.reached ? (
                          <span className="text-xs text-amber-400">✓ {m.date}</span>
                        ) : i === MILESTONES.findIndex(x => !x.reached) ? (
                          <span className="text-xs text-brand-400">← Próxima</span>
                        ) : (
                          <span className="text-xs text-gray-600">
                            Faltam £{(m.target - TOTAL_REVENUE).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {m.target === 1_000_000 && !m.reached && (
                      <p className="text-xs text-amber-400/70 mt-2">
                        🏆 A £1M tornás-te parte do top 0.1% de dropshippers. Tempo estimado: 6–18 meses.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
