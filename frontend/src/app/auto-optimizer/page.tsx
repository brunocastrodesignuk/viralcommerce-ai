"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Zap, TrendingUp, TrendingDown, Target, DollarSign,
  Play, Pause, Trash2, BarChart3, AlertCircle, CheckCircle2,
  RefreshCw, Settings, Clock, ArrowUpRight, ArrowDownRight,
  Loader2, PlusCircle, Eye,
} from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { usePreferences, convertPrice } from "@/store/preferences";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdRule {
  id: string;
  name: string;
  condition: "roas_below" | "roas_above" | "cpa_above" | "budget_spent";
  threshold: number;
  action: "pause" | "kill" | "double_budget" | "scale_50" | "alert";
  status: "active" | "paused";
  triggeredCount: number;
  lastTriggered?: string;
}

interface SimulatedCampaign {
  id: string;
  name: string;
  product: string;
  platform: "meta" | "tiktok" | "google";
  budget: number;
  spent: number;
  revenue: number;
  roas: number;
  cpa: number;
  conversions: number;
  status: "active" | "paused" | "killed" | "scaled";
  signal: "kill" | "test" | "scale" | "winner";
  trend: "up" | "down" | "stable";
}

// ─── Demo data (simulated campaigns) ──────────────────────────────────────────
const DEMO_CAMPAIGNS: SimulatedCampaign[] = [
  { id: "c1", name: "Massageador TikTok #1", product: "Massageador Elétrico", platform: "tiktok", budget: 50, spent: 38.50, revenue: 187.20, roas: 4.86, cpa: 12.83, conversions: 3, status: "active", signal: "winner", trend: "up" },
  { id: "c2", name: "Skincare Meta FB", product: "Sérum Vitamina C", platform: "meta", budget: 30, spent: 30.00, revenue: 42.00, roas: 1.40, cpa: 30.00, conversions: 1, status: "active", signal: "test", trend: "down" },
  { id: "c3", name: "Gadget Google Shopping", product: "Mini Projetor LED", platform: "google", budget: 20, spent: 18.70, revenue: 8.20, roas: 0.44, cpa: 0, conversions: 0, status: "active", signal: "kill", trend: "down" },
  { id: "c4", name: "Fitness TikTok #2", product: "Banda Elástica Set", platform: "tiktok", budget: 40, spent: 22.10, revenue: 88.40, roas: 4.00, cpa: 11.05, conversions: 2, status: "scaled", signal: "scale", trend: "up" },
  { id: "c5", name: "Home Decor Meta", product: "Luminária LED Neon", platform: "meta", budget: 25, spent: 25.00, revenue: 62.50, roas: 2.50, cpa: 12.50, conversions: 2, status: "active", signal: "scale", trend: "stable" },
  { id: "c6", name: "Beauty Instagram", product: "Máscara Capilar Pro", platform: "meta", budget: 35, spent: 7.40, revenue: 3.10, roas: 0.42, cpa: 0, conversions: 0, status: "killed", signal: "kill", trend: "down" },
];

const DEFAULT_RULES: AdRule[] = [
  { id: "r1", name: "Kill se ROAS < 0.8 após £10", condition: "roas_below", threshold: 0.8, action: "kill", status: "active", triggeredCount: 2 },
  { id: "r2", name: "Dobrar budget se ROAS > 3.5", condition: "roas_above", threshold: 3.5, action: "double_budget", status: "active", triggeredCount: 1, lastTriggered: "há 2h" },
  { id: "r3", name: "Pausar se CPA > £25", condition: "cpa_above", threshold: 25, action: "pause", status: "active", triggeredCount: 0 },
  { id: "r4", name: "Alerta se ROAS < 1.5", condition: "roas_below", threshold: 1.5, action: "alert", status: "active", triggeredCount: 3, lastTriggered: "há 45min" },
];

// ─── Components ───────────────────────────────────────────────────────────────
const PLATFORM_BADGE: Record<string, string> = {
  meta:   "bg-blue-500/20 text-blue-400",
  tiktok: "bg-pink-500/20 text-pink-400",
  google: "bg-amber-500/20 text-amber-400",
};

const SIGNAL_CONFIG = {
  kill:   { color: "text-red-400",   bg: "bg-red-500/10",   border: "border-red-500/30",   label: "❌ MATAR",   action: "kill" },
  test:   { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "🧪 TESTAR",  action: "test" },
  scale:  { color: "text-sky-400",   bg: "bg-sky-500/10",   border: "border-sky-500/30",   label: "📈 ESCALAR", action: "scale" },
  winner: { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30", label: "🏆 WINNER",  action: "winner" },
};

function CampaignRow({
  c, onAction,
}: {
  c: SimulatedCampaign;
  onAction: (id: string, action: string) => void;
}) {
  const sig = SIGNAL_CONFIG[c.signal];
  return (
    <tr className={`border-b border-gray-800 hover:bg-gray-800/40 transition-colors ${
      c.status === "killed" ? "opacity-50" : ""
    }`}>
      <td className="py-3 px-4">
        <div>
          <p className="text-sm text-white font-medium">{c.name}</p>
          <p className="text-xs text-gray-500">{c.product}</p>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATFORM_BADGE[c.platform]}`}>
          {c.platform === "meta" ? "Meta" : c.platform === "tiktok" ? "TikTok" : "Google"}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="text-sm">
          <span className="text-gray-400">£{c.spent.toFixed(0)}</span>
          <span className="text-gray-600"> / £{c.budget}</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1 mt-1">
          <div
            className="h-full rounded-full bg-brand-500"
            style={{ width: `${Math.min((c.spent / c.budget) * 100, 100)}%` }}
          />
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          <span className={`text-sm font-bold ${
            c.roas >= 3 ? "text-green-400" : c.roas >= 1.5 ? "text-amber-400" : "text-red-400"
          }`}>
            {c.roas.toFixed(2)}×
          </span>
          {c.trend === "up" ? (
            <ArrowUpRight className="w-3.5 h-3.5 text-green-400" />
          ) : c.trend === "down" ? (
            <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
          ) : null}
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${sig.bg} ${sig.border} ${sig.color}`}>
          {sig.label}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          {c.status !== "killed" && c.signal === "kill" && (
            <button
              onClick={() => onAction(c.id, "kill")}
              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
              title="Matar anúncio"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {c.signal === "scale" || c.signal === "winner" ? (
            <button
              onClick={() => onAction(c.id, "scale")}
              className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors"
              title="Escalar budget"
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
          ) : null}
          <button
            onClick={() => onAction(c.id, "view")}
            className="p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-400 rounded-lg transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AutoOptimizerPage() {
  const [campaigns, setCampaigns] = useState<SimulatedCampaign[]>(DEMO_CAMPAIGNS);
  const [rules, setRules] = useState<AdRule[]>(DEFAULT_RULES);
  const [autoMode, setAutoMode] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);

  // New rule form
  const [newRule, setNewRule] = useState({
    name: "",
    condition: "roas_below" as AdRule["condition"],
    threshold: 0.8,
    action: "kill" as AdRule["action"],
  });

  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const avgRoas = totalSpent > 0 ? totalRevenue / totalSpent : 0;
  const killCount = campaigns.filter((c) => c.signal === "kill").length;
  const winnerCount = campaigns.filter((c) => c.signal === "winner").length;

  const handleAction = (id: string, action: string) => {
    if (action === "kill") {
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "killed" as const } : c))
      );
      toast.success("❌ Anúncio desativado — budget salvo!");
    } else if (action === "scale") {
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, budget: c.budget * 2, status: "scaled" as const } : c
        )
      );
      toast.success("🚀 Budget duplicado! Escalonando winner...");
    } else if (action === "view") {
      toast("Integração Meta/TikTok necessária para visualizar dados reais", { icon: "ℹ️" });
    }
  };

  const runOptimizer = async () => {
    setOptimizing(true);
    await new Promise((r) => setTimeout(r, 2000));

    const killed: string[] = [];
    const scaled: string[] = [];

    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.signal === "kill" && c.status === "active") {
          killed.push(c.name);
          return { ...c, status: "killed" as const };
        }
        if (c.signal === "winner" && c.status === "active") {
          scaled.push(c.name);
          return { ...c, budget: c.budget * 2, status: "scaled" as const };
        }
        return c;
      })
    );

    setOptimizing(false);

    if (killed.length) toast.success(`❌ ${killed.length} anúncios mortos: ${killed.join(", ")}`);
    if (scaled.length) toast.success(`🚀 ${scaled.length} winners escalados!`);
    if (!killed.length && !scaled.length) toast("Nada a otimizar — tudo está ok!", { icon: "✅" });
  };

  const addRule = () => {
    if (!newRule.name.trim()) return toast.error("Nome da regra obrigatório");
    setRules((prev) => [
      ...prev,
      { ...newRule, id: Date.now().toString(), status: "active", triggeredCount: 0 },
    ]);
    setShowRuleForm(false);
    setNewRule({ name: "", condition: "roas_below", threshold: 0.8, action: "kill" });
    toast.success("Regra criada!");
  };

  const ACTION_LABELS: Record<AdRule["action"], string> = {
    kill:          "❌ Matar",
    pause:         "⏸️ Pausar",
    double_budget: "💰 Dobrar Budget",
    scale_50:      "📈 +50% Budget",
    alert:         "🔔 Alerta",
  };

  const CONDITION_LABELS: Record<AdRule["condition"], string> = {
    roas_below:    "ROAS abaixo de",
    roas_above:    "ROAS acima de",
    cpa_above:     "CPA acima de",
    budget_spent:  "Budget gasto > %",
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            Auto-Optimizer
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Mata anúncios ruins e escala winners automaticamente — sem cliques manuais
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Modo Auto</span>
            <button
              onClick={() => {
                setAutoMode(!autoMode);
                toast(autoMode ? "Modo auto desativado" : "Modo auto ATIVADO — otimizando a cada 6h", {
                  icon: autoMode ? "⏸️" : "🤖",
                });
              }}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                autoMode ? "bg-green-500" : "bg-gray-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  autoMode ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
          <button
            onClick={runOptimizer}
            disabled={optimizing}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {optimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Otimizar Agora
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "ROAS Médio", value: `${avgRoas.toFixed(2)}×`, color: avgRoas >= 2.5 ? "text-green-400" : "text-amber-400", icon: TrendingUp },
          { label: "Total Gasto", value: `£${totalSpent.toFixed(0)}`, color: "text-white", icon: DollarSign },
          { label: "Total Receita", value: `£${totalRevenue.toFixed(0)}`, color: "text-green-400", icon: BarChart3 },
          { label: "Para Matar", value: killCount, color: "text-red-400", icon: Trash2 },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">{label}</p>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Strategy Card */}
      <div className="card bg-gray-800/30 border border-brand-500/20">
        <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-brand-400" />
          Regra de Ouro — A Estratégia do £100 → £1M
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 font-semibold mb-1">❌ MATAR</p>
            <p className="text-gray-400">ROAS &lt; 0.8 após £10 gasto</p>
            <p className="text-gray-600 text-xs mt-1">Sem misericórdia. Salva budget para winners.</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
            <p className="text-amber-400 font-semibold mb-1">🧪 TESTAR</p>
            <p className="text-gray-400">ROAS 0.8–2.5 | Aguardar dados</p>
            <p className="text-gray-600 text-xs mt-1">Manter £5–10/dia, otimizar criativo.</p>
          </div>
          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
            <p className="text-green-400 font-semibold mb-1">🚀 ESCALAR</p>
            <p className="text-gray-400">ROAS &gt; 2.5 por 3 dias seguidos</p>
            <p className="text-gray-600 text-xs mt-1">Dobrar budget. Depois £100 → £500 → £1k/dia.</p>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-300">
            Campanhas Ativas ({campaigns.filter((c) => c.status !== "killed").length})
          </h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" /> {winnerCount} winners
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" /> {killCount} para matar
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-600 border-b border-gray-800">
                <th className="text-left py-3 px-4">Campanha</th>
                <th className="text-left py-3 px-4">Plataforma</th>
                <th className="text-left py-3 px-4">Budget</th>
                <th className="text-left py-3 px-4">ROAS</th>
                <th className="text-left py-3 px-4">Sinal</th>
                <th className="text-left py-3 px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <CampaignRow key={c.id} c={c} onAction={handleAction} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rules Engine */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-400" />
            Regras de Automação
          </h2>
          <button
            onClick={() => setShowRuleForm(!showRuleForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-medium transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Nova Regra
          </button>
        </div>

        {showRuleForm && (
          <div className="mb-4 p-4 bg-gray-800/60 rounded-xl border border-gray-700 space-y-3">
            <p className="text-xs text-gray-400 font-semibold">Nova Regra de Automação</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-gray-500">Nome</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="ex: Kill ROAS baixo"
                  className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Condição</label>
                <select
                  value={newRule.condition}
                  onChange={(e) => setNewRule({ ...newRule, condition: e.target.value as AdRule["condition"] })}
                  className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Threshold</label>
                <input
                  type="number"
                  value={newRule.threshold}
                  onChange={(e) => setNewRule({ ...newRule, threshold: parseFloat(e.target.value) })}
                  step="0.1"
                  className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Ação</label>
                <select
                  value={newRule.action}
                  onChange={(e) => setNewRule({ ...newRule, action: e.target.value as AdRule["action"] })}
                  className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  {Object.entries(ACTION_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={addRule}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium"
              >
                Salvar Regra
              </button>
              <button
                onClick={() => setShowRuleForm(false)}
                className="px-4 py-1.5 bg-gray-700 text-gray-400 rounded-lg text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${rule.status === "active" ? "bg-green-400" : "bg-gray-600"}`} />
                <div>
                  <p className="text-sm text-white">{rule.name}</p>
                  <p className="text-xs text-gray-500">
                    {CONDITION_LABELS[rule.condition]} {rule.threshold} → {ACTION_LABELS[rule.action]}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {rule.triggeredCount > 0 && (
                  <span className="text-xs text-gray-500">
                    Ativou {rule.triggeredCount}× {rule.lastTriggered ? `(${rule.lastTriggered})` : ""}
                  </span>
                )}
                <button
                  onClick={() =>
                    setRules((prev) =>
                      prev.map((r) =>
                        r.id === rule.id
                          ? { ...r, status: r.status === "active" ? "paused" : "active" }
                          : r
                      )
                    )
                  }
                  className={`p-1.5 rounded-lg transition-colors ${
                    rule.status === "active"
                      ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      : "bg-gray-700 text-gray-500 hover:bg-gray-600"
                  }`}
                >
                  {rule.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
