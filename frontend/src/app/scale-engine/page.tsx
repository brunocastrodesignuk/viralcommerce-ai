"use client";

import { useState } from "react";
import {
  Rocket, TrendingUp, DollarSign, Globe, Zap, Target,
  BarChart3, ArrowUpRight, RefreshCw, Play, Pause,
  CheckCircle2, AlertCircle, Clock, Loader2, ChevronRight,
  Layers, Users, ShoppingCart, PlusCircle, Flame,
} from "lucide-react";
import toast from "react-hot-toast";
import { usePreferences, convertPrice } from "@/store/preferences";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ScalePlan {
  id: string;
  product: string;
  category: string;
  currentRevenue: number;
  targetRevenue: number;
  currentBudget: number;
  roas: number;
  margin: number;
  platforms: Platform[];
  geos: Geo[];
  phase: "test" | "scale" | "dominate";
  status: "active" | "paused" | "completed";
  daysRunning: number;
  projectedDays: number;
}

interface Platform {
  name: "meta" | "tiktok" | "google" | "pinterest" | "snapchat";
  active: boolean;
  budget: number;
  roas: number;
  status: "winning" | "testing" | "paused";
}

interface Geo {
  country: string;
  flag: string;
  budget: number;
  revenue: number;
  roas: number;
  status: "winning" | "testing" | "opportunity";
}

interface ScaleStep {
  id: string;
  label: string;
  desc: string;
  currentBudget: number;
  targetBudget: number;
  expectedRoas: number;
  expectedRevenue: number;
  done: boolean;
  active: boolean;
}

// ─── Demo Data ────────────────────────────────────────────────────────────────
const DEMO_PLANS: ScalePlan[] = [
  {
    id: "p1",
    product: "LED Strip Lights RGB Smart",
    category: "Home & Garden",
    currentRevenue: 3_840,
    targetRevenue: 50_000,
    currentBudget: 120,
    roas: 4.2,
    margin: 68,
    daysRunning: 14,
    projectedDays: 42,
    phase: "scale",
    status: "active",
    platforms: [
      { name: "tiktok", active: true,  budget: 70,  roas: 5.1, status: "winning" },
      { name: "meta",   active: true,  budget: 50,  roas: 3.1, status: "testing" },
      { name: "google", active: false, budget: 0,   roas: 0,   status: "paused" },
    ],
    geos: [
      { country: "Reino Unido", flag: "🇬🇧", budget: 70,  revenue: 2_100, roas: 4.5, status: "winning" },
      { country: "EUA",         flag: "🇺🇸", budget: 30,  revenue: 1_200, roas: 3.8, status: "testing" },
      { country: "Austrália",   flag: "🇦🇺", budget: 20,  revenue: 540,   roas: 3.0, status: "opportunity" },
    ],
  },
  {
    id: "p2",
    product: "Galaxy Star Projector Night Light",
    category: "Home & Garden",
    currentRevenue: 1_260,
    targetRevenue: 20_000,
    currentBudget: 50,
    roas: 3.5,
    margin: 72,
    daysRunning: 7,
    projectedDays: 60,
    phase: "test",
    status: "active",
    platforms: [
      { name: "tiktok", active: true,  budget: 50, roas: 3.5, status: "testing" },
      { name: "meta",   active: false, budget: 0,  roas: 0,   status: "paused" },
    ],
    geos: [
      { country: "Reino Unido", flag: "🇬🇧", budget: 50, revenue: 1_260, roas: 3.5, status: "testing" },
    ],
  },
  {
    id: "p3",
    product: "Mini Portable Espresso Maker",
    category: "Kitchen",
    currentRevenue: 8_750,
    targetRevenue: 100_000,
    currentBudget: 280,
    roas: 4.8,
    margin: 65,
    daysRunning: 28,
    projectedDays: 30,
    phase: "dominate",
    status: "active",
    platforms: [
      { name: "tiktok",    active: true, budget: 120, roas: 5.4, status: "winning" },
      { name: "meta",      active: true, budget: 100, roas: 4.2, status: "winning" },
      { name: "google",    active: true, budget: 60,  roas: 3.9, status: "testing" },
    ],
    geos: [
      { country: "Reino Unido", flag: "🇬🇧", budget: 140, revenue: 4_200, roas: 5.1, status: "winning" },
      { country: "EUA",         flag: "🇺🇸", budget: 80,  revenue: 3_040, roas: 4.5, status: "winning" },
      { country: "Canadá",      flag: "🇨🇦", budget: 40,  revenue: 1_200, roas: 3.8, status: "testing" },
      { country: "Austrália",   flag: "🇦🇺", budget: 20,  revenue: 310,   roas: 3.0, status: "opportunity" },
    ],
  },
];

const SCALE_LADDER: ScaleStep[] = [
  { id: "s1", label: "Fase 1 — Validação",   desc: "Testar 3 criativos × £10/dia",     currentBudget: 30,   targetBudget: 30,   expectedRoas: 2.0, expectedRevenue: 600,    done: true,  active: false },
  { id: "s2", label: "Fase 2 — Escalar x2",  desc: "Dobrar budget no winner",           currentBudget: 30,   targetBudget: 60,   expectedRoas: 2.5, expectedRevenue: 1_500,  done: true,  active: false },
  { id: "s3", label: "Fase 3 — Testar Geos", desc: "Expandir para 2 países novos",      currentBudget: 60,   targetBudget: 120,  expectedRoas: 3.0, expectedRevenue: 3_600,  done: false, active: true  },
  { id: "s4", label: "Fase 4 — Multi-plat.", desc: "Adicionar Meta + Google",            currentBudget: 120,  targetBudget: 300,  expectedRoas: 3.5, expectedRevenue: 10_500, done: false, active: false },
  { id: "s5", label: "Fase 5 — Dominar",     desc: "Escalar para £1.000/dia de budget", currentBudget: 300,  targetBudget: 1_000, expectedRoas: 4.0, expectedRevenue: 40_000, done: false, active: false },
];

const PLATFORM_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  meta:      { label: "Meta",      color: "text-blue-400",   bg: "bg-blue-500/10" },
  tiktok:    { label: "TikTok",    color: "text-pink-400",   bg: "bg-pink-500/10" },
  google:    { label: "Google",    color: "text-amber-400",  bg: "bg-amber-500/10" },
  pinterest: { label: "Pinterest", color: "text-red-400",    bg: "bg-red-500/10" },
  snapchat:  { label: "Snapchat",  color: "text-yellow-400", bg: "bg-yellow-500/10" },
};

const PHASE_CONFIG = {
  test:     { label: "🧪 Testando",  color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/30" },
  scale:    { label: "📈 Escalando", color: "text-sky-400",    bg: "bg-sky-500/10",    border: "border-sky-500/30" },
  dominate: { label: "🔥 Dominando", color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/30" },
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ScaleEnginePage() {
  const { currency } = usePreferences();
  const [plans, setPlans] = useState<ScalePlan[]>(DEMO_PLANS);
  const [selected, setSelected] = useState<ScalePlan>(DEMO_PLANS[0]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "platforms" | "geos" | "ladder">("overview");

  const totalRevenue = plans.reduce((s, p) => s + p.currentRevenue, 0);
  const totalBudget  = plans.reduce((s, p) => s + p.currentBudget,  0);
  const avgRoas      = plans.reduce((s, p) => s + p.roas, 0) / plans.length;

  function handleScaleUp(planId: string) {
    setLoading(true);
    setTimeout(() => {
      setPlans((prev) =>
        prev.map((p) =>
          p.id === planId
            ? { ...p, currentBudget: Math.round(p.currentBudget * 1.5), currentRevenue: Math.round(p.currentRevenue * 1.4) }
            : p
        )
      );
      setLoading(false);
      toast.success("💰 Budget escalado +50%! Monitorando ROAS...");
    }, 1200);
  }

  function handlePlatformToggle(platform: Platform) {
    if (platform.active) {
      toast("⏸️ Plataforma pausada", { icon: "⚠️" });
    } else {
      toast.success(`🚀 Lançando no ${PLATFORM_CONFIG[platform.name].label}!`);
    }
  }

  const sel = selected;
  const selPlan = plans.find((p) => p.id === sel.id) ?? sel;
  const progress = Math.round((selPlan.currentRevenue / selPlan.targetRevenue) * 100);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Rocket className="w-6 h-6 text-brand-400" />
            Scale Engine
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Fase 3 — £5.000 → £100.000 · Escala automática multi-plataforma e multi-geo
          </p>
        </div>
        <button
          onClick={() => toast.success("🤖 IA a analisar oportunidades de escala...")}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Zap className="w-4 h-4" />
          Auto-Scale AI
        </button>
      </div>

      {/* ── KPI Bar ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Receita Total",    value: `£${totalRevenue.toLocaleString()}`, sub: "este mês",     icon: DollarSign, color: "text-green-400",  bg: "bg-green-500/10" },
          { label: "Budget/Dia",       value: `£${totalBudget}`,                   sub: "em 3 produtos", icon: Target,     color: "text-brand-400",  bg: "bg-brand-500/10" },
          { label: "ROAS Médio",       value: `${avgRoas.toFixed(1)}×`,            sub: "todas as plat.", icon: BarChart3,  color: "text-sky-400",    bg: "bg-sky-500/10" },
          { label: "Produtos Activos", value: `${plans.filter(p => p.status === "active").length}`,  sub: "a escalar",   icon: Layers,     color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border p-4" style={{ background: "var(--vc-card)", borderColor: "var(--vc-border)" }}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">{k.label}</p>
              <div className={`p-1.5 rounded-lg ${k.bg}`}>
                <k.icon className={`w-4 h-4 ${k.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold mt-2 ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* ── Product List ── */}
        <div className="col-span-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">Produtos em Escala</h2>
          {plans.map((plan) => {
            const ph = PHASE_CONFIG[plan.phase];
            const isSelected = plan.id === selPlan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelected(plan)}
                className={`rounded-xl border p-4 cursor-pointer transition-all ${
                  isSelected
                    ? "border-brand-500/50 bg-brand-500/5"
                    : "hover:border-gray-600"
                }`}
                style={!isSelected ? { background: "var(--vc-card)", borderColor: "var(--vc-border)" } : {}}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-white leading-tight">{plan.product}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${ph.bg} ${ph.color} border ${ph.border}`}>
                    {ph.label}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>£{plan.currentRevenue.toLocaleString()}</span>
                    <span>meta £{plan.targetRevenue.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-green-400 transition-all"
                      style={{ width: `${Math.min((plan.currentRevenue / plan.targetRevenue) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between mt-3 text-xs">
                  <span className="text-gray-500">£{plan.currentBudget}/dia</span>
                  <span className="text-green-400 font-medium">ROAS {plan.roas}×</span>
                </div>
              </div>
            );
          })}

          <button
            onClick={() => toast("🔍 Selecciona um produto da lista de produtos virais", { icon: "💡" })}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-gray-700 hover:border-brand-500/50 text-gray-500 hover:text-brand-400 transition-colors text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Adicionar produto
          </button>
        </div>

        {/* ── Detail Panel ── */}
        <div className="col-span-8 rounded-xl border" style={{ background: "var(--vc-card)", borderColor: "var(--vc-border)" }}>
          {/* Tabs */}
          <div className="flex border-b px-4" style={{ borderColor: "var(--vc-border)" }}>
            {(["overview", "platforms", "geos", "ladder"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-brand-500 text-brand-400"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab === "overview"   ? "📊 Visão Geral" :
                 tab === "platforms"  ? "📱 Plataformas"  :
                 tab === "geos"       ? "🌍 Mercados"     :
                                        "🪜 Escada"}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* ── Overview Tab ── */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{selPlan.product}</h3>
                    <p className="text-sm text-gray-400">{selPlan.category} · {selPlan.daysRunning} dias activo</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleScaleUp(selPlan.id)}
                      disabled={loading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-sm rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      Escalar +50%
                    </button>
                    <button
                      onClick={() => toast("⏸️ Plano pausado", { icon: "⚠️" })}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Pausar
                    </button>
                  </div>
                </div>

                {/* Progress to target */}
                <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700">
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-400">Progresso para meta</span>
                    <span className="text-white font-bold">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-900 rounded-full h-3">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 via-sky-500 to-green-400 transition-all relative"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>£{selPlan.currentRevenue.toLocaleString()} receita</span>
                    <span>Meta: £{selPlan.targetRevenue.toLocaleString()}</span>
                  </div>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Budget/Dia",    value: `£${selPlan.currentBudget}`, color: "text-brand-400" },
                    { label: "ROAS",          value: `${selPlan.roas}×`,          color: "text-green-400" },
                    { label: "Margem",        value: `${selPlan.margin}%`,         color: "text-sky-400" },
                    { label: "Dias activo",   value: `${selPlan.daysRunning}`,     color: "text-gray-300" },
                    { label: "Dias p/ meta",  value: `~${selPlan.projectedDays}`,  color: "text-amber-400" },
                    { label: "Plataformas",   value: `${selPlan.platforms.filter(p => p.active).length}`,  color: "text-purple-400" },
                  ].map((m) => (
                    <div key={m.label} className="p-3 rounded-lg bg-gray-800/40 border border-gray-700/50">
                      <p className="text-xs text-gray-500">{m.label}</p>
                      <p className={`text-xl font-bold mt-1 ${m.color}`}>{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* AI recommendation */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-brand-500/10 to-purple-500/10 border border-brand-500/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-brand-500/20">
                      <Zap className="w-4 h-4 text-brand-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-300">Recomendação AI</p>
                      <p className="text-sm text-gray-400 mt-1">
                        ROAS {selPlan.roas}× está acima de 3.5× há 7 dias. Escalar budget para{" "}
                        <strong className="text-white">£{Math.round(selPlan.currentBudget * 1.5)}/dia</strong> e testar{" "}
                        <strong className="text-white">EUA e Austrália</strong>. Potencial:{" "}
                        <strong className="text-green-400">+£{Math.round(selPlan.currentRevenue * 0.8).toLocaleString()}/mês</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Platforms Tab ── */}
            {activeTab === "platforms" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">Gerir plataformas de anúncios para <strong className="text-white">{selPlan.product}</strong></p>
                {(["tiktok", "meta", "google", "pinterest", "snapchat"] as const).map((pName) => {
                  const pl = selPlan.platforms.find(p => p.name === pName);
                  const cfg = PLATFORM_CONFIG[pName];
                  const isActive = pl?.active ?? false;
                  const status = pl?.status ?? "paused";
                  return (
                    <div key={pName} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isActive ? "border-gray-700 bg-gray-800/30" : "border-gray-800 opacity-60"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                          <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{cfg.label}</p>
                          <p className="text-xs text-gray-500">
                            {isActive
                              ? `£${pl?.budget ?? 0}/dia · ROAS ${pl?.roas?.toFixed(1) ?? 0}×`
                              : "Não activo"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isActive && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            status === "winning" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                            status === "testing" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                                   "bg-gray-700 text-gray-500"
                          }`}>
                            {status === "winning" ? "🏆 Winner" : status === "testing" ? "🧪 A testar" : "⏸ Pausado"}
                          </span>
                        )}
                        <button
                          onClick={() => handlePlatformToggle(pl ?? { name: pName, active: false, budget: 0, roas: 0, status: "paused" })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isActive
                              ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                              : "bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 border border-brand-500/30"
                          }`}
                        >
                          {isActive ? "Pausar" : "Activar"}
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-xs text-sky-300">
                  💡 <strong>Tip AI:</strong> Começar pelo TikTok, depois Meta quando ROAS &gt; 3×, depois Google Shopping.
                </div>
              </div>
            )}

            {/* ── Geos Tab ── */}
            {activeTab === "geos" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">Expansão geográfica para <strong className="text-white">{selPlan.product}</strong></p>
                {selPlan.geos.map((geo) => (
                  <div key={geo.country} className="flex items-center justify-between p-4 rounded-xl border border-gray-700 bg-gray-800/30">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{geo.flag}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{geo.country}</p>
                        <p className="text-xs text-gray-500">£{geo.budget}/dia · £{geo.revenue.toLocaleString()} receita</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        geo.status === "winning"     ? "bg-green-500/10 text-green-400 border-green-500/20" :
                        geo.status === "testing"     ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                       "bg-sky-500/10 text-sky-400 border-sky-500/20"
                      }`}>
                        {geo.status === "winning" ? "🏆 Winner" : geo.status === "testing" ? "🧪 Teste" : "🎯 Oportunidade"}
                      </span>
                      <span className={`text-sm font-bold ${geo.roas >= 4 ? "text-green-400" : geo.roas >= 2.5 ? "text-amber-400" : "text-red-400"}`}>
                        {geo.roas}×
                      </span>
                    </div>
                  </div>
                ))}
                {/* New geo opportunities */}
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-2">Mercados sugeridos pela IA:</p>
                  {[
                    { country: "Alemanha", flag: "🇩🇪", reason: "Baixa saturação, alto poder de compra" },
                    { country: "Canadá",   flag: "🇨🇦", reason: "Similar ao RU, custo de aquisição menor" },
                    { country: "Nova Zelândia", flag: "🇳🇿", reason: "Audiência virgem, mesmo criativo funciona" },
                  ].filter(g => !selPlan.geos.find(sg => sg.country === g.country)).map((geo) => (
                    <div key={geo.country} className="flex items-center justify-between p-3 rounded-lg border border-dashed border-gray-700 hover:border-brand-500/40 transition-colors mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{geo.flag}</span>
                        <div>
                          <p className="text-sm text-white">{geo.country}</p>
                          <p className="text-xs text-gray-500">{geo.reason}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toast.success(`🌍 Lançando em ${geo.country}...`)}
                        className="text-xs px-3 py-1 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 border border-brand-500/30 rounded-lg transition-colors"
                      >
                        Lançar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Scale Ladder Tab ── */}
            {activeTab === "ladder" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">Escada de crescimento — da validação à dominância</p>
                <div className="relative">
                  {SCALE_LADDER.map((step, i) => (
                    <div key={step.id} className="flex gap-4 pb-6 last:pb-0">
                      {/* Connector */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          step.done   ? "bg-green-500 text-white" :
                          step.active ? "bg-brand-500 text-white animate-pulse" :
                                        "bg-gray-800 text-gray-600 border border-gray-700"
                        }`}>
                          {step.done ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                        </div>
                        {i < SCALE_LADDER.length - 1 && (
                          <div className={`w-0.5 flex-1 mt-1 ${step.done ? "bg-green-500/50" : "bg-gray-700"}`} style={{ minHeight: 24 }} />
                        )}
                      </div>
                      {/* Content */}
                      <div className={`flex-1 p-4 rounded-xl border transition-all ${
                        step.active ? "border-brand-500/50 bg-brand-500/5" :
                        step.done   ? "border-green-500/20 bg-green-500/5 opacity-70" :
                                      "border-gray-800"
                      }`}
                        style={!step.active && !step.done ? { background: "var(--vc-card)" } : {}}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-semibold text-white">{step.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                          </div>
                          {step.active && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">
                              ▶ Actual
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <div>
                            <p className="text-xs text-gray-500">Budget</p>
                            <p className="text-sm font-medium text-white">£{step.targetBudget}/dia</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">ROAS Alvo</p>
                            <p className="text-sm font-medium text-amber-400">{step.expectedRoas}×</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Receita/Mês</p>
                            <p className="text-sm font-medium text-green-400">£{step.expectedRevenue.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
