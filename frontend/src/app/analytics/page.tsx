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
import { usePreferences, convertPrice } from "@/store/preferences";

const PLATFORM_COLORS: Record<string, string> = {
  tiktok:    "#ff0050",
  instagram: "#c13584",
  youtube:   "#ff0000",
  pinterest: "#e60023",
  amazon:    "#ff9900",
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
    <div className="card">
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
  const { currency } = usePreferences();

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

  const totalRevenue = (overview?.total_revenue ?? 0) / 1000;
  const totalSpend   = (overview?.total_ad_spend ?? 0) / 1000;

  const kpis = [
    {
      title: "Receita Total",
      value: `${convertPrice(totalRevenue * 1000, currency).replace(/,\d+$/, "K")}`,
      subtitle: "Receita acumulada de campanhas",
      icon: DollarSign,
      color: "green",
    },
    {
      title: "Gasto em Anúncios",
      value: `${convertPrice(totalSpend * 1000, currency).replace(/,\d+$/, "K")}`,
      subtitle: "Gasto total em todas as redes",
      icon: TrendingUp,
      color: "brand",
    },
    {
      title: "ROAS Médio",
      value: `${(overview?.avg_roas ?? 0).toFixed(2)}×`,
      subtitle: "Retorno sobre gasto em anúncios",
      icon: BarChart2,
      color: "purple",
    },
    {
      title: "Produtos Virais",
      value: overview?.viral_products_count ?? 0,
      subtitle: "Produtos com score ≥ 70",
      icon: Activity,
      color: "red",
    },
    {
      title: "Vídeos Rastreados",
      value: overview?.total_videos_tracked?.toLocaleString("pt-BR") ?? 0,
      subtitle: "Em todas as plataformas",
      icon: Eye,
      color: "brand",
    },
    {
      title: "Conversões",
      value: overview?.total_conversions?.toLocaleString("pt-BR") ?? 0,
      subtitle: "Total de conversões em anúncios",
      icon: ShoppingCart,
      color: "green",
    },
    {
      title: "CTR Médio",
      value: `${((overview?.avg_ctr ?? 0) * 100).toFixed(2)}%`,
      subtitle: "Taxa de cliques",
      icon: MousePointerClick,
      color: "amber",
    },
    {
      title: "Plataformas Ativas",
      value: overview?.active_platforms ?? 0,
      subtitle: "Rastreando agora",
      icon: Globe,
      color: "purple",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Análises</h1>
        <p className="text-gray-400 text-sm mt-1">
          Desempenho em tempo real de todas as campanhas e rastreadores
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
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">
            Score Viral ao Longo do Tempo (7 dias)
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
                name="Score Médio"
                stroke="#0ea5e9"
                fill="url(#scoreGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">
            Produtos por Categoria
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
                  {(categoryBreakdown ?? []).map((_: any, i: number) => (
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
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">
            Desempenho por Plataforma
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
              <Bar dataKey="videos_found" name="Vídeos" radius={[4, 4, 0, 0]}>
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
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">
            Anúncios com Melhor Desempenho
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs border-b border-gray-800">
                  <th className="text-left pb-3 pr-4">Nome do Anúncio</th>
                  <th className="text-right pb-3 pr-4">Impressões</th>
                  <th className="text-right pb-3 pr-4">Cliques</th>
                  <th className="text-right pb-3 pr-4">CTR</th>
                  <th className="text-right pb-3 pr-4">Gasto</th>
                  <th className="text-right pb-3 pr-4">Receita</th>
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
                      {Number(ad.impressions ?? 0).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {Number(ad.clicks ?? 0).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {((Number(ad.ctr ?? 0)) * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {convertPrice(Number(ad.spend ?? 0), currency)}
                    </td>
                    <td className="py-3 pr-4 text-right text-green-400">
                      {convertPrice(Number(ad.revenue ?? 0), currency)}
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
