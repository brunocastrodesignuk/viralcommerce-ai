"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trendsApi, productsApi } from "@/lib/api";
import { ProductCard } from "@/components/cards/ProductCard";
import { TrendingUp, Hash, Zap, X, TrendingDown, Minus } from "lucide-react";
import { useT } from "@/store/preferences";
import toast from "react-hot-toast";

function TrendDirectionIcon({ velocity }: { velocity: number }) {
  if (velocity >= 85) return <TrendingUp className="w-3.5 h-3.5 text-green-400" title="Em alta" />;
  if (velocity >= 70) return <Minus className="w-3.5 h-3.5 text-amber-400" title="Estável" />;
  return <TrendingDown className="w-3.5 h-3.5 text-red-400" title="Em queda" />;
}

export default function TrendsPage() {
  const t = useT();
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);

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

  // Fetch products related to the selected hashtag
  const { data: hashtagProducts, isLoading: loadingHashtagProducts } = useQuery({
    queryKey: ["products", "hashtag", selectedHashtag],
    queryFn: () =>
      productsApi
        .list({ category: selectedHashtag || undefined, limit: 8, page: 1 })
        .then((r) => r.data),
    enabled: !!selectedHashtag,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t.trends.title}</h1>
        <p className="text-sm text-gray-400">{t.trends.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Top Hashtags */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-4 h-4 text-brand-400" />
            <h2 className="font-semibold text-gray-100">{t.trends.topHashtags}</h2>
          </div>
          <div className="space-y-3">
            {(hashtags as any[] ?? []).map((h: any, i: number) => {
              const saturation = Math.round(100 - (h.trend_velocity ?? 0));
              return (
                <div
                  key={h.id || i}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-800/50 rounded-lg px-1 py-0.5 transition-colors"
                  onClick={() => {
                    setSelectedHashtag(h.tag);
                    toast(`Carregando produtos para #${h.tag}...`, { icon: "🔍", duration: 1500 });
                  }}
                >
                  <span className="w-6 text-xs text-gray-600 font-mono">{i + 1}</span>
                  <TrendDirectionIcon velocity={h.trend_velocity ?? 0} />
                  <span className="text-sm text-brand-400 font-medium hover:text-brand-300 transition-colors">
                    #{h.tag}
                  </span>
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full"
                      style={{ width: `${Math.min((h.trend_velocity / 200) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-right flex-shrink-0">
                    <span className="text-xs text-gray-500 w-20">
                      {Number(h.post_count ?? 0).toLocaleString("pt-BR")}
                    </span>
                    <span
                      className={`text-xs font-medium w-16 ${
                        saturation <= 20 ? "text-green-400" : saturation <= 40 ? "text-amber-400" : "text-red-400"
                      }`}
                      title="Score de Saturação (menor = menos concorrência)"
                    >
                      Sat: {saturation}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-600 mt-3">
            Sat = Score de Saturação (0 = sem concorrência, 100 = muito saturado)
          </p>
        </div>

        {/* Velocity Leaders */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="font-semibold text-gray-100">{t.trends.fastestGrowing}</h2>
          </div>
          <div className="space-y-3">
            {(velocity as any[] ?? []).slice(0, 15).map((h: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendDirectionIcon velocity={h.velocity ?? 0} />
                  <span className="text-sm text-gray-200">#{h.hashtag}</span>
                  <span className="text-xs text-gray-600 capitalize">{h.platform}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-green-400 font-medium">
                    +{Number(h.growth ?? 0).toLocaleString("pt-BR")}
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

      {/* Hashtag Products Panel */}
      {selectedHashtag && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-100 flex items-center gap-2">
              <Hash className="w-4 h-4 text-brand-400" />
              Produtos relacionados a <span className="text-brand-400">#{selectedHashtag}</span>
            </h2>
            <button
              onClick={() => setSelectedHashtag(null)}
              className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {loadingHashtagProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card animate-pulse h-64 bg-gray-800 border-gray-700" />
              ))}
            </div>
          ) : (hashtagProducts?.items ?? []).length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Nenhum produto encontrado para #{selectedHashtag}. Tente outro hashtag.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {(hashtagProducts?.items ?? []).slice(0, 8).map((product: any) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onImport={(p) => toast.success(`Importando ${p.name}...`)}
                  onGenerateAds={(p) => toast.loading(`Gerando anúncios para ${p.name}...`)}
                  onFindSupplier={(p) => toast.loading(`Buscando fornecedores para ${p.name}...`)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
