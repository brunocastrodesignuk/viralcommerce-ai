"use client";

import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/lib/api";
import { ProductCard } from "@/components/cards/ProductCard";
import { useWatchlist } from "@/store/watchlist";
import { Bookmark } from "lucide-react";
import toast from "react-hot-toast";

export default function WatchlistPage() {
  const watchlist = useWatchlist();

  const { data, isLoading } = useQuery({
    queryKey: ["products", { page: 1, limit: 100 }],
    queryFn: () =>
      productsApi
        .list({ page: 1, limit: 100 })
        .then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const savedProducts = (data?.items ?? []).filter((p) => watchlist.has(p.id));

  const handleImport = (p: any) => {
    toast.success(`Importando ${p.name}...`);
  };
  const handleGenerateAds = (p: any) => {
    toast.loading(`Gerando anúncios para ${p.name}...`);
  };
  const handleFindSupplier = (p: any) => {
    toast.loading(`Buscando fornecedores para ${p.name}...`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-sky-400" />
          Favoritos
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {watchlist.ids.length} produto{watchlist.ids.length !== 1 ? "s" : ""} salvo{watchlist.ids.length !== 1 ? "s" : ""}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse h-72 bg-gray-800 border-gray-700" />
          ))}
        </div>
      ) : watchlist.ids.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Bookmark className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm text-center">
            Nenhum produto salvo ainda — clique em ♥ para salvar
          </p>
          <a
            href="/products"
            className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs rounded-lg transition-colors"
          >
            Explorar Produtos
          </a>
        </div>
      ) : savedProducts.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Bookmark className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm text-center">
            Seus favoritos estão salvos. Carregando dados dos produtos...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {savedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onImport={handleImport}
              onGenerateAds={handleGenerateAds}
              onFindSupplier={handleFindSupplier}
            />
          ))}
        </div>
      )}
    </div>
  );
}
