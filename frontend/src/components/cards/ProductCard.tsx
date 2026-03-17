"use client";

import { Product } from "@/lib/api";
import { ViralScoreBadge } from "@/components/ui/ViralScoreBadge";
import { ArrowUpRight, ShoppingCart, Zap, Package } from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { usePreferences, convertPrice } from "@/store/preferences";

interface ProductCardProps {
  product: Product;
  onImport?: (p: Product) => void;
  onGenerateAds?: (p: Product) => void;
  onFindSupplier?: (p: Product) => void;
  onClick?: (p: Product) => void;
}

export function ProductCard({
  product,
  onImport,
  onGenerateAds,
  onFindSupplier,
  onClick,
}: ProductCardProps) {
  const img      = product.image_urls?.[0];
  const router   = useRouter();
  const { currency } = usePreferences();

  const handleCardClick = () => {
    if (onClick) {
      onClick(product);
    } else {
      router.push(`/products/${product.id}`);
    }
  };

  const priceMin = product.estimated_price_min;
  const priceMax = product.estimated_price_max;
  const priceStr =
    priceMin && priceMax
      ? `${convertPrice(priceMin, currency)} – ${convertPrice(priceMax, currency)}`
      : "—";

  return (
    <div
      className="card hover:border-sky-500/30 cursor-pointer transition-all group"
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className="relative h-44 bg-gray-800 rounded-lg mb-4 overflow-hidden">
        {img ? (
          <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-600" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <ViralScoreBadge score={product.viral_score} />
        </div>
        <div className="absolute top-2 left-2">
          <span className="badge bg-gray-900/80 text-gray-300 text-xs">{product.category}</span>
        </div>
      </div>

      {/* Info */}
      <h3 className="font-semibold text-gray-100 text-sm leading-snug mb-2 line-clamp-2">
        {product.name}
      </h3>

      {/* Price range */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500">Custo do fornecedor</p>
          <p className="text-sm font-bold text-green-400">{priceStr}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Margem estimada</p>
          <p className="text-sm font-bold text-brand-400">
            {getEstimatedMargin(priceMin, priceMax)}%
          </p>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <ScorePill label="Viral"   value={product.viral_score}               color="text-red-400" />
        <ScorePill label="Demanda" value={product.demand_score}              color="text-brand-400" />
        <ScorePill label="Competir" value={100 - product.competition_score}  color="text-green-400" />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2" onClick={(e) => e.stopPropagation()}>
        <ActionButton
          icon={<ShoppingCart className="w-3 h-3" />}
          label="Importar"
          onClick={() => onImport?.(product)}
          className="bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border-brand-500/20"
        />
        <ActionButton
          icon={<Zap className="w-3 h-3" />}
          label="Gerar anúncios"
          onClick={() => onGenerateAds?.(product)}
          className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/20"
        />
        <ActionButton
          icon={<ArrowUpRight className="w-3 h-3" />}
          label="Fornecedor"
          onClick={() => onFindSupplier?.(product)}
          className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20"
        />
      </div>
    </div>
  );
}

function ScorePill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-2 text-center">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${color}`}>{Math.round(value)}</p>
    </div>
  );
}

function ActionButton({
  icon, label, onClick, className,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs font-medium transition-colors",
        className
      )}
    >
      {icon}
      <span className="leading-none">{label}</span>
    </button>
  );
}

function getEstimatedMargin(min?: number, max?: number): string {
  if (!min || !max) return "~";
  const avgCost  = (min + max) / 2;
  const salePrice = avgCost * 3;
  const margin   = ((salePrice - avgCost) / salePrice) * 100;
  return Math.round(margin).toString();
}
