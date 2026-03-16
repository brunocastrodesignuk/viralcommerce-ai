"""
Amazon Spider — Scrapes trending and best-seller product pages.

Crawls:
  - /best-sellers (multiple categories)
  - /movers-and-shakers
  - Product detail pages for detected products
"""
import json
import re
import logging
from datetime import datetime, timezone
from typing import Optional

import scrapy
from scrapy.http import Response
from crawler.items import ProductDetectionItem

log = logging.getLogger(__name__)

BEST_SELLER_CATEGORIES = [
    "electronics",
    "beauty",
    "health-personal-care",
    "toys-and-games",
    "home-kitchen",
    "clothing",
    "sports-outdoors",
    "office-products",
    "pet-supplies",
    "tools-home-improvement",
]

BASE_URL = "https://www.amazon.com"


class AmazonSpider(scrapy.Spider):
    name = "amazon"
    allowed_domains = ["amazon.com", "www.amazon.com"]
    custom_settings = {
        "DOWNLOAD_DELAY": 3,
        "RANDOMIZE_DOWNLOAD_DELAY": True,
        "RETRY_TIMES": 5,
        "DEFAULT_REQUEST_HEADERS": {
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml",
        },
    }

    def start_requests(self):
        # Movers and shakers (fastest gaining rank)
        yield scrapy.Request(
            f"{BASE_URL}/gp/movers-and-shakers/",
            callback=self.parse_movers,
            meta={"page_type": "movers"},
        )
        # Best sellers per category
        for category in BEST_SELLER_CATEGORIES:
            yield scrapy.Request(
                f"{BASE_URL}/best-sellers/{category}/",
                callback=self.parse_best_sellers,
                meta={"category": category},
            )

    # ── Movers & Shakers ─────────────────────────────────────────────────────

    def parse_movers(self, response: Response):
        """Parse the movers & shakers page — products with biggest rank gains."""
        # Each product card
        for item in response.css("div.zg-item-immersion"):
            yield from self._parse_product_card(item, response.url, source="movers")

        # Pagination
        next_page = response.css("li.a-last a::attr(href)").get()
        if next_page:
            yield response.follow(next_page, callback=self.parse_movers)

    # ── Best Sellers ─────────────────────────────────────────────────────────

    def parse_best_sellers(self, response: Response):
        category = response.meta.get("category", "unknown")
        for item in response.css("div.zg-item-immersion"):
            yield from self._parse_product_card(item, response.url, source=f"bestseller:{category}")

        next_page = response.css("li.a-last a::attr(href)").get()
        if next_page:
            yield response.follow(
                next_page,
                callback=self.parse_best_sellers,
                meta={"category": category},
            )

    # ── Product Card Parsing ──────────────────────────────────────────────────

    def _parse_product_card(self, selector, page_url: str, source: str):
        """Extract product data from a best-seller/movers card."""
        name = (
            selector.css("div.p13n-sc-truncated::text").get()
            or selector.css("span.zg-text-center-align a::text").get()
            or selector.css("a.a-link-normal span::text").get()
            or ""
        ).strip()

        if not name:
            return

        product_url = selector.css("a.a-link-normal::attr(href)").get()
        if product_url:
            product_url = response_url = BASE_URL + product_url if not product_url.startswith("http") else product_url
        else:
            return

        asin = self._extract_asin(product_url)
        if not asin:
            return

        price_str = (
            selector.css("span.p13n-sc-price::text").get()
            or selector.css("span._cDEzb_p13n-sc-price_3mJ9Z::text").get()
            or ""
        ).strip()
        price = self._parse_price(price_str)

        rank_change = (
            selector.css("span.zg-bdg-text::text").get() or ""
        ).strip()

        image_url = (
            selector.css("img.s-image::attr(src)").get()
            or selector.css("img::attr(src)").get()
            or ""
        )

        # Yield basic product item; follow URL for full details
        item = ProductDetectionItem()
        item["product_name"] = name
        item["source_url"] = product_url
        item["platform"] = "amazon"
        item["external_id"] = asin
        item["estimated_price"] = price
        item["image_url"] = image_url
        item["confidence_score"] = 0.85
        item["source"] = source
        item["detected_at"] = datetime.now(timezone.utc).isoformat()
        item["metadata"] = {
            "asin": asin,
            "rank_change": rank_change,
            "category": source.split(":")[-1] if ":" in source else "unknown",
        }
        yield item

        # Follow to product detail page for enriched data
        yield scrapy.Request(
            product_url,
            callback=self.parse_product_detail,
            meta={"asin": asin, "name": name, "source": source},
            priority=1,
        )

    # ── Product Detail ────────────────────────────────────────────────────────

    def parse_product_detail(self, response: Response):
        """Parse full product detail page for reviews, ratings, Q&A count."""
        asin = response.meta.get("asin")
        name = response.meta.get("name")
        source = response.meta.get("source")

        # Rating
        rating_str = response.css("span.a-icon-alt::text").get() or ""
        rating = self._parse_float(rating_str.split(" ")[0])

        # Review count
        review_count_str = (
            response.css("#acrCustomerReviewText::text").get()
            or response.css("span[data-hook='total-review-count']::text").get()
            or "0"
        )
        review_count = self._parse_int(review_count_str)

        # Price on detail page (more reliable)
        price_str = (
            response.css("span.a-price-whole::text").get()
            or response.css("span#priceblock_ourprice::text").get()
            or ""
        ).strip()
        price = self._parse_price(price_str)

        # Category breadcrumb
        categories = response.css(
            "#wayfinding-breadcrumbs_feature_div ul li:not(.a-breadcrumb-divider) span::text"
        ).getall()
        category = " > ".join(c.strip() for c in categories if c.strip())

        # Amazon's Choice / Best Seller badge
        is_best_seller = bool(response.css("#bestsellersrank_feature_div").get())
        is_ac = bool(response.css("span.ac-badge-rectangle").get())

        # BSR rank text
        bsr_text = (
            response.css("#salesRank .zg_hrsr_rank::text").get()
            or response.css("#SalesRank::text").getall()
        )

        item = ProductDetectionItem()
        item["product_name"] = name
        item["source_url"] = response.url
        item["platform"] = "amazon"
        item["external_id"] = asin
        item["estimated_price"] = price
        item["confidence_score"] = 0.90
        item["source"] = source
        item["detected_at"] = datetime.now(timezone.utc).isoformat()
        item["metadata"] = {
            "asin": asin,
            "rating": rating,
            "review_count": review_count,
            "category": category,
            "is_best_seller": is_best_seller,
            "is_amazons_choice": is_ac,
            "bsr": bsr_text,
        }
        yield item

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _extract_asin(self, url: str) -> Optional[str]:
        match = re.search(r"/dp/([A-Z0-9]{10})", url)
        return match.group(1) if match else None

    def _parse_price(self, price_str: str) -> Optional[float]:
        cleaned = re.sub(r"[^\d.]", "", price_str)
        try:
            return float(cleaned)
        except (ValueError, TypeError):
            return None

    def _parse_float(self, s: str) -> Optional[float]:
        try:
            return float(s.replace(",", ""))
        except (ValueError, TypeError):
            return None

    def _parse_int(self, s: str) -> int:
        cleaned = re.sub(r"[^\d]", "", s)
        try:
            return int(cleaned)
        except (ValueError, TypeError):
            return 0
