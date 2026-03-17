"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Play, RefreshCw, Clock,
  CheckCircle2, XCircle, Loader2, Hash, Globe,
} from "lucide-react";
import { crawlerApi, productsApi } from "@/lib/api";
import toast from "react-hot-toast";

const PLATFORMS = ["tiktok", "instagram", "youtube", "pinterest", "amazon"];
const JOB_TYPES = ["trending", "hashtag_scan", "product_search", "profile"];

const JOB_TYPE_PT: Record<string, string> = {
  trending:       "Em Alta",
  hashtag_scan:   "Scan Hashtag",
  product_search: "Busca Produto",
  profile:        "Perfil",
};

const PLATFORM_ICONS: Record<string, string> = {
  tiktok:    "🎵",
  instagram: "📸",
  youtube:   "▶️",
  pinterest: "📌",
  amazon:    "📦",
};

const STATUS_PT: Record<string, string> = {
  pending:   "Aguardando",
  running:   "Executando",
  completed: "Concluído",
  failed:    "Falhou",
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:   "text-gray-400 bg-gray-400/10",
    running:   "text-brand-400 bg-brand-400/10",
    completed: "text-green-400 bg-green-400/10",
    failed:    "text-red-400 bg-red-400/10",
  };
  const icons: Record<string, React.ReactNode> = {
    pending:   <Clock className="w-3 h-3" />,
    running:   <Loader2 className="w-3 h-3 animate-spin" />,
    completed: <CheckCircle2 className="w-3 h-3" />,
    failed:    <XCircle className="w-3 h-3" />,
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
      <td className="py-3 px-4 text-gray-400 text-sm">
        {JOB_TYPE_PT[job.job_type] ?? job.job_type}
      </td>
      <td className="py-3 px-4 text-gray-400 text-sm truncate max-w-32">
        {job.target ?? <span className="text-gray-600">—</span>}
      </td>
      <td className="py-3 px-4">
        <StatusBadge status={job.status} />
      </td>
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
              month: "short", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            })
          : "—"}
      </td>
    </tr>
  );
}

export default function CrawlerPage() {
  const queryClient = useQueryClient();
  const [platform, setPlatform] = useState("tiktok");
  const [jobType, setJobType]   = useState("trending");
  const [target, setTarget]     = useState("");

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["crawler-jobs"],
    queryFn: () => crawlerApi.getJobs(),
    refetchInterval: 10_000,
  });

  const { data: stats } = useQuery({
    queryKey: ["crawler-stats"],
    queryFn: () => crawlerApi.getStats(),
    refetchInterval: 30_000,
  });

  const startJob = useMutation({
    mutationFn: () =>
      crawlerApi.startJob({ platform, job_type: jobType, target: target || undefined }),
    onSuccess: () => {
      toast.success(`✅ Rastreador ${platform} iniciado!`);
      queryClient.invalidateQueries({ queryKey: ["crawler-jobs"] });
    },
    onError: () => toast.error("Falha ao iniciar rastreador"),
  });

  const crawlTikTok = useMutation({
    mutationFn: () => productsApi.crawlTikTokShop(20),
    onSuccess: (res: any) => {
      const count = res?.data?.saved ?? res?.data?.products?.length ?? "?";
      toast.success(`🎵 TikTok Shop: ${count} produtos salvos!`);
      queryClient.invalidateQueries({ queryKey: ["crawler-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toast.error("Falha ao buscar TikTok Shop"),
  });

  const scanHashtags = useMutation({
    mutationFn: () => crawlerApi.scanHashtags(),
    onSuccess: () => {
      toast.success("🔖 Scan de hashtags iniciado!");
      queryClient.invalidateQueries({ queryKey: ["crawler-jobs"] });
    },
    onError: () => toast.error("Falha ao iniciar scan de hashtags"),
  });

  const runningJobs = (jobs ?? []).filter((j: any) => j.status === "running");
  const pendingJobs = (jobs ?? []).filter((j: any) => j.status === "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Monitor de Rastreadores</h1>
          <p className="text-gray-400 text-sm mt-1">
            Controle e monitore todos os rastreadores de plataformas
          </p>
        </div>
        <div className="flex items-center gap-2">
          {runningJobs.length > 0 ? (
            <span className="flex items-center gap-2 text-sm text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {runningJobs.length} ativo{runningJobs.length > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 rounded-full bg-gray-600" />
              Inativo
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total de Jobs",  value: stats.total_jobs?.toLocaleString("pt-BR") ?? 0,          color: "text-white" },
            { label: "Concluídos",     value: stats.completed_jobs?.toLocaleString("pt-BR") ?? 0,      color: "text-green-400" },
            { label: "Com Falha",      value: stats.failed_jobs?.toLocaleString("pt-BR") ?? 0,         color: "text-red-400" },
            { label: "Vídeos Encontrados", value: stats.total_videos_found?.toLocaleString("pt-BR") ?? 0, color: "text-brand-400" },
          ].map((stat) => (
            <div key={stat.label} className="card">
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Play className="w-4 h-4" /> Iniciar Rastreador
        </h2>
        <div className="flex flex-wrap gap-3">
          {/* Platform */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Plataforma</label>
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
            <label className="text-xs text-gray-500">Tipo de Job</label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-brand-500"
            >
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>{JOB_TYPE_PT[t] ?? t}</option>
              ))}
            </select>
          </div>

          {/* Target */}
          <div className="flex flex-col gap-1 flex-1 min-w-40">
            <label className="text-xs text-gray-500">Alvo (opcional)</label>
            <input
              type="text"
              placeholder="ex: tiktokmademebuyit"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 invisible">Ação</label>
            <div className="flex gap-2">
              <button
                onClick={() => startJob.mutate()}
                disabled={startJob.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {startJob.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Iniciar
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
                {crawlTikTok.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>🎵</span>
                )}
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
            Jobs Recentes
            {pendingJobs.length > 0 && (
              <span className="ml-2 text-xs text-amber-400">
                ({pendingJobs.length} na fila)
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
            <p className="text-sm">Nenhum job ainda. Inicie um rastreador acima.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-600 border-b border-gray-800">
                  <th className="text-left py-3 px-4">Plataforma</th>
                  <th className="text-left py-3 px-4">Tipo</th>
                  <th className="text-left py-3 px-4">Alvo</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Vídeos</th>
                  <th className="text-left py-3 px-4">Duração</th>
                  <th className="text-left py-3 px-4">Iniciado</th>
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
