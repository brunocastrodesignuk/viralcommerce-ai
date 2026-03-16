"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi, productsApi, trendsApi, crawlerApi } from "@/lib/api";
import { ViralTimeline } from "@/components/charts/ViralTimeline";
import { ProductCard } from "@/components/cards/ProductCard";
import {
  TrendingUp, Eye, Zap, DollarSign, ShoppingBag,
  Activity, Globe, BarChart2, ArrowUpRight,
} from "lucide-react";

export default function DashboardPage() {
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

  const { data: crawlerStats } = useQuery({
    queryKey: ["crawler", "stats"],
    queryFn: () => crawlerApi.stats().then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: platformStats } = useQuery({
    queryKey: ["analytics", "platforms"],
    queryFn: () => analyticsApi.platformStats(24).then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Real-time viral product intelligence</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary text-sm">
            <Activity className="w-4 h-4 inline mr-2" />
            Live Feed
          </button>
          <button className="btn-primary text-sm">
            <Zap className="w-4 h-4 inline mr-2" />
            Scan Now
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          icon={<TrendingUp className="w-5 h-5 text-red-400" />}
          label="Viral Products (24h)"
          value={overview?.viral_products_24h ?? "—"}
          change="+12%"
          positive
        />
        <KpiCard
          icon={<Eye className="w-5 h-5 text-brand-400" />}
          label="Videos Crawled Today"
          value={overview?.videos_crawled_today?.toLocaleString() ?? "—"}
          change="+8%"
          positive
        />
        <KpiCard
          icon={<Globe className="w-5 h-5 text-purple-400" />}
          label="Top Platform"
          value={overview?.top_platform ?? "TikTok"}
          sublabel="Most viral content"
        />
        <KpiCard
          icon={<DollarSign className="w-5 h-5 text-green-400" />}
          label="Avg Profit Margin"
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
            <h2 className="font-semibold text-gray-100">Viral Score Timeline</h2>
            <span className="text-xs text-gray-500">Last 24 hours</span>
          </div>
          <ViralTimeline data={timeline ?? []} />
        </div>

        {/* Trending Hashtags — 1 col */}
        <div className="card">
          <h2 className="font-semibold text-gray-100 mb-4">Trending Hashtags</h2>
          <div className="space-y-2">
            {(hashtags as any[])?.slice(0, 8).map((h: any, i: number) => (
              <div key={h.id || i} className="flex items-center justify-between">
                <span className="text-sm text-brand-400">#{h.tag}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${Math.min((h.trend_velocity / 100) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {h.post_count?.toLocaleString?.() ?? h.count?.toLocaleString?.() ?? "—"}
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
            <p className="text-xl font-bold text-white">{Number(p.videos ?? 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {Number(p.products ?? 0).toLocaleString()} products found
            </p>
          </div>
        ))}
      </div>

      {/* Trending Products */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-100">Trending Products Now</h2>
          <a href="/products" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
            View all <ArrowUpRight className="w-3 h-3" />
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
