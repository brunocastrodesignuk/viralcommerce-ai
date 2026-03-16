"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/lib/api";
import { ProductCard } from "@/components/cards/ProductCard";
import { Search, TrendingUp, CheckCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = ["All", "Electronics", "Beauty & Personal Care", "Home & Kitchen", "Sports & Outdoors", "Clothing & Accessories", "Toys & Games"];

export default function ProductsPage() {
  const [category, setCategory] = useState<string | undefined>();
  const [minScore, setMinScore] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("viral_score");
  const [loadingActions, setLoadingActions] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["products", { category, minScore, page, sortBy }],
    queryFn: () =>
      productsApi.list({ category: category || undefined, min_viral_score: minScore, page, limit: 20, sort_by: sortBy })
        .then((r) => r.data),
  });

  const handleImport = async (p: any) => {
    setLoadingActions(prev => ({ ...prev, [`import-${p.id}`]: "loading" }));
    try {
      toast.success(`✅ ${p.name} imported to your store!`);
    } finally {
      setLoadingActions(prev => { const n = { ...prev }; delete n[`import-${p.id}`]; return n; });
    }
  };

  const handleGenerateAds = async (p: any) => {
    setLoadingActions(prev => ({ ...prev, [`ads-${p.id}`]: "loading" }));
    const toastId = toast.loading("🤖 Generating AI marketing assets...");
    try {
      await productsApi.generateMarketing(p.id, ["headline", "description", "hook", "caption"]);
      toast.success("🎯 Marketing assets generated! Check Campaigns.", { id: toastId });
    } catch {
      toast.error("Failed to generate assets. Try again.", { id: toastId });
    } finally {
      setLoadingActions(prev => { const n = { ...prev }; delete n[`ads-${p.id}`]; return n; });
    }
  };

  const handleFindSupplier = async (p: any) => {
    setLoadingActions(prev => ({ ...prev, [`supplier-${p.id}`]: "loading" }));
    const toastId = toast.loading("🔍 Searching dropship suppliers...");
    try {
      await productsApi.findSuppliers(p.id);
      toast.success("📦 Suppliers found! Check Suppliers page.", { id: toastId });
    } catch {
      toast.error("Failed to find suppliers. Try again.", { id: toastId });
    } finally {
      setLoadingActions(prev => { const n = { ...prev }; delete n[`supplier-${p.id}`]; return n; });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Viral Products</h1>
          <p className="text-sm text-gray-400">{data?.total?.toLocaleString() ?? 0} products discovered</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat === "All" ? undefined : cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                (cat === "All" && !category) || category === cat
                  ? "bg-sky-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500"
        >
          <option value="viral_score">Top Viral</option>
          <option value="updated_at">Latest</option>
        </select>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-500" />
          <input type="range" min={0} max={100} value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))} className="w-24" />
          <span className="text-xs text-gray-400 w-8">{minScore}+</span>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse h-72 bg-gray-800" />
          ))}
        </div>
      ) : !data?.items?.length ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <TrendingUp className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">No products yet. Start the crawler to discover viral products!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.items?.map((product) => (
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

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-700">
            Previous
          </button>
          <span className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm">
            Page {page} of {Math.ceil(data.total / 20)}
          </span>
          <button onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
