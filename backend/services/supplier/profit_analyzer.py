"""
Profit Analysis Engine
Calculates ROI, competition score, and demand estimates for products.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Optional


@dataclass
class ProfitReport:
    product_name: str
    supplier_cost: float
    shipping_cost: float
    total_cost: float
    suggested_sale_price: float
    profit: float
    profit_margin_pct: float
    roi_pct: float
    competition_score: float     # 0-100, higher = more competition
    demand_score: float          # 0-100, higher = more demand
    opportunity_score: float     # 0-100, composite opportunity

    def summary(self) -> str:
        return (
            f"Product: {self.product_name}\n"
            f"Cost: ${self.total_cost:.2f} → Sale: ${self.suggested_sale_price:.2f}\n"
            f"Profit: ${self.profit:.2f} ({self.profit_margin_pct:.0f}% margin, {self.roi_pct:.0f}% ROI)\n"
            f"Opportunity Score: {self.opportunity_score:.0f}/100"
        )


class ProfitAnalyzer:
    """
    Calculates profit metrics and opportunity scores for viral products.

    Example:
        supplier_cost = $5
        sale_price    = $25
        profit_margin = (25-5)/25 = 80%
        ROI           = (25-5)/5  = 400%
    """

    # Platform fee assumptions
    PLATFORM_FEE_PCT = {
        "tiktok_shop": 0.08,     # 8%
        "shopify":     0.02,     # 2% (payment processing)
        "amazon_fba":  0.15,     # 15%
        "etsy":        0.065,    # 6.5%
        "direct":      0.029,    # payment processor only
    }

    # Suggested markup multipliers by category
    CATEGORY_MARKUP = {
        "Electronics": 2.5,
        "Beauty & Personal Care": 4.0,
        "Home & Kitchen": 3.5,
        "Sports & Outdoors": 3.0,
        "Clothing & Accessories": 3.5,
        "Toys & Games": 3.0,
        "General": 3.0,
    }

    def analyze(
        self,
        supplier_cost: float,
        shipping_cost: float,
        viral_score: float,
        category: str = "General",
        market_price: Optional[float] = None,
        competitor_count: int = 50,
        platform: str = "direct",
    ) -> ProfitReport:
        """
        Full profit analysis for a product.

        Args:
            supplier_cost: Cost from supplier (USD)
            shipping_cost: Shipping to customer (USD)
            viral_score: 0-100 viral score
            category: Product category
            market_price: Override suggested price if known
            competitor_count: Number of competing listings
            platform: Selling platform for fee calculation
        """
        total_cost = supplier_cost + shipping_cost
        platform_fee_pct = self.PLATFORM_FEE_PCT.get(platform, 0.029)
        markup = self.CATEGORY_MARKUP.get(category, 3.0)

        # Suggested price
        if market_price:
            sale_price = market_price
        else:
            # Price before fees
            base_price = total_cost * markup
            # Adjust for platform fees
            sale_price = base_price / (1 - platform_fee_pct)
            sale_price = round(sale_price, 2)

        # Profit calculation
        gross_profit = sale_price - total_cost
        platform_fee = sale_price * platform_fee_pct
        net_profit = gross_profit - platform_fee

        profit_margin_pct = (net_profit / sale_price * 100) if sale_price > 0 else 0
        roi_pct = (net_profit / total_cost * 100) if total_cost > 0 else 0

        # Competition score (higher = more competitive / harder)
        competition_score = min(math.log10(max(competitor_count, 1)) / math.log10(10000) * 100, 100)

        # Demand score (based on viral score + margin attractiveness)
        demand_score = min(viral_score * 0.7 + (markup - 1) * 10, 100)

        # Opportunity = demand - competition (adjusted)
        opportunity_score = max(
            demand_score * 0.6 + (100 - competition_score) * 0.4,
            0
        )

        return ProfitReport(
            product_name="",
            supplier_cost=round(supplier_cost, 2),
            shipping_cost=round(shipping_cost, 2),
            total_cost=round(total_cost, 2),
            suggested_sale_price=round(sale_price, 2),
            profit=round(net_profit, 2),
            profit_margin_pct=round(profit_margin_pct, 1),
            roi_pct=round(roi_pct, 1),
            competition_score=round(competition_score, 1),
            demand_score=round(demand_score, 1),
            opportunity_score=round(opportunity_score, 1),
        )

    def quick_calc(self, cost: float, sale_price: float) -> dict:
        """Fast inline profit calculation."""
        profit = sale_price - cost
        margin = (profit / sale_price * 100) if sale_price > 0 else 0
        roi = (profit / cost * 100) if cost > 0 else 0
        return {
            "cost": round(cost, 2),
            "sale_price": round(sale_price, 2),
            "profit": round(profit, 2),
            "margin_pct": round(margin, 1),
            "roi_pct": round(roi, 1),
        }
