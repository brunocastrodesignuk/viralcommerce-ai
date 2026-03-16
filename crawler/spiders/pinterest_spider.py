"""
Pinterest Spider — Scrapes trending pins, shopping pins, and product boards.

Uses Playwright for JS rendering (Pinterest is heavily client-side).
Targets:
  - /ideas/ (trending ideas feed)
  - /today/ (trending today)
  - Pinterest shopping pins with price data
"""
import json
import re
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

import scrapy
from scrapy_playwright.page import PageMethod
from crawler.items import VideoItem, ProductDetectionItem

log = logging.getLogger(__name__)

TRENDING_URLS = [
    "https://www.pinterest.com/today/",
    "https://www.pinterest.com/ideas/",
    "https://www.pinterest.com/ideas/beauty/913915022169/",
    "https://www.pinterest.com/ideas/fashion/913915022166/",
    "https://www.pinterest.com/ideas/home-decor/913915022136/",
    "https://www.pinterest.com/ideas/health-and-wellness/913915022165/",
    "https://www.pinterest.com/ideas/diy-and-crafts/913915022132/",
]

PRODUCT_CATEGORIES = [
    "beauty", "fashion", "home-decor", "health-wellness",
    "tech-gadgets", "fitness", "kitchen",
]


class PinterestSpider(scrapy.Spider):
    name = "pinterest"
    allowed_domains = ["pinterest.com", "www.pinterest.com"]
    custom_settings = {
        "PLAYWRIGHT_BROWSER_TYPE": "chromium",
        "PLAYWRIGHT_LAUNCH_OPTIONS": {"headless": True},
        "DOWNLOAD_HANDLERS": {
            "http": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
            "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
        },
        "TWISTED_REACTOR": "twisted.internet.asyncioreactor.AsyncioSelectorReactor",
        "DOWNLOAD_DELAY": 2,
        "RANDOMIZE_DOWNLOAD_DELAY": True,
    }

    def start_requests(self):
        for url in TRENDING_URLS:
            yield scrapy.Request(
                url,
                meta={
                    "playwright": True,
                    "playwright_page_methods": [
                        PageMethod("wait_for_selector", "[data-test-id='pin']", timeout=15000),
                        PageMethod("evaluate", "window.scrollBy(0, 2000)"),
                        PageMethod("wait_for_timeout", 2000),
                        PageMethod("evaluate", "window.scrollBy(0, 2000)"),
                        PageMethod("wait_for_timeout", 1500),
                    ],
                },
                callback=self.parse_trending,
            )

    # ── Trending Feed ─────────────────────────────────────────────────────────

    def parse_trending(self, response):
        """Parse Pinterest trending page — extract pins and shopping products."""

        # Try JSON embedded in script tags (Pinterest's initial state)
        script_data = self._extract_initial_state(response)
        if script_data:
            pins = self._extract_pins_from_state(script_data)
            for pin in pins:
                yield from self._build_items(pin)
        else:
            # CSS fallback — parse visible pin cards
            for pin_el in response.css("[data-test-id='pin'], div[data-grid-item]"):
                yield from self._parse_pin_card(pin_el, response.url)

    # ── JSON State Extraction ─────────────────────────────────────────────────

    def _extract_initial_state(self, response) -> Optional[Dict]:
        """Extract Pinterest's embedded Redux/initial state JSON."""
        for script in response.css("script[id='initial-state']::text, script::text").getall():
            if "pinterestapp" in script.lower() or '"pins"' in script or "resourceDataCache" in script:
                # Try to find the JSON blob
                match = re.search(r'P\.start\s*\(\s*"main"\s*,\s*(\{.+?\})\s*\)\s*;', script, re.DOTALL)
                if match:
                    try:
                        return json.loads(match.group(1))
                    except json.JSONDecodeError:
                        pass

                # Try window.__PWS_DATA__
                match2 = re.search(r'window\.__PWS_DATA__\s*=\s*(\{.+?\});', script, re.DOTALL)
                if match2:
                    try:
                        return json.loads(match2.group(1))
                    except json.JSONDecodeError:
                        pass
        return None

    def _extract_pins_from_state(self, state: Dict) -> List[Dict]:
        """Navigate the Pinterest state tree to extract pin objects."""
        pins = []

        def _recurse(obj):
            if isinstance(obj, dict):
                if obj.get("type") == "pin" and "id" in obj:
                    pins.append(obj)
                for v in obj.values():
                    _recurse(v)
            elif isinstance(obj, list):
                for item in obj:
                    _recurse(item)

        _recurse(state)
        return pins[:50]  # Cap to avoid too many

    # ── Pin Card CSS Fallback ─────────────────────────────────────────────────

    def _parse_pin_card(self, selector, page_url: str):
        """CSS-based pin card parser (fallback for when JS state is unavailable)."""
        title = (
            selector.css("div[data-test-id='pin-title'] span::text").get()
            or selector.css("h3::text").get()
            or selector.css("div.tBJ span::text").get()
            or ""
        ).strip()

        if not title:
            return

        pin_url = selector.css("a::attr(href)").get() or ""
        if pin_url and not pin_url.startswith("http"):
            pin_url = "https://www.pinterest.com" + pin_url

        image_url = (
            selector.css("img::attr(src)").get()
            or selector.css("img::attr(data-src)").get()
            or ""
        )

        # Price (shopping pins)
        price_str = (
            selector.css("[data-test-id='pin-price'] span::text").get()
            or selector.css("span.price::text").get()
            or ""
        ).strip()
        price = self._parse_price(price_str)

        # Repin count (virality proxy)
        saves_str = (
            selector.css("[data-test-id='save-count']::text").get()
            or selector.css("div.saves::text").get()
            or "0"
        )
        saves = self._parse_count(saves_str)

        if price:
            # Shopping pin → product item
            item = ProductDetectionItem()
            item["product_name"] = title
            item["source_url"] = pin_url
            item["platform"] = "pinterest"
            item["external_id"] = pin_url.split("/pin/")[-1].split("/")[0] if "/pin/" in pin_url else ""
            item["estimated_price"] = price
            item["image_url"] = image_url
            item["confidence_score"] = 0.75
            item["source"] = "pinterest_trending"
            item["detected_at"] = datetime.now(timezone.utc).isoformat()
            item["metadata"] = {"saves": saves, "is_shopping_pin": True}
            yield item
        else:
            # Regular pin → video/content item (repins as engagement proxy)
            item = VideoItem()
            item["platform"] = "pinterest"
            item["external_id"] = pin_url.split("/pin/")[-1].split("/")[0] if "/pin/" in pin_url else ""
            item["url"] = pin_url
            item["title"] = title
            item["caption"] = title
            item["hashtags"] = []
            item["view_count"] = saves * 20  # Estimate: 1 save ≈ 20 views
            item["like_count"] = saves
            item["share_count"] = saves
            item["comment_count"] = 0
            item["author_handle"] = ""
            item["thumbnail_url"] = image_url
            item["published_at"] = datetime.now(timezone.utc).isoformat()
            item["crawled_at"] = datetime.now(timezone.utc).isoformat()
            yield item

    # ── From State JSON ───────────────────────────────────────────────────────

    def _build_items(self, pin: Dict):
        """Build items from a Pinterest pin dict (from JS state)."""
        title = (
            pin.get("title")
            or pin.get("description")
            or ""
        ).strip()[:200]

        if not title:
            return

        pin_id = str(pin.get("id", ""))
        pin_url = f"https://www.pinterest.com/pin/{pin_id}/" if pin_id else ""

        # Rich media
        image_url = ""
        images = pin.get("images", {})
        for size in ["736x", "600x", "474x", "236x"]:
            if size in images:
                image_url = images[size].get("url", "")
                break

        # Shopping data
        shopping = pin.get("shopping_flags", []) or []
        price_info = pin.get("price_value") or pin.get("buyable_product", {})
        price = None
        if isinstance(price_info, dict):
            price = price_info.get("price_value") or price_info.get("price")
        elif isinstance(price_info, (int, float)):
            price = float(price_info)

        saves = int(pin.get("aggregated_pin_data", {}).get("saves", 0) or 0)
        repin_count = int(pin.get("repin_count", 0) or 0)
        total_engagement = saves + repin_count

        hashtags = re.findall(r"#(\w+)", title)

        if price and price > 0:
            item = ProductDetectionItem()
            item["product_name"] = title
            item["source_url"] = pin_url
            item["platform"] = "pinterest"
            item["external_id"] = pin_id
            item["estimated_price"] = float(price)
            item["image_url"] = image_url
            item["confidence_score"] = 0.80
            item["source"] = "pinterest_json"
            item["detected_at"] = datetime.now(timezone.utc).isoformat()
            item["metadata"] = {
                "saves": saves,
                "repins": repin_count,
                "is_shopping_pin": "shoppable" in shopping,
            }
            yield item
        else:
            item = VideoItem()
            item["platform"] = "pinterest"
            item["external_id"] = pin_id
            item["url"] = pin_url
            item["title"] = title
            item["caption"] = title
            item["hashtags"] = hashtags
            item["view_count"] = total_engagement * 20
            item["like_count"] = total_engagement
            item["share_count"] = repin_count
            item["comment_count"] = int(pin.get("comment_count", 0) or 0)
            item["author_handle"] = pin.get("pinner", {}).get("username", "") if isinstance(pin.get("pinner"), dict) else ""
            item["thumbnail_url"] = image_url
            item["published_at"] = datetime.now(timezone.utc).isoformat()
            item["crawled_at"] = datetime.now(timezone.utc).isoformat()
            yield item

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _parse_price(self, price_str: str) -> Optional[float]:
        cleaned = re.sub(r"[^\d.]", "", price_str)
        try:
            return float(cleaned) if cleaned else None
        except ValueError:
            return None

    def _parse_count(self, count_str: str) -> int:
        count_str = count_str.strip().upper().replace(",", "")
        try:
            if "K" in count_str:
                return int(float(count_str.replace("K", "")) * 1_000)
            elif "M" in count_str:
                return int(float(count_str.replace("M", "")) * 1_000_000)
            return int(count_str)
        except (ValueError, TypeError):
            return 0
