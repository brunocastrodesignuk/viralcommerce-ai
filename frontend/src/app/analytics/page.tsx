"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, DollarSign, MousePointerClick, Eye,
  ShoppingCart, BarChart2, Activity, Globe,
} from "lucide-react";
import { analyticsApi } from "@/lib/api";

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "#ff0050",
  instagram: "#c13584",
  youtube: "#ff0000",
  pinterest: "#e60023",
  amazon: "#ff9900",
};

const CATEGORY_COLORS = [
  "#0ea5e9", "#8b5cf6", "#22c55e", "#f59e0b",
  "#ef4444", "#06b6d4", "#ec4899", "#84cc16",
];

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  green:  { bg: "bg-green-500/10",  text: "text-green-400" },
  brand:  { bg: "bg-sky-500/10",    text: "text-sky-400" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-400" },
  red:    { bg: "bg-red-500/10",    text: "text-red-400" },
  amber:  { bg: "bg-amber-500/10",  text: "text-amber-400" },
};

function StatCard({
  title, value, subtitle, icon: Icon, color = "brand",
}: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; color?: string;
}) {
  const { bg, text } = COLOR_MAP[color] ?? COLOR_MAP.brand;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">{title}</span>
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`w-4 h-4 ${text}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () => analyticsApi.getOverview(),
    refetchInterval: 60_000,
  });

  const { data: timeline } = useQuery({
    queryKey: ["analytics-timeline"],
    queryFn: () => analyticsApi.getViralTimeline(),
  });

  const { data: platformStats } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: () => analyticsApi.getPlatformStats(),
  });

  const { data: adPerformance } = useQuery({
    queryKey: ["ad-performance"],
    queryFn: () => analyticsApi.getAdPerformance(),
  });

  const { data: categoryBreakdown } = useQuery({
    queryKey: ["category-breakdown"],
    queryFn: () => analyticsApi.getCategoryBreakdown(),
  });

  if (loadingOverview) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const kpis = [
    {
      title: "Total Revenue",
      value: `$${((overview?.total_revenue ?? 0) / 1000).toFixed(1)}K`,
      subtitle: "All-time campaign revenue",
      icon: DollarSign,
      color: "green",
    },
    {
      title: "Total Ad Spend",
      value: `$${((overview?.total_ad_spend ?? 0) / 1000).toFixed(1)}K`,
      subtitle: "All-time spend across networks",
      icon: TrendingUp,
      color: "brand",
    },
    {
      title: "Avg ROAS",
      value: `${(overview?.avg_roas ?? 0).toFixed(2)}×`,
      subtitle: "Return on ad spend",
      icon: BarChart2,
      color: "purple",
    },
    {
      title: "Viral Products",
      value: overview?.viral_products_count ?? 0,
      subtitle: "Products with score ≥ 70",
      icon: Activity,
      color: "red",
    },
    {
      title: "Videos Tracked",
      value: overview?.total_videos_tracked?.toLocaleString() ?? 0,
      subtitle: "Across all platforms",
      icon: Eye,
      color: "brand",
    },
    {
      title: "Conversions",
      value: overview?.total_conversions?.toLocaleString() ?? 0,
      subtitle: "Total ad conversions",
      icon: ShoppingCart,
      color: "green",
    },
    {
      title: "Avg CTR",
      value: `${((overview?.avg_ctr ?? 0) * 100).toFixed(2)}%`,
      subtitle: "Click-through rate",
      icon: MousePointerClick,
      color: "amber",
    },
    {
      title: "Platforms Active",
      value: overview?.active_platforms ?? 0,
      subtitle: "Crawling right now",
      icon: Globe,
      color: "purple",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">
          Real-time performance across all campaigns and crawlers
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <StatCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Viral Score Timeline */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">
            Viral Score Timeline (7d)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={timeline ?? []}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151" }}
                labelStyle={{ color: "#e5e7eb" }}
              />
              <Area
                type="monotone"
                dataKey="avg_score"
                name="Avg Score"
                stroke="#0ea5e9"
                fill="url(#scoreGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">
            Products by Category
          </h2>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie
                  data={categoryBreakdown ?? []}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  strokeWidth={2}
                  stroke="#111827"
                >
                  {(categoryBreakdown ?? []).map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <ul className="space-y-2 flex-1">
              {(categoryBreakdown ?? []).slice(0, 6).map((cat: any, i: number) => (
                <li key={cat.category} className="flex items-center gap-2 text-xs">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                  />
                  <span className="text-gray-300 truncate flex-1">{cat.category}</span>
                  <span className="text-gray-500 font-medium">{cat.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      {platformStats && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">
            Platform Performance
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={platformStats} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="platform" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151" }}
                labelStyle={{ color: "#e5e7eb" }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
              <Bar dataKey="videos_found" name="Videos" radius={[4, 4, 0, 0]}>
                {platformStats.map((entry: any) => (
                  <Cell
                    key={entry.platform}
                    fill={PLATFORM_COLORS[entry.platform] ?? "#6b7280"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Ad Performance Table */}
      {adPerformance && adPerformance.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">
            Top Performing Ads
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs border-b border-gray-800">
                  <th className="text-left pb-3 pr-4">Ad Name</th>
                  <th className="text-right pb-3 pr-4">Impressions</th>
                  <th className="text-right pb-3 pr-4">Clicks</th>
                  <th className="text-right pb-3 pr-4">CTR</th>
                  <th className="text-right pb-3 pr-4">Spend</th>
                  <th className="text-right pb-3 pr-4">Revenue</th>
                  <th className="text-right pb-3">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {adPerformance.slice(0, 8).map((ad: any) => (
                  <tr key={ad.id} className="text-gray-300">
                    <td className="py-3 pr-4 text-white font-medium truncate max-w-xs">
                      {ad.headline}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {Number(ad.impressions ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {Number(ad.clicks ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {((Number(ad.ctr ?? 0)) * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 pr-4 text-right">
                      ${Number(ad.spend ?? 0).toFixed(2)}
                    </td>
                    <td className="py-3 pr-4 text-right text-green-400">
                      ${Number(ad.revenue ?? 0).toFixed(2)}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`font-semibold ${
                          Number(ad.roas) >= 2.5
                            ? "text-green-400"
                            : Number(ad.roas) >= 1
                            ? "text-amber-400"
                            : "text-red-400"
                        }`}
                      >
                        {Number(ad.roas ?? 0).toFixed(2)}×
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
