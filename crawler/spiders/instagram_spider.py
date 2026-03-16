"""
Instagram Reels Spider — monitors trending Reels for viral products
"""
import json
import re
from typing import Iterator

import scrapy
from scrapy import Request

from crawler.items import VideoItem

INSTAGRAM_REELS_URL = "https://www.instagram.com/reels/trending/"
INSTAGRAM_HASHTAG_URL = "https://www.instagram.com/explore/tags/{tag}/"


class InstagramSpider(scrapy.Spider):
    name = "instagram"
    allowed_domains = ["instagram.com"]
    custom_settings = {
        "DOWNLOAD_DELAY": 3.0,
        "PLAYWRIGHT_DEFAULT_NAVIGATION_TIMEOUT": 45000,
    }

    PRODUCT_HASHTAGS = [
        "amazonfinds", "productreview", "musthave",
        "tiktokproducts", "onlineshopping", "dealoftheday",
    ]

    def start_requests(self) -> Iterator[Request]:
        yield Request(
            INSTAGRAM_REELS_URL,
            callback=self.parse_reels,
            meta={"playwright": True, "playwright_include_page": True},
        )
        for tag in self.PRODUCT_HASHTAGS:
            yield Request(
                INSTAGRAM_HASHTAG_URL.format(tag=tag),
                callback=self.parse_hashtag,
                meta={"playwright": True, "hashtag": tag},
            )

    async def parse_reels(self, response):
        page = response.meta.get("playwright_page")
        if page:
            for _ in range(6):
                await page.evaluate("window.scrollBy(0, 3000)")
                await page.wait_for_timeout(2000)

        # Extract shared data
        shared_data = response.css("script[type='application/json']::text").getall()
        for data_str in shared_data:
            try:
                data = json.loads(data_str)
                yield from self._extract_reels(data, "trending")
            except json.JSONDecodeError:
                continue

    async def parse_hashtag(self, response):
        hashtag = response.meta.get("hashtag")
        shared_data = response.css("script[type='application/json']::text").getall()
        for data_str in shared_data:
            try:
                data = json.loads(data_str)
                yield from self._extract_reels(data, f"hashtag:{hashtag}")
            except json.JSONDecodeError:
                continue

    def _extract_reels(self, data: dict, source: str) -> Iterator[VideoItem]:
        # Navigate Instagram's data structure
        edges = (
            data.get("data", {})
            .get("hashtag", {})
            .get("edge_hashtag_to_media", {})
            .get("edges", [])
        )
        for edge in edges:
            node = edge.get("node", {})
            if node.get("__typename") not in ("GraphVideo", "GraphReel"):
                continue
            caption_edges = node.get("edge_media_to_caption", {}).get("edges", [])
            caption = caption_edges[0]["node"]["text"] if caption_edges else ""
            hashtags = re.findall(r"#(\w+)", caption)

            yield VideoItem(
                platform="instagram",
                external_id=node.get("id", ""),
                url=f"https://www.instagram.com/p/{node.get('shortcode', '')}/",
                caption=caption,
                hashtags=hashtags,
                views=node.get("video_view_count", 0) or 0,
                likes=node.get("edge_media_preview_like", {}).get("count", 0),
                shares=0,
                comments=node.get("edge_media_to_comment", {}).get("count", 0),
                thumbnail_url=node.get("thumbnail_src", ""),
                source=source,
            )
