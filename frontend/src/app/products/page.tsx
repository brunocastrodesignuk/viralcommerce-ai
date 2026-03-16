"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/lib/api";
import { ProductCard } from "@/components/cards/ProductCard";
import { Search, SlidersHorizontal, TrendingUp } from "lucide-react";

const CATEGORIES = ["All", "Electronics", "Beauty & Personal Care", "Home & Kitchen", "Sports & Outdoors", "Clothing & Accessories", "Toys & Games"];

export default function ProductsPage() {
  const [category, setCategory] = useState<string | undefined>();
  const [minScore, setMinScore] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("viral_score");

  const { data, isLoading } = useQuery({
    queryKey: ["products", { category, minScore, page, sortBy }],
    queryFn: () =>
      productsApi.list({ category: category || undefined, min_viral_score: minScore, page, limit: 20, sort_by: sortBy })
        .then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Viral Products</h1>
          <p className="text-sm text-gray-400">{data?.total?.toLocaleString() ?? 0} products discovered</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex items-center gap-4">
        {/* Category pills */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat === "All" ? undefined : cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                (cat === "All" && !category) || category === cat
                  ? "bg-brand-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-500"
        >
          <option value="viral_score">Top Viral</option>
          <option value="updated_at">Latest</option>
        </select>

        {/* Min score */}
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-500" />
          <input
            type="range"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-xs text-gray-400 w-8">{minScore}+</span>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse h-72 bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {data?.items?.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onImport={(p) => console.log("Import", p.id)}
              onGenerateAds={(p) => console.log("Ads", p.id)}
              onFindSupplier={(p) => console.log("Supplier", p.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-sm disabled:opacity-40">
            Previous
          </button>
          <span className="btn-secondary text-sm cursor-default">
            Page {page} of {Math.ceil(data.total / 20)}
          </span>
          <button onClick={() => setPage(p => p + 1)} className="btn-secondary text-sm">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
