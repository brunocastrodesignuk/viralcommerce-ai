"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { campaignsApi, Campaign } from "@/lib/api";
import { Play, Pause, Zap, TrendingUp, DollarSign, BarChart2 } from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";

const STATUS_COLORS: Record<string, string> = {
  draft:     "bg-gray-500/20 text-gray-400",
  running:   "bg-green-500/20 text-green-400",
  paused:    "bg-amber-500/20 text-amber-400",
  completed: "bg-brand-500/20 text-brand-400",
  killed:    "bg-red-500/20 text-red-400",
};

export default function CampaignsPage() {
  const qc = useQueryClient();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => campaignsApi.list().then((r) => r.data),
    refetchInterval: 30000,
  });

  const launchMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.launch(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign launched!");
    },
  });

  const optimizeMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.optimize(id),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      const d = data.data;
      toast.success(`Optimized: ${d.ads_killed} killed, ${d.ads_scaled} scaled`);
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.pause(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast("Campaign paused");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ad Campaigns</h1>
          <p className="text-sm text-gray-400">Automated campaign optimization</p>
        </div>
        <button className="btn-primary text-sm">
          <Zap className="w-4 h-4 inline mr-2" />
          New Campaign
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active", value: campaigns?.filter((c: Campaign) => c.status === "running").length ?? 0, icon: <Play className="w-4 h-4 text-green-400" />, color: "text-green-400" },
          { label: "Total Spend", value: `$${campaigns?.reduce((s: number, c: Campaign) => s + (c.total_spend || 0), 0).toFixed(0) ?? 0}`, icon: <DollarSign className="w-4 h-4 text-brand-400" />, color: "text-brand-400" },
          { label: "Total Revenue", value: `$${campaigns?.reduce((s: number, c: Campaign) => s + (c.total_revenue || 0), 0).toFixed(0) ?? 0}`, icon: <TrendingUp className="w-4 h-4 text-purple-400" />, color: "text-purple-400" },
          { label: "Avg ROAS", value: `${(campaigns?.reduce((s: number, c: Campaign) => s + (c.roas || 0), 0) / (campaigns?.length || 1)).toFixed(1) ?? 0}x`, icon: <BarChart2 className="w-4 h-4 text-amber-400" />, color: "text-amber-400" },
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
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-800">
              {["Campaign", "Network", "Status", "Budget/day", "Spend", "Revenue", "ROAS", "Actions"].map((h) => (
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
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-300">${c.daily_budget}</td>
                    <td className="py-3 pr-4 text-sm text-gray-300">${c.total_spend?.toFixed(2) ?? "0.00"}</td>
                    <td className="py-3 pr-4 text-sm text-green-400">${c.total_revenue?.toFixed(2) ?? "0.00"}</td>
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
                            title="Launch"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {c.status === "running" && (
                          <>
                            <button
                              onClick={() => optimizeMutation.mutate(c.id)}
                              className="p-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-lg transition-colors"
                              title="Optimize"
                            >
                              <Zap className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => pauseMutation.mutate(c.id)}
                              className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors"
                              title="Pause"
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
      </div>
    </div>
  );
}
