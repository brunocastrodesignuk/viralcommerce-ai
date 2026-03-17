"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { campaignsApi, productsApi, analyticsApi, Campaign } from "@/lib/api";
import {
  Play, Pause, Zap, TrendingUp, DollarSign, BarChart2, X,
  ChevronDown, ExternalLink, CheckCircle2, Target, Sparkles, Plus, Copy,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { usePreferences, convertPrice, useT } from "@/store/preferences";

// ─── Constants ────────────────────────────────────────────────────────────────

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

const AD_NETWORKS = [
  {
    id: "tiktok_ads",
    label: "TikTok Ads",
    emoji: "🎵",
    color: "pink",
    description: "Maior alcance para produtos virais. CPM baixo e alta conversão.",
    setupUrl: "https://ads.tiktok.com/help/article/get-started-tiktok-for-business",
    tips: ["Vídeos curtos (15–30s) convertem melhor", "Use trending sounds", "Mostre o produto em uso real"],
    avgRoas: 4.9,
    avgCtr: 4.0,
    envKey: "TIKTOK_ADS_ACCESS_TOKEN",
    docsUrl: "https://ads.tiktok.com/marketing_api/docs?id=1738373164380162",
    steps: ["Acesse business.tiktok.com", "Crie uma conta de anunciante", "Vá em Assets → Events → Web Events", "Copie o Access Token"],
  },
  {
    id: "meta",
    label: "Meta Ads",
    emoji: "📘",
    color: "blue",
    description: "Facebook + Instagram. Segmentação precisa por interesse e comportamento.",
    setupUrl: "https://www.facebook.com/business/ads",
    tips: ["Carrossel funciona bem para produtos", "Reels têm alcance orgânico extra", "Retargeting é essencial"],
    avgRoas: 4.5,
    avgCtr: 3.0,
    envKey: "META_ACCESS_TOKEN",
    docsUrl: "https://developers.facebook.com/docs/marketing-api/get-started",
    steps: ["Acesse developers.facebook.com", "Crie um App do tipo Business", "Adicione o produto Marketing API", "Gere um Access Token permanente"],
  },
  {
    id: "google",
    label: "Google Ads",
    emoji: "🔍",
    color: "green",
    description: "Shopping + Search. Captura intenção de compra ativa.",
    setupUrl: "https://ads.google.com/home/how-it-works/",
    tips: ["Shopping Ads para produtos físicos", "Performance Max automatiza todo o funil", "Use palavras-chave de cauda longa"],
    avgRoas: 3.99,
    avgCtr: 3.0,
    envKey: "GOOGLE_ADS_DEVELOPER_TOKEN",
    docsUrl: "https://developers.google.com/google-ads/api/docs/get-started/introduction",
    steps: ["Acesse ads.google.com → Ferramentas → API Center", "Solicite um Developer Token", "Configure o OAuth2", "Use relatórios de Performance Max"],
  },
];

// ─── New Campaign Modal ───────────────────────────────────────────────────────

function NewCampaignModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [network, setNetwork] = useState<"meta" | "google" | "tiktok_ads">("tiktok_ads");
  const [budget, setBudget] = useState("50");
  const [productId, setProductId] = useState("");
  const { currency } = usePreferences();
  const t = useT();

  const { data: products } = useQuery({
    queryKey: ["products-for-campaign"],
    queryFn: () => productsApi.list({ limit: 50, sort_by: "viral_score" }).then((r) => r.data.items),
  });

  const selectedNet = AD_NETWORKS.find((n) => n.id === network)!;
  const impressions = Number(budget) * 220;
  const clicks = Math.round(Number(budget) * selectedNet.avgCtr * 10);
  const conversions = (Number(budget) * selectedNet.avgRoas * 0.08).toFixed(0);

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
      <div className="relative z-10 w-full max-w-xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <div>
            <h2 className="text-lg font-bold text-white">{t.campaigns.newCampaign}</h2>
            <p className="text-sm text-gray-400">Configure e lance sua campanha de anúncios</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Network selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Rede de Anúncios</label>
            <div className="grid grid-cols-3 gap-2">
              {AD_NETWORKS.map((net) => (
                <button
                  key={net.id}
                  type="button"
                  onClick={() => setNetwork(net.id as any)}
                  className={clsx(
                    "px-3 py-3 rounded-xl border text-xs font-medium transition-all text-center flex flex-col items-center gap-1",
                    network === net.id
                      ? "border-brand-500 bg-brand-500/20 text-brand-400"
                      : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                  )}
                >
                  <span className="text-lg">{net.emoji}</span>
                  <span>{net.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <p className="text-xs text-gray-400 mb-1.5">{selectedNet.description}</p>
              <ul className="space-y-1">
                {selectedNet.tips.map((tip) => (
                  <li key={tip} className="flex items-start gap-1.5 text-xs text-gray-500">
                    <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Campaign name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nome da Campanha <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Ex: Produto Viral ${selectedNet.emoji} ${selectedNet.label}`}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Product selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Produto (opcional)</label>
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
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Orçamento Diário</label>
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
              {[20, 50, 100, 200].map((usd) => (
                <button
                  key={usd}
                  type="button"
                  onClick={() => setBudget(String(usd))}
                  className={clsx(
                    "flex-1 py-1.5 rounded text-xs font-medium transition-colors border",
                    budget === String(usd)
                      ? "bg-brand-500/20 text-brand-400 border-brand-500/30"
                      : "bg-gray-800 text-gray-500 hover:text-gray-300 border-gray-700"
                  )}
                >
                  {convertPrice(usd, currency)}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated reach */}
          {Number(budget) >= 5 && (
            <div className="bg-gradient-to-br from-green-500/5 to-brand-500/5 border border-green-500/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-green-400" />
                Estimativa diária — {selectedNet.label}
              </p>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-sm font-bold text-white">{impressions.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Impressões</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-sky-400">{clicks.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Cliques</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-green-400">~{conversions}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Conversões</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-400">{selectedNet.avgRoas}x</p>
                  <p className="text-xs text-gray-500 mt-0.5">ROAS médio</p>
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
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : <Zap className="w-4 h-4" />}
              Criar Campanha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Platform Card ────────────────────────────────────────────────────────────

function PlatformCard({ net, campaigns }: { net: typeof AD_NETWORKS[0]; campaigns: Campaign[] }) {
  const { currency } = usePreferences();
  const netCampaigns = campaigns.filter((c) => c.network === net.id);
  const spend = netCampaigns.reduce((s, c) => s + (c.total_spend || 0), 0);
  const revenue = netCampaigns.reduce((s, c) => s + (c.total_revenue || 0), 0);
  const roas = spend > 0 ? revenue / spend : 0;
  const running = netCampaigns.filter((c) => c.status === "running").length;

  const borderMap: Record<string, string> = {
    pink: "border-pink-500/20 bg-pink-500/5",
    blue: "border-blue-500/20 bg-blue-500/5",
    green: "border-green-500/20 bg-green-500/5",
  };
  const valColor: Record<string, string> = {
    pink: "text-pink-400",
    blue: "text-blue-400",
    green: "text-green-400",
  };

  return (
    <div className={clsx("rounded-xl border p-4", borderMap[net.color])}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{net.emoji}</span>
          <span className="font-semibold text-white text-sm">{net.label}</span>
        </div>
        {running > 0 ? (
          <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            {running} ativa{running > 1 ? "s" : ""}
          </span>
        ) : (
          <span className="text-xs text-gray-600">Sem campanhas</span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-gray-500">Gasto</p>
          <p className={clsx("text-sm font-bold mt-0.5", valColor[net.color])}>
            {spend > 0 ? convertPrice(spend, currency) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Receita</p>
          <p className="text-sm font-bold text-white mt-0.5">
            {revenue > 0 ? convertPrice(revenue, currency) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">ROAS</p>
          <p className={clsx("text-sm font-bold mt-0.5",
            roas >= 2 ? "text-green-400" : roas > 0 ? "text-amber-400" : "text-gray-500"
          )}>
            {roas > 0 ? `${roas.toFixed(1)}x` : `~${net.avgRoas}x`}
          </p>
        </div>
      </div>
      <a
        href={net.setupUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 mt-3 transition-colors"
      >
        <ExternalLink className="w-3 h-3" />
        Abrir painel {net.label}
      </a>
    </div>
  );
}

// ─── Campaigns Page ───────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"campaigns" | "performance">("campaigns");
  const qc = useQueryClient();
  const { currency } = usePreferences();
  const t = useT();

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => campaignsApi.list().then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: adPerf = [] } = useQuery({
    queryKey: ["ad-performance"],
    queryFn: () => analyticsApi.getAdPerformance(),
  });

  const launchMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.launch(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns"] }); toast.success("Campanha lançada!"); },
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns"] }); toast("Campanha pausada"); },
  });

  const typedCampaigns = campaigns as Campaign[];
  const totalSpend = typedCampaigns.reduce((s, c) => s + (c.total_spend || 0), 0);
  const totalRevenue = typedCampaigns.reduce((s, c) => s + (c.total_revenue || 0), 0);
  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const running = typedCampaigns.filter((c) => c.status === "running").length;

  // Estimated ROAS shown when no real campaign data exists yet
  const estimatedRoas = AD_NETWORKS.reduce((s, n) => s + n.avgRoas, 0) / AD_NETWORKS.length;

  return (
    <>
      {showModal && (
        <NewCampaignModal
          onClose={() => setShowModal(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ["campaigns"] })}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t.campaigns.title}</h1>
            <p className="text-sm text-gray-400">{t.campaigns.subtitle}</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t.campaigns.newCampaign}
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Campanhas ativas", value: running, icon: <Play className="w-4 h-4 text-green-400" />, color: "text-green-400" },
            { label: "Gasto total", value: convertPrice(totalSpend, currency), icon: <DollarSign className="w-4 h-4 text-brand-400" />, color: "text-brand-400" },
            { label: "Receita total", value: convertPrice(totalRevenue, currency), icon: <TrendingUp className="w-4 h-4 text-purple-400" />, color: "text-purple-400" },
            { label: "ROAS médio", value: avgRoas > 0 ? `${avgRoas.toFixed(1)}x` : `~${estimatedRoas.toFixed(1)}x`, icon: <BarChart2 className="w-4 h-4 text-amber-400" />, color: "text-amber-400" },
          ].map((s) => (
            <div key={s.label} className="card">
              <div className="flex items-center gap-2 mb-2">
                {s.icon}
                <span className="text-xs text-gray-500">{s.label}</span>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Platform overview cards */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Plataformas de Anúncio</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AD_NETWORKS.map((net) => (
              <PlatformCard key={net.id} net={net} campaigns={typedCampaigns} />
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1 w-fit">
          {[
            { id: "campaigns", label: "Minhas Campanhas" },
            { id: "performance", label: "Performance & Integração" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === tab.id ? "bg-gray-700 text-white" : "text-gray-400 hover:text-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: My Campaigns */}
        {activeTab === "campaigns" && (
          <div className="card">
            {!isLoading && !typedCampaigns.length ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <Zap className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-lg font-medium text-gray-400">{t.campaigns.noCampaigns}</p>
                <p className="text-sm mt-1 mb-4 text-gray-600">Clique em "{t.campaigns.newCampaign}" para começar</p>
                <button onClick={() => setShowModal(true)} className="btn-primary text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {t.campaigns.createFirst}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
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
                          <tr key={i}>{[...Array(8)].map((_, j) => (
                            <td key={j} className="py-3 pr-4"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td>
                          ))}</tr>
                        ))
                      : typedCampaigns.map((c) => {
                          const netInfo = AD_NETWORKS.find((n) => n.id === c.network);
                          // Prefer API roas; fall back to revenue/spend ratio
                          const campaignRoas = c.roas != null
                            ? c.roas
                            : (c.total_spend ?? 0) > 0
                              ? (c.total_revenue ?? 0) / (c.total_spend ?? 1)
                              : null;
                          return (
                            <tr key={c.id} className="hover:bg-gray-800/50 transition-colors">
                              <td className="py-3 pr-4">
                                <p className="text-sm font-medium text-gray-100">{c.name}</p>
                              </td>
                              <td className="py-3 pr-4">
                                <span className="text-xs text-gray-400">
                                  {netInfo?.emoji} {netInfo?.label || c.network}
                                </span>
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
                                <span className={clsx("text-sm font-bold",
                                  (campaignRoas ?? 0) >= 2 ? "text-green-400" : (campaignRoas ?? 0) >= 1 ? "text-amber-400" : "text-gray-500"
                                )}>
                                  {campaignRoas != null ? `${campaignRoas.toFixed(1)}x` : `~${netInfo?.avgRoas ?? "—"}x`}
                                </span>
                              </td>
                              <td className="py-3 pr-4">
                                <div className="flex gap-2">
                                  {c.status === "draft" && (
                                    <button
                                      onClick={() => launchMutation.mutate(c.id)}
                                      disabled={launchMutation.isPending}
                                      title="Lançar"
                                      className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors"
                                    >
                                      <Play className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {c.status === "running" && (
                                    <>
                                      <button
                                        onClick={() => optimizeMutation.mutate(c.id)}
                                        title="Otimizar com IA"
                                        className="p-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-lg transition-colors"
                                      >
                                        <Sparkles className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => pauseMutation.mutate(c.id)}
                                        title="Pausar"
                                        className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors"
                                      >
                                        <Pause className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab: Performance & Integration */}
        {activeTab === "performance" && (
          <div className="space-y-6">
            {/* Ad performance table */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white">Performance Acumulada por Rede</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Dados de todas as campanhas ativas</p>
                </div>
                <span className="text-xs text-gray-600 bg-gray-800 px-2 py-1 rounded-md">
                  Dados demo — conecte sua API key para dados reais
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px]">
                  <thead>
                    <tr className="text-left border-b border-gray-800">
                      {["Rede", "Impressões", "Cliques", "Conversões", "Gasto", "Receita", "ROAS", "CTR"].map((h) => (
                        <th key={h} className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(adPerf as any[]).map((row: any) => {
                      const netInfo = AD_NETWORKS.find((n) => n.id === row.network);
                      return (
                        <tr key={row.network} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <span>{netInfo?.emoji || "📊"}</span>
                              <span className="text-sm font-medium text-gray-200">{netInfo?.label || row.network}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-sm text-gray-300">{(row.impressions || 0).toLocaleString()}</td>
                          <td className="py-3 pr-4 text-sm text-sky-400">{(row.clicks || 0).toLocaleString()}</td>
                          <td className="py-3 pr-4 text-sm text-green-400">{(row.conversions || 0).toLocaleString()}</td>
                          <td className="py-3 pr-4 text-sm text-gray-300">${(row.spend || 0).toLocaleString()}</td>
                          <td className="py-3 pr-4 text-sm text-white">${(row.revenue || 0).toLocaleString()}</td>
                          <td className="py-3 pr-4">
                            <span className={clsx("text-sm font-bold",
                              row.avg_roas >= 4 ? "text-green-400" : row.avg_roas >= 2 ? "text-amber-400" : "text-red-400"
                            )}>
                              {row.avg_roas?.toFixed(1)}x
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-sm text-gray-500">{row.ctr_pct?.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Setup guides */}
            <div className="card">
              <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-400" />
                Como conectar APIs de anúncios
              </h3>
              <p className="text-xs text-gray-500 mb-5">
                Adicione as variáveis abaixo no arquivo <code className="text-amber-400">.env</code> do backend para ativar integração real.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {AD_NETWORKS.map((platform) => {
                  const borderMap: Record<string, string> = {
                    pink: "border-pink-500/20 bg-pink-500/5",
                    blue: "border-blue-500/20 bg-blue-500/5",
                    green: "border-green-500/20 bg-green-500/5",
                  };
                  const textMap: Record<string, string> = {
                    pink: "text-pink-400",
                    blue: "text-blue-400",
                    green: "text-green-400",
                  };
                  return (
                    <div key={platform.id} className={clsx("rounded-xl border p-4", borderMap[platform.color])}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{platform.emoji}</span>
                        <span className={clsx("font-semibold text-sm", textMap[platform.color])}>{platform.label}</span>
                      </div>
                      <ol className="space-y-1.5 mb-3">
                        {platform.steps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                            <span className="text-gray-600 font-mono shrink-0">{i + 1}.</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                      <p className="text-xs text-gray-500 mb-1">Variável no .env:</p>
                      <button
                        onClick={() => { navigator.clipboard.writeText(platform.envKey); toast.success("Copiado!"); }}
                        className="w-full text-left text-xs bg-gray-900 px-2 py-1.5 rounded text-amber-300 hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                      >
                        <Copy className="w-3 h-3 shrink-0" />
                        {platform.envKey}
                      </button>
                      <a
                        href={platform.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={clsx("inline-flex items-center gap-1 text-xs mt-2 hover:underline", textMap[platform.color])}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Documentação oficial
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
