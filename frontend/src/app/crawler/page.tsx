"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Play, RefreshCw, Clock,
  CheckCircle2, XCircle, Loader2, Hash, Globe,
  MapPin, Activity, TrendingUp, Wifi,
} from "lucide-react";
import { crawlerApi, api } from "@/lib/api";
import toast from "react-hot-toast";
import { useT } from "@/store/preferences";

const PLATFORMS = ["tiktok", "instagram", "youtube", "pinterest", "amazon"];
const JOB_TYPES = ["trending", "hashtag_scan", "product_search", "profile"];

const JOB_TYPE_PT: Record<string, string> = {
  trending: "Em Alta",
  hashtag_scan: "Scan Hashtag",
  product_search: "Busca Produto",
  profile: "Perfil",
};

const PLATFORM_ICONS: Record<string, string> = {
  tiktok: "🎵", instagram: "📸", youtube: "▶️", pinterest: "📌", amazon: "📦",
};

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "bg-pink-500", instagram: "bg-purple-500",
  youtube: "bg-red-500", pinterest: "bg-red-600", amazon: "bg-amber-500",
};

const STATUS_PT: Record<string, string> = {
  pending: "Aguardando", running: "Executando", completed: "Concluído", failed: "Falhou",
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "text-gray-400 bg-gray-400/10",
    running: "text-brand-400 bg-brand-400/10",
    completed: "text-green-400 bg-green-400/10",
    failed: "text-red-400 bg-red-400/10",
  };
  const icons: Record<string, React.ReactNode> = {
    pending: <Clock className="w-3 h-3" />,
    running: <Loader2 className="w-3 h-3 animate-spin" />,
    completed: <CheckCircle2 className="w-3 h-3" />,
    failed: <XCircle className="w-3 h-3" />,
  };
  return (
    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] ?? styles.pending}`}>
      {icons[status]}
      {STATUS_PT[status] ?? status}
    </span>
  );
}

function JobRow({ job }: { job: any }) {
  const duration =
    job.started_at && job.finished_at
      ? Math.round(
          (new Date(job.finished_at).getTime() - new Date(job.started_at).getTime()) / 1000
        )
      : null;

  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span>{PLATFORM_ICONS[job.platform] ?? "🌐"}</span>
          <span className="text-gray-200 font-medium capitalize">{job.platform}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-gray-400 text-sm">{JOB_TYPE_PT[job.job_type] ?? job.job_type}</td>
      <td className="py-3 px-4 text-gray-400 text-sm truncate max-w-32">
        {job.target ?? <span className="text-gray-600">—</span>}
      </td>
      <td className="py-3 px-4"><StatusBadge status={job.status} /></td>
      <td className="py-3 px-4 text-gray-400 text-sm">
        {job.videos_found != null ? (
          <span className="text-white font-medium">{job.videos_found}</span>
        ) : (
          <span className="text-gray-600">—</span>
        )}
      </td>
      <td className="py-3 px-4 text-gray-400 text-sm">
        {duration != null ? `${duration}s` : <span className="text-gray-600">—</span>}
      </td>
      <td className="py-3 px-4 text-gray-500 text-xs">
        {job.created_at
          ? new Date(job.created_at).toLocaleString("pt-BR", {
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            })
          : "—"}
      </td>
    </tr>
  );
}

// Live activity ticker component
function LiveActivityFeed({ activity }: { activity: any[] }) {
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {activity.length === 0 ? (
        <div className="flex items-center justify-center h-20 text-gray-600 text-sm">
          <Activity className="w-5 h-5 mr-2 opacity-40" />
          Aguardando atividade...
        </div>
      ) : (
        activity.map((item: any, i: number) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50 border border-gray-800">
            {item.type === "job" ? (
              <>
                <span className="text-lg">{PLATFORM_ICONS[item.platform] ?? "🌐"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 font-medium capitalize">{item.platform} scan</p>
                  <p className="text-xs text-gray-600">
                    {item.videos_found > 0 ? `${item.videos_found} produtos` : "Executado"}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-lg bg-gray-700 overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs">📦</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 font-medium truncate">{item.name}</p>
                  <p className="text-xs text-gray-600">{item.category}</p>
                </div>
                <span className={`text-xs font-bold flex-shrink-0 ${
                  item.viral_score >= 95 ? "text-red-400" : item.viral_score >= 85 ? "text-orange-400" : "text-yellow-400"
                }`}>
                  {Math.round(item.viral_score)}🔥
                </span>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default function CrawlerPage() {
  const queryClient = useQueryClient();
  const [platform, setPlatform] = useState("tiktok");
  const [jobType, setJobType] = useState("trending");
  const [target, setTarget] = useState("");
  const [liveActivity, setLiveActivity] = useState<any[]>([]);
  const [regionData, setRegionData] = useState<any>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const t = useT();
  const activityInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["crawler-jobs"],
    queryFn: () => crawlerApi.getJobs(),
    refetchInterval: 8_000,
  });

  const { data: stats } = useQuery({
    queryKey: ["crawler-stats"],
    queryFn: () => crawlerApi.getStats(),
    refetchInterval: 20_000,
  });

  // Fetch region data
  useEffect(() => {
    api.get("/crawler/region-stats")
      .then(r => setRegionData(r.data))
      .catch(() => {});
  }, []);

  // Fetch live activity and poll
  useEffect(() => {
    const fetchActivity = () => {
      setActivityLoading(true);
      api.get("/crawler/live-activity", { params: { limit: 15 } })
        .then(r => setLiveActivity(r.data || []))
        .catch(() => {})
        .finally(() => setActivityLoading(false));
    };
    fetchActivity();
    activityInterval.current = setInterval(fetchActivity, 12_000);
    return () => { if (activityInterval.current) clearInterval(activityInterval.current); };
  }, []);

  const startJob = useMutation({
    mutationFn: () =>
      crawlerApi.startJob({ platform, job_type: jobType, target: target || undefined }),
    onSuccess: (res: any) => {
      const found = res?.videos_found ?? res?.products_discovered ?? 0;
      toast.success(`✅ ${platform} concluído! ${found} produtos encontrados`);
      queryClient.invalidateQueries({ queryKey: ["crawler-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["crawler-stats"] });
      // refresh activity
      api.get("/crawler/live-activity", { params: { limit: 15 } })
        .then(r => setLiveActivity(r.data || [])).catch(() => {});
    },
    onError: () => toast.error("Falha ao iniciar rastreador"),
  });

  // TikTok Shop button now uses the same crawlerApi.startJob
  const crawlTikTok = useMutation({
    mutationFn: () => crawlerApi.startJob({ platform: "tiktok", job_type: "trending" }),
    onSuccess: (res: any) => {
      const count = res?.products_discovered ?? res?.videos_found ?? 0;
      toast.success(`🎵 TikTok Shop: ${count} produtos salvos!`);
      queryClient.invalidateQueries({ queryKey: ["crawler-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["crawler-stats"] });
    },
    onError: () => toast.error("Falha ao buscar TikTok Shop"),
  });

  const scanHashtags = useMutation({
    mutationFn: () => crawlerApi.scanHashtags(),
    onSuccess: () => {
      toast.success("🔖 Scan de hashtags concluído!");
      queryClient.invalidateQueries({ queryKey: ["crawler-jobs"] });
    },
    onError: () => toast.error("Falha ao iniciar scan de hashtags"),
  });

  const runningJobs = (jobs ?? []).filter((j: any) => j.status === "running");
  const pendingJobs = (jobs ?? []).filter((j: any) => j.status === "pending");

  // Platform chart data from stats
  const platformStats = (stats as any)?.platform_stats ?? [];
  const maxProducts = Math.max(...platformStats.map((p: any) => p.products || 1), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.crawler.title}</h1>
          <p className="text-gray-400 text-sm mt-1">{t.crawler.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {runningJobs.length > 0 ? (
            <span className="flex items-center gap-2 text-sm text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {runningJobs.length} ativo{runningJobs.length > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 rounded-full bg-gray-600" />
              {t.common.inactive}
            </span>
          )}
          {/* Live indicator */}
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full text-xs text-sky-400">
            <Wifi className="w-3 h-3" />
            Ao Vivo
          </span>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t.crawler.totalJobs, value: (stats as any).total_jobs?.toLocaleString("pt-BR") ?? 0, color: "text-white" },
            { label: t.crawler.completed, value: (stats as any).completed_jobs?.toLocaleString("pt-BR") ?? 0, color: "text-green-400" },
            { label: t.crawler.failed, value: (stats as any).failed_jobs?.toLocaleString("pt-BR") ?? 0, color: "text-red-400" },
            { label: t.crawler.videosFound, value: (stats as any).total_videos_found?.toLocaleString("pt-BR") ?? 0, color: "text-brand-400" },
          ].map((stat) => (
            <div key={stat.label} className="card">
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Platform Chart + Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Performance */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-400" />
            Produtos por Plataforma
          </h2>
          {platformStats.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-gray-600 text-sm">
              Execute um rastreador para ver dados
            </div>
          ) : (
            <div className="space-y-3">
              {platformStats.map((ps: any) => (
                <div key={ps.platform} className="flex items-center gap-3">
                  <span className="w-6 text-center">{PLATFORM_ICONS[ps.platform] ?? "🌐"}</span>
                  <span className="text-xs text-gray-400 w-20 capitalize">{ps.platform}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${PLATFORM_COLORS[ps.platform] ?? "bg-sky-500"}`}
                      style={{ width: `${Math.max(2, (ps.products / maxProducts) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-10 text-right">{ps.products}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Activity Feed */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" />
            Atividade em Tempo Real
            {activityLoading && <Loader2 className="w-3 h-3 animate-spin text-gray-600 ml-auto" />}
            {!activityLoading && (
              <span className="ml-auto text-xs text-gray-600">atualiza a cada 12s</span>
            )}
          </h2>
          <LiveActivityFeed activity={liveActivity} />
        </div>
      </div>

      {/* Country / Region */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-300 mb-5 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-400" />
          Top Países — Onde os Produtos Estão Sendo Mais Vendidos
          {regionData && (
            <span className="ml-auto text-xs text-gray-600">{regionData.total_products} produtos analisados</span>
          )}
        </h2>
        {!regionData ? (
          <div className="flex items-center justify-center h-20 text-gray-600 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Carregando dados regionais...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {(regionData.countries ?? []).map((c: any, i: number) => (
              <div key={c.code} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-4 text-right">{i + 1}</span>
                <span className="text-sm w-36 truncate">{c.country}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-brand-400 transition-all duration-700"
                    style={{ width: `${c.pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-10 text-right font-medium">{c.pct}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Play className="w-4 h-4" /> {t.crawler.startCrawler}
        </h2>
        <div className="flex flex-wrap gap-3">
          {/* Platform */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">{t.crawler.platform}</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-brand-500"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_ICONS[p]} {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Job Type */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">{t.crawler.jobType}</label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-brand-500"
            >
              {JOB_TYPES.map((jt) => (
                <option key={jt} value={jt}>{JOB_TYPE_PT[jt] ?? jt}</option>
              ))}
            </select>
          </div>

          {/* Target */}
          <div className="flex flex-col gap-1 flex-1 min-w-40">
            <label className="text-xs text-gray-500">{t.crawler.target}</label>
            <input
              type="text"
              placeholder={t.crawler.targetPlaceholder}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 invisible">Ação</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => startJob.mutate()}
                disabled={startJob.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {startJob.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {t.crawler.start}
              </button>
              <button
                onClick={() => scanHashtags.mutate()}
                disabled={scanHashtags.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Hash className="w-4 h-4" />
                Scan Hashtags
              </button>
              <button
                onClick={() => crawlTikTok.mutate()}
                disabled={crawlTikTok.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-pink-700 hover:bg-pink-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {crawlTikTok.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>🎵</span>}
                TikTok Shop
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-300">
            {t.crawler.recentJobs}
            {pendingJobs.length > 0 && (
              <span className="ml-2 text-xs text-amber-400">
                ({pendingJobs.length} {t.crawler.inQueue})
              </span>
            )}
          </h2>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["crawler-jobs"] })}
            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
          </div>
        ) : (jobs ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-600">
            <Globe className="w-8 h-8 mb-2" />
            <p className="text-sm">{t.crawler.noPlatform}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-600 border-b border-gray-800">
                  <th className="text-left py-3 px-4">{t.crawler.platform}</th>
                  <th className="text-left py-3 px-4">{t.crawler.jobType}</th>
                  <th className="text-left py-3 px-4">{t.crawler.target}</th>
                  <th className="text-left py-3 px-4">{t.crawler.status}</th>
                  <th className="text-left py-3 px-4">{t.crawler.videos}</th>
                  <th className="text-left py-3 px-4">{t.crawler.duration}</th>
                  <th className="text-left py-3 px-4">{t.crawler.started}</th>
                </tr>
              </thead>
              <tbody>
                {(jobs ?? []).map((job: any) => (
                  <JobRow key={job.id} job={job} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
