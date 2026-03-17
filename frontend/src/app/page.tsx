"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, productsApi, trendsApi, crawlerApi } from "@/lib/api";
import { ViralTimeline } from "@/components/charts/ViralTimeline";
import { ProductCard } from "@/components/cards/ProductCard";
import { usePreferences, applyTheme, useT } from "@/store/preferences";
import {
  TrendingUp, Eye, Zap, DollarSign,
  Activity, Globe, BarChart2, ArrowUpRight, X,
  Flame, Clock, CheckCircle, Wifi, Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Live Feed Panel ──────────────────────────────────────────────────────────

function LiveFeedPanel({ onClose }: { onClose: () => void }) {
  const t = useT();

  const { data: trending } = useQuery({
    queryKey: ["live-feed-products"],
    queryFn: () => productsApi.trending(24, 15).then((r) => r.data),
    refetchInterval: 10000, // refresh every 10s
  });

  const { data: jobs } = useQuery({
    queryKey: ["live-feed-jobs"],
    queryFn: () => crawlerApi.getJobs(10),
    refetchInterval: 8000,
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm bg-gray-950 border-l border-gray-800 h-full overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gray-950 border-b border-gray-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <h2 className="font-semibold text-white">{t.dashboard.liveFeed}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Crawlers */}
        <div className="px-5 py-4 border-b border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">
            Rastreadores Ativos
          </p>
          <div className="space-y-2">
            {(jobs as any[])?.filter((j: any) => j.status === "running").slice(0, 3).map((job: any) => (
              <div key={job.id} className="flex items-center gap-3 p-2.5 bg-gray-800/50 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 capitalize">{job.platform}</p>
                  <p className="text-xs text-gray-500">Rastreando tendências...</p>
                </div>
                <Wifi className="w-3.5 h-3.5 text-green-400" />
              </div>
            ))}
            {!(jobs as any[])?.some((j: any) => j.status === "running") && (
              <div className="flex items-center gap-3 p-2.5 bg-gray-800/50 rounded-lg">
                <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse" />
                <p className="text-sm text-gray-400">Monitoramento em standby</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent discoveries */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Produtos Descobertos Recentemente
            </p>
            <span className="text-xs text-green-400 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Ao vivo
            </span>
          </div>
          <div className="space-y-3">
            {(trending as any[])?.slice(0, 12).map((product: any, i: number) => (
              <a
                key={product.id}
                href={`/products/${product.id}`}
                className="flex items-center gap-3 p-2.5 bg-gray-800/40 hover:bg-gray-800 rounded-lg transition-colors group"
              >
                {/* Image or placeholder */}
                <div className="w-10 h-10 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                  {product.image_urls?.[0] ? (
                    <img
                      src={product.image_urls[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Flame className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white">
                    {product.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{product.category}</span>
                    <span className="text-xs text-red-400 font-semibold flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5" />
                      {Math.round(product.viral_score)}
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-sky-400 transition-colors" />
              </a>
            ))}
          </div>
        </div>

        {/* Recent jobs */}
        <div className="px-5 py-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">
            {t.crawler.recentJobs}
          </p>
          <div className="space-y-2">
            {(jobs as any[])?.slice(0, 5).map((job: any) => (
              <div key={job.id} className="flex items-center gap-2 text-sm">
                {job.status === "completed"
                  ? <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  : job.status === "running"
                  ? <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  : <div className="w-3.5 h-3.5 rounded-full border border-gray-600 flex-shrink-0" />}
                <span className="text-gray-400 capitalize flex-1">{job.platform}</span>
                <span className="text-xs text-gray-600">
                  {job.videos_found ? `${job.videos_found} vídeos` : job.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-800">
          <p className="text-xs text-gray-600 text-center">
            Atualiza automaticamente a cada 10 segundos
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [showLiveFeed, setShowLiveFeed] = useState(false);
  const [scanning, setScanning] = useState(false);
  const { theme } = usePreferences();
  const t = useT();

  // Apply saved theme on mount
  useEffect(() => { applyTheme(theme); }, [theme]);

  const handleScanNow = async () => {
    setScanning(true);
    const toastId = toast.loading("🤖 Iniciando scan em todas as plataformas...");
    try {
      const platforms = ["tiktok", "instagram", "youtube"];
      const results = await Promise.allSettled(
        platforms.map((p) => crawlerApi.startJob({ platform: p, job_type: "trending" }))
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      toast.success(`✅ ${ok} plataformas escaneadas! Novos produtos chegando...`, { id: toastId, duration: 4000 });
    } catch {
      toast.error("Erro ao iniciar scan. Tente novamente.", { id: toastId });
    } finally {
      setScanning(false);
    }
  };

  const { data: overview } = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: () => analyticsApi.overview().then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: timeline } = useQuery({
    queryKey: ["analytics", "timeline"],
    queryFn: () => analyticsApi.viralTimeline(24).then((r) => r.data),
    refetchInterval: 60000,
  });

  const { data: trending } = useQuery({
    queryKey: ["products", "trending"],
    queryFn: () => productsApi.trending(24, 8).then((r) => r.data),
    refetchInterval: 120000,
  });

  const { data: hashtags } = useQuery({
    queryKey: ["trends", "hashtags"],
    queryFn: () => trendsApi.topHashtags(10).then((r) => r.data),
  });

  const { data: platformStats } = useQuery({
    queryKey: ["analytics", "platforms"],
    queryFn: () => analyticsApi.platformStats(24).then((r) => r.data),
  });

  return (
    <>
      {showLiveFeed && <LiveFeedPanel onClose={() => setShowLiveFeed(false)} />}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t.dashboard.title}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{t.dashboard.subtitle}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowLiveFeed(true)}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              {t.dashboard.liveFeed}
            </button>
            <button
              onClick={handleScanNow}
              disabled={scanning}
              className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {scanning ? t.dashboard.scanning : t.dashboard.scanNow}
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            icon={<TrendingUp className="w-5 h-5 text-red-400" />}
            label={t.dashboard.viralProducts24h}
            value={overview?.viral_products_24h ?? "—"}
            change="+12%"
            positive
          />
          <KpiCard
            icon={<Eye className="w-5 h-5 text-brand-400" />}
            label={t.dashboard.videosToday}
            value={overview?.videos_crawled_today?.toLocaleString() ?? "—"}
            change="+8%"
            positive
          />
          <KpiCard
            icon={<Globe className="w-5 h-5 text-purple-400" />}
            label={t.dashboard.topPlatform}
            value={overview?.top_platform ?? "TikTok"}
            sublabel="Conteúdo mais viral"
          />
          <KpiCard
            icon={<DollarSign className="w-5 h-5 text-green-400" />}
            label={t.dashboard.avgMargin}
            value="380%"
            change="+5%"
            positive
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Viral Timeline — 2 cols */}
          <div className="col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-100">{t.dashboard.viralTimeline}</h2>
              <span className="text-xs text-gray-500">{t.dashboard.last24h}</span>
            </div>
            <ViralTimeline data={timeline ?? []} />
          </div>

          {/* Trending Hashtags — 1 col */}
          <div className="card">
            <h2 className="font-semibold text-gray-100 mb-4">{t.dashboard.trendingHashtags}</h2>
            <div className="space-y-2">
              {(hashtags as any[])?.slice(0, 8).map((h: any, i: number) => (
                <div key={h.id || i} className="flex items-center justify-between">
                  <a
                    href={`https://www.tiktok.com/tag/${h.tag}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    #{h.tag}
                  </a>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{ width: `${Math.min((h.trend_velocity / 100) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-16 text-right">
                      {((h.post_count || h.count || 0) / 1_000_000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Platform Crawler Stats */}
        <div className="grid grid-cols-4 gap-4">
          {(platformStats as any[] ?? []).slice(0, 4).map((p: any) => (
            <div key={p.platform} className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium capitalize text-gray-300">{p.platform}</span>
                <BarChart2 className="w-4 h-4 text-gray-600" />
              </div>
              <p className="text-xl font-bold text-white">
                {Number(p.products ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {Number(p.videos ?? 0).toLocaleString()} vídeos encontrados
              </p>
            </div>
          ))}
        </div>

        {/* Trending Products */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-100">{t.dashboard.trendingNow}</h2>
            <a href="/products" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
              {t.dashboard.seeAll} <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {(trending as any[])?.slice(0, 8).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onImport={(p) => console.log("Import", p.id)}
                onGenerateAds={(p) => console.log("Generate ads", p.id)}
                onFindSupplier={(p) => console.log("Find supplier", p.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function KpiCard({
  icon, label, value, change, positive, sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  sublabel?: string;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center">{icon}</div>
        {change && (
          <span className={`text-xs font-medium ${positive ? "text-green-400" : "text-red-400"}`}>
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{sublabel ?? label}</p>
    </div>
  );
}
