"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { campaignsApi, productsApi, Campaign } from "@/lib/api";
import { Play, Pause, Zap, TrendingUp, DollarSign, BarChart2, X, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { usePreferences, convertPrice } from "@/store/preferences";

const STATUS_COLORS: Record<string, string> = {
  draft:     "bg-gray-500/20 text-gray-400",
  running:   "bg-green-500/20 text-green-400",
  paused:    "bg-amber-500/20 text-amber-400",
  completed: "bg-brand-500/20 text-brand-400",
  killed:    "bg-red-500/20 text-red-400",
};

const STATUS_PT: Record<string, string> = {
  draft: "Rascunho", running: "Rodando", paused: "Pausada",
  completed: "Concluída", killed: "Encerrada",
};

const NETWORK_LABELS: Record<string, string> = {
  meta: "Meta Ads (Facebook/Instagram)",
  google: "Google Ads",
  tiktok_ads: "TikTok Ads",
};

// ─── New Campaign Modal ──────────────────────────────────────────────────────

function NewCampaignModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [network, setNetwork] = useState<"meta" | "google" | "tiktok_ads">("tiktok_ads");
  const [budget, setBudget] = useState("50");
  const [productId, setProductId] = useState("");
  const { currency } = usePreferences();

  const { data: products } = useQuery({
    queryKey: ["products-for-campaign"],
    queryFn: () => productsApi.list({ limit: 50, sort_by: "viral_score" }).then((r) => r.data.items),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      campaignsApi.create({
        name,
        network,
        daily_budget: Number(budget),
        product_id: productId || undefined,
        status: "draft",
      } as any),
    onSuccess: () => {
      toast.success("Campanha criada com sucesso!");
      onCreated();
      onClose();
    },
    onError: () => toast.error("Erro ao criar campanha"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Informe o nome da campanha"); return; }
    if (Number(budget) < 5) { toast.error("Orçamento mínimo: USD 5/dia"); return; }
    createMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-white">Nova Campanha</h2>
            <p className="text-sm text-gray-400">Configure e lance sua campanha de anúncios</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Campaign name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nome da Campanha <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Óculos Anti-Azul TikTok"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Network */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Rede de Anúncios
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["tiktok_ads", "meta", "google"] as const).map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setNetwork(net)}
                  className={clsx(
                    "px-3 py-2.5 rounded-lg border text-xs font-medium transition-all text-center",
                    network === net
                      ? "border-brand-500 bg-brand-500/20 text-brand-400"
                      : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                  )}
                >
                  {net === "tiktok_ads" ? "🎵 TikTok Ads" : net === "meta" ? "📘 Meta Ads" : "🔍 Google Ads"}
                </button>
              ))}
            </div>
          </div>

          {/* Product selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Produto (opcional)
            </label>
            <div className="relative">
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-brand-500 appearance-none pr-10 transition-colors"
              >
                <option value="">Selecionar produto...</option>
                {(products as any[])?.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — Viral {Math.round(p.viral_score)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Daily budget */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Orçamento Diário (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
              <input
                type="number"
                min="5"
                max="10000"
                step="5"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full pl-7 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[["20", 20], ["50", 50], ["100", 100], ["200", 200]].map(([v, usd]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setBudget(String(v))}
                  className={clsx(
                    "px-3 py-1 rounded text-xs font-medium transition-colors",
                    budget === String(v) ? "bg-brand-500/20 text-brand-400 border border-brand-500/30" : "bg-gray-800 text-gray-500 hover:text-gray-300"
                  )}
                >
                  {convertPrice(Number(usd), currency)}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated reach */}
          {Number(budget) >= 5 && (
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Estimativa de Alcance</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-sm font-bold text-white">
                    {(Number(budget) * 220).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Impressões/dia</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-green-400">
                    {(Number(budget) * 8).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Cliques/dia</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-sky-400">
                    ~{(Number(budget) * 0.32).toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500">Conversões/dia</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Criar Campanha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Campaigns Page ──────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();
  const { currency } = usePreferences();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => campaignsApi.list().then((r) => r.data),
    refetchInterval: 30000,
  });

  const launchMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.launch(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campanha lançada!");
    },
  });

  const optimizeMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.optimize(id),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      const d = data.data;
      toast.success(`Otimizado: ${d.ads_killed} encerrados, ${d.ads_scaled} escalados`);
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.pause(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast("Campanha pausada");
    },
  });

  return (
    <>
      {showModal && (
        <NewCampaignModal
          onClose={() => setShowModal(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ["campaigns"] })}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Campanhas de Anúncios</h1>
            <p className="text-sm text-gray-400">Otimização automatizada de campanhas</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Nova Campanha
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: "Ativas",
              value: campaigns?.filter((c: Campaign) => c.status === "running").length ?? 0,
              icon: <Play className="w-4 h-4 text-green-400" />,
              color: "text-green-400",
            },
            {
              label: "Gasto Total",
              value: convertPrice(campaigns?.reduce((s: number, c: Campaign) => s + (c.total_spend || 0), 0) ?? 0, currency),
              icon: <DollarSign className="w-4 h-4 text-brand-400" />,
              color: "text-brand-400",
            },
            {
              label: "Receita Total",
              value: convertPrice(campaigns?.reduce((s: number, c: Campaign) => s + (c.total_revenue || 0), 0) ?? 0, currency),
              icon: <TrendingUp className="w-4 h-4 text-purple-400" />,
              color: "text-purple-400",
            },
            {
              label: "ROAS Médio",
              value: `${(campaigns?.reduce((s: number, c: Campaign) => s + (c.roas || 0), 0) / (campaigns?.length || 1)).toFixed(1) ?? 0}x`,
              icon: <BarChart2 className="w-4 h-4 text-amber-400" />,
              color: "text-amber-400",
            },
          ].map((stat) => (
            <div key={stat.label} className="card">
              <div className="flex items-center gap-2 mb-2">
                {stat.icon}
                <span className="text-xs text-gray-500">{stat.label}</span>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Campaign Table */}
        <div className="card">
          {!isLoading && (!campaigns || campaigns.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-600">
              <Zap className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-lg font-medium text-gray-400">Nenhuma campanha ainda</p>
              <p className="text-sm mt-1 text-gray-600">Clique em "Nova Campanha" para começar</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 btn-primary text-sm flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Criar Primeira Campanha
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-800">
                  {["Campanha", "Rede", "Status", "Orçamento/dia", "Gasto", "Receita", "ROAS", "Ações"].map((h) => (
                    <th key={h} className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {isLoading
                  ? [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(8)].map((_, j) => (
                          <td key={j} className="py-3 pr-4">
                            <div className="h-4 bg-gray-800 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : campaigns?.map((c: Campaign) => (
                      <tr key={c.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="py-3 pr-4">
                          <p className="text-sm font-medium text-gray-100">{c.name}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-xs text-gray-400 capitalize">{c.network.replace("_", " ")}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={clsx("badge text-xs", STATUS_COLORS[c.status] ?? "bg-gray-700 text-gray-400")}>
                            {STATUS_PT[c.status] ?? c.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-300">{convertPrice(c.daily_budget ?? 0, currency)}</td>
                        <td className="py-3 pr-4 text-sm text-gray-300">{convertPrice(c.total_spend ?? 0, currency)}</td>
                        <td className="py-3 pr-4 text-sm text-green-400">{convertPrice(c.total_revenue ?? 0, currency)}</td>
                        <td className="py-3 pr-4">
                          <span className={clsx("text-sm font-bold", c.roas >= 2 ? "text-green-400" : c.roas >= 1 ? "text-amber-400" : "text-red-400")}>
                            {c.roas?.toFixed(1) ?? "—"}x
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex gap-2">
                            {c.status === "draft" && (
                              <button
                                onClick={() => launchMutation.mutate(c.id)}
                                disabled={launchMutation.isPending}
                                className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors"
                                title="Lançar"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {c.status === "running" && (
                              <>
                                <button
                                  onClick={() => optimizeMutation.mutate(c.id)}
                                  className="p-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-lg transition-colors"
                                  title="Otimizar"
                                >
                                  <Zap className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => pauseMutation.mutate(c.id)}
                                  className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors"
                                  title="Pausar"
                                >
                                  <Pause className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
