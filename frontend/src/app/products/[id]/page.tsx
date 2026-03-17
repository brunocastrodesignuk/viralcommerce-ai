"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api, productsApi } from "@/lib/api";
import {
  TrendingUp, DollarSign, ShoppingBag, Zap, Star,
  ExternalLink, ArrowLeft, Globe, Users, Eye,
  BarChart2, Package, CheckCircle, Copy, Flame, Bookmark,
} from "lucide-react";
import toast from "react-hot-toast";
import { ViralTimeline } from "@/components/charts/ViralTimeline";
import { usePreferences, convertPrice } from "@/store/preferences";
import { useWatchlist } from "@/store/watchlist";
import { useState } from "react";

// ─── API ──────────────────────────────────────────────────────────────────

const fetchAnalysis = (id: string) =>
  api.get(`/products/${id}/analysis`).then((r) => r.data);

// ─── Sub-components ───────────────────────────────────────────────────────

function ScoreBar({ label, value, color = "sky" }: { label: string; value: number; color?: string }) {
  const colorMap: Record<string, string> = {
    sky:    "bg-sky-500",
    green:  "bg-green-500",
    purple: "bg-purple-500",
    red:    "bg-red-500",
    amber:  "bg-amber-500",
  };
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-semibold">{Math.round(value)}/100</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorMap[color] || colorMap.sky}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: {
  icon: any; label: string; value: string | number; sub?: string;
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-sky-400" />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const copy = () => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };
  return (
    <button
      onClick={copy}
      className="p-1.5 text-gray-500 hover:text-sky-400 hover:bg-sky-500/10 rounded transition-colors"
      title={`Copiar ${label}`}
    >
      <Copy className="w-3.5 h-3.5" />
    </button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function ProductAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currency } = usePreferences();
  const watchlist = useWatchlist();
  const [quantity, setQuantity] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product-analysis", id],
    queryFn: () => fetchAnalysis(id),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const { data: viralHistoryData } = useQuery({
    queryKey: ["product-viral-history", id],
    queryFn: () => productsApi.viralHistory(id, 30).then((r) => r.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gray-800 rounded animate-pulse" />
          <div className="h-8 w-64 bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-gray-800" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-64 animate-pulse bg-gray-800" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Package className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">Produto não encontrado ou erro ao carregar análise.</p>
        <button onClick={() => router.back()} className="mt-3 text-sky-400 text-sm hover:text-sky-300">
          ← Voltar
        </button>
      </div>
    );
  }

  const { product, viral_breakdown, market_data, competition, suppliers, marketing_assets, profit_analysis, viral_timeline } = data;

  const trendLabel = viral_breakdown?.trend_trajectory === "rising"
    ? "📈 Em Alta"
    : viral_breakdown?.trend_trajectory === "peak"
    ? "🚀 No Pico"
    : "📊 Estável";

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Produtos
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            {product.image_urls?.[0] ? (
              <img
                src={product.image_urls[0]}
                alt={product.name}
                className="w-16 h-16 rounded-xl object-cover border border-gray-800"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-gray-600" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full">
                  {product.category}
                </span>
                <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
                  {trendLabel}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <h1 className="text-xl font-bold text-white leading-tight max-w-lg">
                  {product.name}
                </h1>
                <button
                  onClick={() => {
                    watchlist.toggle(product.id);
                    if (watchlist.has(product.id)) {
                      toast("Removido dos favoritos", { icon: "🗑️" });
                    } else {
                      toast.success("Adicionado aos favoritos!");
                    }
                  }}
                  className={`flex-shrink-0 p-1.5 rounded-lg border transition-colors mt-0.5 ${
                    watchlist.has(product.id)
                      ? "bg-sky-500/20 border-sky-500/40 text-sky-400"
                      : "bg-gray-800 border-gray-700 text-gray-500 hover:text-sky-400 hover:border-sky-500/40"
                  }`}
                  title={watchlist.has(product.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  <Bookmark className={`w-4 h-4 ${watchlist.has(product.id) ? "fill-current" : ""}`} />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Flame className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-red-400">
                  Viral Score: {product.viral_score}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-sm text-gray-400">
                  {convertPrice(product.estimated_price_min ?? 0, currency)} – {convertPrice(product.estimated_price_max ?? 0, currency)} custo fornecedor
                </span>
              </div>
            </div>
          </div>

          <a
            href={`https://www.tiktok.com/search?q=${encodeURIComponent(product.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-black border border-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors"
          >
            <span>🎵</span>
            Ver no TikTok
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Viral Score"
          value={product.viral_score}
          sub={`${viral_breakdown?.tiktok_engagement?.toFixed(1)} TikTok Engagement`}
        />
        <StatCard
          icon={Eye}
          label="Views TikTok (Total)"
          value={`${((market_data?.total_tiktok_views || 0) / 1_000_000).toFixed(1)}M`}
          sub={`${(market_data?.tiktok_videos || 0).toLocaleString()} vídeos`}
        />
        <StatCard
          icon={DollarSign}
          label="Mercado Mensal"
          value={convertPrice(market_data?.market_size_monthly_usd || 0, currency)}
          sub={`${(market_data?.monthly_sales_estimate || 0).toLocaleString()} vendas/mês`}
        />
        <StatCard
          icon={BarChart2}
          label="Margem Estimada"
          value={`${profit_analysis?.profit_margin_pct?.toFixed(1)}%`}
          sub={`ROI ${profit_analysis?.roi_pct?.toFixed(0)}%`}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Scores + Market */}
        <div className="space-y-6">
          {/* Viral Breakdown */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-100 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-400" />
              Análise Viral
            </h2>
            <ScoreBar label="Momentum Social"    value={viral_breakdown?.social_momentum || 0}    color="red" />
            <ScoreBar label="Interesse de Busca" value={viral_breakdown?.search_interest || 0}    color="sky" />
            <ScoreBar label="Engajamento TikTok" value={viral_breakdown?.tiktok_engagement || 0}  color="purple" />
            <ScoreBar label="Intenção de Compra" value={viral_breakdown?.purchase_intent || 0}    color="green" />
            <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-800">
              <span className="text-gray-500">Sentimento</span>
              <span className="text-green-400 font-semibold capitalize">
                {(viral_breakdown?.sentiment || "positive").replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Hashtags Trending */}
          <div className="card">
            <h2 className="font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              Hashtags em Alta
            </h2>
            <div className="space-y-3">
              {(market_data?.top_hashtags || []).slice(0, 4).map((h: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <a
                    href={`https://www.tiktok.com/tag/${h.tag}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:text-sky-300 text-sm font-medium transition-colors"
                  >
                    #{h.tag}
                  </a>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: `${h.trend_velocity}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-14 text-right">
                      {(h.post_count / 1_000_000).toFixed(1)}M posts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Competition */}
          <div className="card">
            <h2 className="font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              Competição
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total de vendedores</span>
                <span className="text-white font-semibold">{competition?.total_sellers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Preço médio competidor</span>
                <span className="text-white font-semibold">{convertPrice(Number(competition?.avg_competitor_price ?? 0), currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Nível</span>
                <span className={`font-semibold capitalize ${
                  competition?.competition_level === "low" ? "text-green-400" :
                  competition?.competition_level === "medium" ? "text-amber-400" : "text-red-400"
                }`}>
                  {competition?.competition_level === "low" ? "🟢 Baixa" :
                   competition?.competition_level === "medium" ? "🟡 Média" : "🔴 Alta"}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-800">
                <ScoreBar label="Blue Ocean Score" value={competition?.blue_ocean_score || 0} color="green" />
              </div>
            </div>
          </div>
        </div>

        {/* Center — Profit + Suppliers */}
        <div className="space-y-6">
          {/* Profit Calculator */}
          <div className="card border-sky-500/20 border">
            <h2 className="font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              Calculadora de Lucro
            </h2>
            <div className="space-y-3">
              {[
                ["Custo do Fornecedor", convertPrice(Number(profit_analysis?.supplier_cost ?? 0), currency), "text-red-400"],
                ["Preço Sugerido de Venda", convertPrice(Number(profit_analysis?.recommended_price ?? 0), currency), "text-white"],
                ["Lucro por Unidade", convertPrice(Number(profit_analysis?.profit_per_unit ?? 0), currency), "text-green-400"],
                ["Margem de Lucro", `${profit_analysis?.profit_margin_pct}%`, "text-green-400"],
                ["ROI", `${profit_analysis?.roi_pct}%`, "text-sky-400"],
                ["Gasto c/ Anúncio Sugerido", convertPrice(Number(profit_analysis?.ad_spend_suggested ?? 0), currency), "text-amber-400"],
                ["ROAS Alvo", `${profit_analysis?.target_roas}x`, "text-purple-400"],
              ].map(([label, value, color]) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className={`font-bold ${color}`}>{value}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-800 grid grid-cols-2 gap-3">
                <div className="bg-green-500/10 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Receita Mensal Est.</p>
                  <p className="text-sm font-bold text-green-400">
                    {convertPrice(profit_analysis?.monthly_revenue_est || 0, currency)}
                  </p>
                </div>
                <div className="bg-sky-500/10 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Lucro Mensal Est.</p>
                  <p className="text-sm font-bold text-sky-400">
                    {convertPrice(profit_analysis?.monthly_profit_est || 0, currency)}
                  </p>
                </div>
              </div>
              {/* Interactive quantity calculator */}
              <div className="pt-3 border-t border-gray-800">
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-xs text-gray-400 flex-1">Calcular lucro por quantidade:</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(100, Number(e.target.value))))}
                    className="w-20 bg-gray-800 border border-gray-700 text-sm text-white rounded-lg px-2 py-1 text-center focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-xs text-gray-500">un.</span>
                </div>
                <div className="bg-gradient-to-r from-green-500/10 to-sky-500/10 rounded-lg p-3 text-center border border-green-500/20">
                  <p className="text-xs text-gray-400 mb-1">
                    Lucro para {quantity} unidade{quantity !== 1 ? "s" : ""}:
                  </p>
                  <p className="text-lg font-bold text-green-400">
                    {convertPrice((profit_analysis?.profit_per_unit || 0) * quantity, currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Suppliers */}
          <div className="card">
            <h2 className="font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-400" />
              Melhores Fornecedores
            </h2>
            <div className="space-y-3">
              {(suppliers || []).slice(0, 3).map((s: any, i: number) => (
                <div key={i} className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white truncate max-w-[140px]">
                      {s.supplier_name}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs text-amber-400">{s.rating?.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Custo</p>
                      <p className="text-white font-semibold">{convertPrice(Number(s.cost_price ?? 0), currency)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Frete</p>
                      <p className="text-white font-semibold">{convertPrice(Number(s.shipping_cost ?? 0), currency)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Margem</p>
                      <p className="text-green-400 font-semibold">{s.profit_margin_pct?.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {s.shipping_days_min}-{s.shipping_days_max} dias • MOQ: {s.moq}
                    </span>
                    {s.supplier_url && (
                      <a
                        href={s.supplier_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
                      >
                        Ver <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Live supplier price search */}
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-green-400" />
                Ver preço real agora nos fornecedores:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "AliExpress", emoji: "🛒", color: "text-red-400 border-red-500/20 bg-red-500/5 hover:bg-red-500/10",
                    url: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(product.name)}&SortType=SALE_PRICE_ASC` },
                  { label: "SHEIN", emoji: "👗", color: "text-pink-400 border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10",
                    url: `https://www.shein.com/pdsearch/${encodeURIComponent(product.name)}/?ici=s_pdsearch_btn` },
                  { label: "CJ Dropship", emoji: "📦", color: "text-green-400 border-green-500/20 bg-green-500/5 hover:bg-green-500/10",
                    url: `https://app.cjdropshipping.com/?_locale=en#/productPage?productNameEn=${encodeURIComponent(product.name)}` },
                  { label: "Temu", emoji: "🏷️", color: "text-purple-400 border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10",
                    url: `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(product.name)}` },
                ].map(({ label, emoji, color, url }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${color}`}
                  >
                    <span>{emoji}</span>
                    {label}
                    <ExternalLink className="w-2.5 h-2.5 ml-auto" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right — Marketing Assets */}
        <div className="space-y-6">
          {/* Platform performance */}
          <div className="card">
            <h2 className="font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              Melhores Plataformas
            </h2>
            <div className="space-y-3">
              {(market_data?.best_platforms || []).map((p: any) => (
                <div key={p.platform} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{p.platform}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: `${p.score}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-14 text-right">
                      {(p.monthly_reach / 1_000_000).toFixed(1)}M reach
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Marketing Copy */}
          <div className="card">
            <h2 className="font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              Copy de Marketing IA
            </h2>
            <div className="space-y-4">
              {marketing_assets?.headline && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Headlines</span>
                    <CopyButton text={marketing_assets.headline} label="Headlines" />
                  </div>
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans bg-gray-800 rounded-lg p-2.5 max-h-28 overflow-y-auto">
                    {marketing_assets.headline}
                  </pre>
                </div>
              )}
              {marketing_assets?.hook && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Hooks TikTok</span>
                    <CopyButton text={marketing_assets.hook} label="Hooks" />
                  </div>
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans bg-gray-800 rounded-lg p-2.5 max-h-28 overflow-y-auto">
                    {marketing_assets.hook}
                  </pre>
                </div>
              )}
              {marketing_assets?.tiktok_script && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Script TikTok 60s</span>
                    <CopyButton text={marketing_assets.tiktok_script} label="Script" />
                  </div>
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans bg-gray-800 rounded-lg p-2.5 max-h-40 overflow-y-auto">
                    {marketing_assets.tiktok_script}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Viral Timeline Chart — always shown, 30-day data */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            Histórico Viral (30 dias)
          </h2>
          <span className="text-xs text-gray-500">Dados TikTok Shop</span>
        </div>
        <ViralTimeline data={viralHistoryData && viralHistoryData.length > 0 ? viralHistoryData : (viral_timeline ?? [])} />
      </div>

      {/* Caption for social */}
      {marketing_assets?.caption && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-100 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Captions Prontas para Postar
            </h2>
            <CopyButton text={marketing_assets.caption} label="Captions" />
          </div>
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
            {marketing_assets.caption}
          </pre>
        </div>
      )}

      {/* Source info */}
      <div className="flex items-center gap-2 text-xs text-gray-600 pb-2">
        <span>🟢 Dados ao vivo de:</span>
        {["TikTok Shop", "AliExpress", "Claude AI"].map((s) => (
          <span key={s} className="bg-gray-800 px-2 py-0.5 rounded">{s}</span>
        ))}
        <span>• Atualizado: {new Date().toLocaleTimeString("pt-BR")}</span>
      </div>
    </div>
  );
}
