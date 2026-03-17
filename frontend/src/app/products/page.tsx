"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { productsApi, api } from "@/lib/api";
import { ProductCard } from "@/components/cards/ProductCard";
import { ShopifyImportModal } from "@/components/modals/ShopifyImportModal";
import { TrendingUp, Package, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useT } from "@/store/preferences";

const CATEGORIES = [
  "All",
  "Electronics",
  "Beauty & Personal Care",
  "Home & Kitchen",
  "Sports & Outdoors",
  "Health & Wellness",
  "Clothing & Accessories",
  "Toys & Games",
];

const CATEGORY_PT: Record<string, string> = {
  "All": "Todos",
  "Electronics": "Eletrônicos",
  "Beauty & Personal Care": "Beleza e Cuidados",
  "Home & Kitchen": "Casa e Cozinha",
  "Sports & Outdoors": "Esportes e Lazer",
  "Health & Wellness": "Saúde e Bem-estar",
  "Clothing & Accessories": "Roupas e Acessórios",
  "Toys & Games": "Brinquedos e Jogos",
};

const MARGIN_OPTIONS = [
  { label: "Qualquer Margem", value: 0 },
  { label: ">50%", value: 50 },
  { label: ">60%", value: 60 },
  { label: ">70%", value: 70 },
  { label: ">80%", value: 80 },
];

function getEstimatedMarginNum(min?: number, max?: number, demandScore?: number): number {
  if (!min && !max) return 0;
  const avgCost = ((min || 0) + (max || min || 0)) / 2;
  if (avgCost <= 0) return 0;
  const multiplier = 2.5 + ((demandScore || 50) / 100) * 1.5;
  const salePrice = avgCost * multiplier;
  return ((salePrice - avgCost) / salePrice) * 100;
}

export default function ProductsPage() {
  const [category, setCategory] = useState<string | undefined>();
  const [minScore, setMinScore] = useState(0);
  const [minMargin, setMinMargin] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("viral_score");
  const [refreshingImages, setRefreshingImages] = useState(false);
  const [shopifyProduct, setShopifyProduct] = useState<any>(null);
  const t = useT();
  const queryClient = useQueryClient();

  const handleRefreshImages = async () => {
    setRefreshingImages(true);
    try {
      const { data } = await api.post("/products/refresh-images");
      toast.success(`🖼️ ${data.updated} imagens atualizadas de ${data.total} produtos!`);
    } catch {
      toast.error("Erro ao atualizar imagens. Tente novamente.");
    } finally {
      setRefreshingImages(false);
    }
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", { category, minScore, page, sortBy }],
    queryFn: () =>
      productsApi
        .list({
          category: category || undefined,
          min_viral_score: minScore,
          page,
          limit: 20,
          sort_by: sortBy,
        })
        .then((r) => r.data),
    retry: 2,
  });

  const handleImport = (p: any) => {
    setShopifyProduct(p);
  };

  const handleGenerateAds = async (p: any) => {
    const toastId = toast.loading("🤖 Gerando assets de marketing com IA...");
    try {
      await productsApi.generateMarketing(p.id, [
        "headline",
        "description",
        "hook",
        "caption",
      ]);
      toast.success("🎯 Assets gerados! Veja em Campanhas.", { id: toastId });
    } catch {
      toast.error("Erro ao gerar assets. Tente novamente.", { id: toastId });
    }
  };

  const handleFindSupplier = async (p: any) => {
    const toastId = toast.loading("🔍 Buscando fornecedores dropship...");
    try {
      await productsApi.findSuppliers(p.id);
      toast.success("📦 Fornecedores encontrados! Veja em Suppliers.", {
        id: toastId,
      });
    } catch {
      toast.error("Erro ao buscar fornecedores. Tente novamente.", {
        id: toastId,
      });
    }
  };

  const handleGenerateThumbnail = async (p: any) => {
    const toastId = toast.loading("✨ Gerando thumbnail com IA...");
    try {
      await api.post(`/products/${p.id}/generate-thumbnail`);
      toast.success("🎨 Thumbnail gerada! Atualize para ver.", { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch {
      toast.error("Erro ao gerar thumbnail. Verifique a chave OpenAI no .env", { id: toastId });
    }
  };

  // Client-side margin filter
  const filteredItems = (data?.items ?? []).filter((p) => {
    if (minMargin === 0) return true;
    const margin = getEstimatedMarginNum(
      p.estimated_price_min,
      p.estimated_price_max,
      p.demand_score
    );
    return margin >= minMargin;
  });

  // Client-side sort for "Maior Margem" and "Menor Preço"
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "highest_margin") {
      return (
        getEstimatedMarginNum(b.estimated_price_min, b.estimated_price_max, b.demand_score) -
        getEstimatedMarginNum(a.estimated_price_min, a.estimated_price_max, a.demand_score)
      );
    }
    if (sortBy === "lowest_price") {
      return (a.estimated_price_min ?? 0) - (b.estimated_price_min ?? 0);
    }
    return 0; // backend already sorted for viral_score and updated_at
  });

  return (
    <>
    {shopifyProduct && (
      <ShopifyImportModal
        product={shopifyProduct}
        onClose={() => setShopifyProduct(null)}
      />
    )}
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.products.title}</h1>
          <p className="text-sm text-gray-400">
            {data?.total?.toLocaleString() ?? "—"} {t.products.discovered}
          </p>
        </div>
        <button
          onClick={handleRefreshImages}
          disabled={refreshingImages}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshingImages ? "animate-spin" : ""}`} />
          {refreshingImages ? t.products.refreshing : t.products.refreshImages}
        </button>
      </div>

      {/* Filtros */}
      <div className="card space-y-3">
        {/* Category tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat === "All" ? undefined : cat);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                (cat === "All" && !category) || category === cat
                  ? "bg-sky-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {CATEGORY_PT[cat] ?? cat}
            </button>
          ))}
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500"
          >
            <option value="viral_score">{t.products.topViral}</option>
            <option value="highest_margin">Maior Margem</option>
            <option value="lowest_price">Menor Preço</option>
            <option value="updated_at">{t.products.newest}</option>
          </select>

          {/* Margin filter */}
          <select
            value={minMargin}
            onChange={(e) => { setMinMargin(Number(e.target.value)); setPage(1); }}
            className="bg-gray-800 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500"
          >
            {MARGIN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Min score slider */}
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <input
              type="range"
              min={0}
              max={100}
              value={minScore}
              onChange={(e) => {
                setMinScore(Number(e.target.value));
                setPage(1);
              }}
              className="w-24 accent-sky-500"
            />
            <span className="text-xs text-gray-400 w-8">{minScore}+</span>
          </div>
        </div>
      </div>

      {/* Grid de Produtos */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse h-72 bg-gray-800 border-gray-700" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Package className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm text-center">
            Erro ao carregar produtos. Verifique a conexão com o servidor.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs rounded-lg transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      ) : !sortedItems.length ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <TrendingUp className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm text-center">
            {t.products.noProducts}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedItems.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onImport={handleImport}
              onGenerateAds={handleGenerateAds}
              onFindSupplier={handleFindSupplier}
              onGenerateThumbnail={handleGenerateThumbnail}
            />
          ))}
        </div>
      )}

      {/* Paginação */}
      {data && data.total > 20 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-700 transition-colors"
          >
            Anterior
          </button>
          <span className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm">
            Página {page} de {Math.ceil(data.total / 20)}
          </span>
          <button
            disabled={page >= Math.ceil(data.total / 20)}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-700 transition-colors"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
    </>
  );
}
