"use client";

import { useQuery } from "@tanstack/react-query";
import { trendsApi } from "@/lib/api";
import { TrendingUp, Hash, Zap } from "lucide-react";

export default function TrendsPage() {
  const { data: hashtags } = useQuery({
    queryKey: ["trends", "hashtags"],
    queryFn: () => trendsApi.topHashtags(50).then((r) => r.data),
    refetchInterval: 60000,
  });

  const { data: velocity } = useQuery({
    queryKey: ["trends", "velocity"],
    queryFn: () => trendsApi.hashtagVelocity(24).then((r) => r.data),
    refetchInterval: 60000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Trend Radar</h1>
        <p className="text-sm text-gray-400">Real-time hashtag and product trend monitoring</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Top Hashtags */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-4 h-4 text-brand-400" />
            <h2 className="font-semibold text-gray-100">Top Trending Hashtags</h2>
          </div>
          <div className="space-y-3">
            {(hashtags as any[] ?? []).map((h: any, i: number) => (
              <div key={h.id || i} className="flex items-center gap-3">
                <span className="w-6 text-xs text-gray-600 font-mono">{i + 1}</span>
                <span className="text-sm text-brand-400 font-medium">#{h.tag}</span>
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full"
                    style={{ width: `${Math.min((h.trend_velocity / 200) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-20 text-right">
                  {Number(h.post_count ?? 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Velocity Leaders */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="font-semibold text-gray-100">Fastest Growing (24h)</h2>
          </div>
          <div className="space-y-3">
            {(velocity as any[] ?? []).slice(0, 15).map((h: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-sm text-gray-200">#{h.hashtag}</span>
                  <span className="text-xs text-gray-600 capitalize">{h.platform}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-green-400 font-medium">
                    +{Number(h.growth ?? 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-amber-400 font-bold">
                    ↑{Number(h.velocity ?? 0).toFixed(1)}/h
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
