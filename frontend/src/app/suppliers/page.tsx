"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Package, Star, DollarSign,
  ExternalLink, Search, RefreshCw,
} from "lucide-react";
import { suppliersApi } from "@/lib/api";
import { usePreferences, convertPrice } from "@/store/preferences";

const PLATFORM_BADGES: Record<string, { label: string; color: string }> = {
  aliexpress:     { label: "AliExpress",     color: "text-red-400 bg-red-400/10" },
  alibaba:        { label: "Alibaba",         color: "text-orange-400 bg-orange-400/10" },
  cj_dropshipping:{ label: "CJ Dropshipping", color: "text-green-400 bg-green-400/10" },
  temu:           { label: "Temu",            color: "text-purple-400 bg-purple-400/10" },
};

function ProfitBadge({ margin }: { margin: number }) {
  const color =
    margin >= 60 ? "text-green-400 bg-green-400/10" :
    margin >= 40 ? "text-amber-400 bg-amber-400/10" :
    "text-red-400 bg-red-400/10";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {margin.toFixed(0)}% margem
    </span>
  );
}

function SupplierCard({ supplier, currency }: { supplier: any; currency: any }) {
  const badge = PLATFORM_BADGES[supplier.platform] ?? {
    label: supplier.platform, color: "text-gray-400 bg-gray-400/10",
  };

  return (
    <div className="card hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
              {badge.label}
            </span>
            {supplier.is_verified && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 font-medium">
                ✓ Verificado
              </span>
            )}
          </div>
          <h3 className="text-white font-semibold text-sm truncate">{supplier.name}</h3>
        </div>
        <div className="flex items-center gap-1 ml-3">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="text-sm text-amber-400 font-medium">
            {Number(supplier.rating ?? 0).toFixed(1)}
          </span>
        </div>
      </div>

      {/* Listings */}
      {supplier.listings && supplier.listings.length > 0 && (
        <div className="space-y-2 mb-4">
          {supplier.listings.slice(0, 3).map((listing: any) => (
            <div
              key={listing.id}
              className="bg-gray-800/60 rounded-lg p-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 truncate">{listing.product_name}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-sm font-semibold text-white">
                    {convertPrice(Number(listing.cost_price), currency)}
                  </span>
                  {listing.shipping_cost > 0 && (
                    <span className="text-xs text-gray-500">
                      +{convertPrice(Number(listing.shipping_cost), currency)} frete
                    </span>
                  )}
                  <span className="text-xs text-gray-500">MOQ {listing.moq}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <ProfitBadge margin={Number(listing.profit_margin_pct ?? 0)} />
                <p className="text-xs text-gray-500 mt-1">
                  {listing.lead_time_days}d prazo
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {supplier.ships_to?.length > 0 && (
            <span>
              Envia para {supplier.ships_to.slice(0, 2).join(", ")}
              {supplier.ships_to.length > 2 ? ` +${supplier.ships_to.length - 2}` : ""}
            </span>
          )}
        </div>
        {supplier.store_url && (
          <a
            href={supplier.store_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            Ver Loja <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  const [search, setSearch]       = useState("");
  const [platform, setPlatform]   = useState("all");
  const [minMargin, setMinMargin] = useState(0);
  const { currency } = usePreferences();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["suppliers", platform, minMargin],
    queryFn: () => suppliersApi.list({ platform: platform === "all" ? undefined : platform }),
  });

  const suppliers = (data ?? []).filter((s: any) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const maxMargin = Math.max(...(s.listings ?? []).map((l: any) => Number(l.profit_margin_pct ?? 0)), 0);
    return matchSearch && maxMargin >= minMargin;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fornecedores</h1>
          <p className="text-gray-400 text-sm mt-1">
            Descubra fornecedores dropship com as melhores margens de lucro
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar fornecedores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Platform filter */}
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-brand-500"
        >
          <option value="all">Todas as Plataformas</option>
          <option value="aliexpress">AliExpress</option>
          <option value="alibaba">Alibaba</option>
          <option value="cj_dropshipping">CJ Dropshipping</option>
          <option value="temu">Temu</option>
        </select>

        {/* Margin filter */}
        <select
          value={minMargin}
          onChange={(e) => setMinMargin(Number(e.target.value))}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-brand-500"
        >
          <option value={0}>Qualquer Margem</option>
          <option value={30}>≥ 30%</option>
          <option value={50}>≥ 50%</option>
          <option value={60}>≥ 60%</option>
          <option value={70}>≥ 70%</option>
        </select>
      </div>

      {/* Stats bar */}
      <div className="flex gap-6 text-sm text-gray-500">
        <span>
          <span className="text-white font-semibold">{suppliers.length}</span> fornecedores encontrados
        </span>
        <span>
          <span className="text-green-400 font-semibold">
            {suppliers.filter((s: any) =>
              Math.max(...(s.listings ?? []).map((l: any) => Number(l.profit_margin_pct ?? 0)), 0) >= 60
            ).length}
          </span>{" "}
          alta margem (≥60%)
        </span>
        <span>
          <span className="text-brand-400 font-semibold">
            {suppliers.filter((s: any) => s.is_verified).length}
          </span>{" "}
          verificados
        </span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-800 rounded w-1/2 mb-4" />
              <div className="space-y-2">
                <div className="h-16 bg-gray-800 rounded-lg" />
                <div className="h-16 bg-gray-800 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-600">
          <Package className="w-10 h-10 mb-3" />
          <p className="text-lg font-medium">Nenhum fornecedor encontrado</p>
          <p className="text-sm mt-1">Tente ajustar os filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {suppliers.map((supplier: any) => (
            <SupplierCard key={supplier.id} supplier={supplier} currency={currency} />
          ))}
        </div>
      )}
    </div>
  );
}
