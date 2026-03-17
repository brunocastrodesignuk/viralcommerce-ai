"use client";

import { Product } from "@/lib/api";
import { ViralScoreBadge } from "@/components/ui/ViralScoreBadge";
import { ArrowUpRight, ShoppingCart, Zap, Package, Star } from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { usePreferences, convertPrice } from "@/store/preferences";

interface ProductCardProps {
  product: Product;
  onImport?: (p: Product) => void;
  onGenerateAds?: (p: Product) => void;
  onFindSupplier?: (p: Product) => void;
  onGenerateThumbnail?: (p: Product) => void;
  onClick?: (p: Product) => void;
}

export function ProductCard({
  product,
  onImport,
  onGenerateAds,
  onFindSupplier,
  onGenerateThumbnail,
  onClick,
}: ProductCardProps) {
  const img    = product.image_urls?.[0];
  const router = useRouter();
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

  // Star rating: demand_score maps 0–100 → 4.0–5.0
  const starRating = parseFloat((4.0 + (product.demand_score / 100) * 1.0).toFixed(1));
  const fullStars  = Math.floor(starRating);
  const halfStar   = starRating - fullStars >= 0.5;

  return (
    <div
      className="card p-0 overflow-hidden hover:border-sky-500/30 cursor-pointer transition-all group flex flex-col"
      onClick={handleCardClick}
    >
      {/* Product Image — edge-to-edge, no overlay */}
      <div className="relative h-56 bg-gray-800 overflow-hidden flex-shrink-0">
        {img ? (
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Fallback to category-based loremflickr if image fails
              const target = e.currentTarget;
              const seed = Math.abs(product.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 9999;
              target.src = `https://loremflickr.com/400/400/product,shop?lock=${seed}`;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-600" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 right-2">
          <ViralScoreBadge score={product.viral_score} />
        </div>
        <div className="absolute top-2 left-2">
          <span className="badge bg-gray-900/80 backdrop-blur-sm text-gray-300 text-xs">{product.category}</span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        {/* Name */}
        <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">
          {product.name}
        </h3>

        {/* Star Rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: fullStars }).map((_, i) => (
              <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            ))}
            {halfStar && (
              <div className="relative w-3 h-3">
                <Star className="absolute w-3 h-3 text-gray-600 fill-gray-600" />
                <div className="absolute inset-0 overflow-hidden w-1/2">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                </div>
              </div>
            )}
            {Array.from({ length: 5 - fullStars - (halfStar ? 1 : 0) }).map((_, i) => (
              <Star key={`e-${i}`} className="w-3 h-3 text-gray-600" />
            ))}
          </div>
          <span className="text-xs text-yellow-400 font-medium">{starRating}</span>
          <span className="text-xs text-gray-500">({(product.demand_score * 12 + 80).toFixed(0)} avaliações)</span>
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-1 mt-auto pt-1">
          <span className="text-lg font-bold text-green-400">{priceStr}</span>
          <span className="text-xs text-gray-500">fornecedor</span>
        </div>

        {/* Estimated margin badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Margem estimada:</span>
          <span className="text-xs font-bold text-brand-400">
            ~{getEstimatedMargin(priceMin, priceMax)}%
          </span>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
          <ActionButton
            icon={<ShoppingCart className="w-3 h-3" />}
            label="Importar"
            onClick={() => onImport?.(product)}
            className="bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border-brand-500/20"
          />
          <ActionButton
            icon={<Zap className="w-3 h-3" />}
            label="Anúncios"
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

        {/* AI Thumbnail Button */}
        {onGenerateThumbnail && (
          <button
            onClick={(e) => { e.stopPropagation(); onGenerateThumbnail(product); }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400 text-xs font-medium transition-colors"
          >
            <span>✨</span>
            Gerar Thumbnail com IA
          </button>
        )}
      </div>
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
  const avgCost   = (min + max) / 2;
  const salePrice = avgCost * 3;
  const margin    = ((salePrice - avgCost) / salePrice) * 100;
  return Math.round(margin).toString();
}
