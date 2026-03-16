"""
TikTok Spider — crawls trending videos and hashtag pages
Uses Playwright for JS rendering + API interception
"""
import json
import re
import time
from typing import Iterator

import scrapy
from scrapy import Request
from scrapy.http import Response

from crawler.items import VideoItem


TIKTOK_TRENDING_URL = "https://www.tiktok.com/trending"
TIKTOK_HASHTAG_URL = "https://www.tiktok.com/tag/{hashtag}"
TIKTOK_API_SEARCH = "https://www.tiktok.com/api/search/general/full/"

VIRAL_HASHTAGS = [
    "tiktokmademebuyit",
    "amazonfinds",
    "viralproducts",
    "productfinds",
    "tiktokshop",
    "aliexpressfinds",
    "musthaveproducts",
    "worthit",
    "coolproducts",
    "underratedproducts",
]


class TikTokSpider(scrapy.Spider):
    name = "tiktok"
    allowed_domains = ["tiktok.com", "api16-normal-c-useast1a.tiktokv.com"]
    custom_settings = {
        "DOWNLOAD_DELAY": 2.0,
        "PLAYWRIGHT_DEFAULT_NAVIGATION_TIMEOUT": 30000,
    }

    def start_requests(self) -> Iterator[Request]:
        # Trending page
        yield Request(
            TIKTOK_TRENDING_URL,
            callback=self.parse_trending,
            meta={"playwright": True, "playwright_include_page": True},
        )
        # Hashtag pages
        for tag in VIRAL_HASHTAGS:
            yield Request(
                TIKTOK_HASHTAG_URL.format(hashtag=tag),
                callback=self.parse_hashtag,
                meta={
                    "playwright": True,
                    "playwright_include_page": True,
                    "hashtag": tag,
                },
            )

    async def parse_trending(self, response: Response):
        """Extract trending video data from TikTok trending page."""
        page = response.meta.get("playwright_page")
        if page:
            # Scroll to load more content
            for _ in range(5):
                await page.evaluate("window.scrollBy(0, 2000)")
                await page.wait_for_timeout(1500)

        # Extract embedded JSON data
        script_data = response.css("script#__UNIVERSAL_DATA_FOR_REHYDRATION__::text").get()
        if script_data:
            yield from self._parse_tiktok_json(script_data, source="trending")

        # Also scrape visible video cards
        for card in response.css("[data-e2e='recommend-list-item-container']"):
            yield from self._extract_video_card(card)

    async def parse_hashtag(self, response: Response):
        """Parse hashtag page videos."""
        page = response.meta.get("playwright_page")
        hashtag = response.meta.get("hashtag")

        if page:
            for _ in range(8):
                await page.evaluate("window.scrollBy(0, 2000)")
                await page.wait_for_timeout(1200)

        script_data = response.css("script#__UNIVERSAL_DATA_FOR_REHYDRATION__::text").get()
        if script_data:
            yield from self._parse_tiktok_json(script_data, source=f"hashtag:{hashtag}")

    def _parse_tiktok_json(self, raw_json: str, source: str) -> Iterator[VideoItem]:
        try:
            data = json.loads(raw_json)
        except json.JSONDecodeError:
            return

        # Navigate TikTok's nested data structure
        video_list = (
            data.get("__DEFAULT_SCOPE__", {})
            .get("webapp.video-detail", {})
            .get("itemInfo", {})
            .get("itemStruct")
        )
        if not video_list:
            # Try list format
            items = (
                data.get("__DEFAULT_SCOPE__", {})
                .get("webapp.hashtag-detail", {})
                .get("ItemList", {})
                .get("items", [])
            )
            if not items:
                return
            for item in items:
                yield from self._build_video_item(item, "tiktok", source)
        else:
            yield from self._build_video_item(video_list, "tiktok", source)

    def _build_video_item(self, item: dict, platform: str, source: str) -> Iterator[VideoItem]:
        try:
            stats = item.get("stats", {})
            author = item.get("author", {})
            video = item.get("video", {})
            desc = item.get("desc", "")

            # Extract hashtags from description
            hashtags = re.findall(r"#(\w+)", desc)

            yield VideoItem(
                platform=platform,
                external_id=item.get("id", ""),
                url=f"https://www.tiktok.com/@{author.get('uniqueId', '')}/video/{item.get('id', '')}",
                title=desc[:200] if desc else "",
                caption=desc,
                hashtags=hashtags,
                views=int(stats.get("playCount", 0)),
                likes=int(stats.get("diggCount", 0)),
                shares=int(stats.get("shareCount", 0)),
                comments=int(stats.get("commentCount", 0)),
                author_handle=author.get("uniqueId", ""),
                author_followers=int(author.get("followerCount", 0)),
                thumbnail_url=video.get("cover", ""),
                duration_sec=int(video.get("duration", 0)),
                published_at=item.get("createTime"),
                source=source,
            )
        except (KeyError, ValueError, TypeError) as e:
            self.logger.warning(f"Error building video item: {e}")

    def _extract_video_card(self, card) -> Iterator[VideoItem]:
        """Fallback CSS-based extraction from video cards."""
        link = card.css("a::attr(href)").get("")
        video_id_match = re.search(r"/video/(\d+)", link)
        if not video_id_match:
            return

        views_text = card.css("[data-e2e='video-views']::text").get("0")
        views = self._parse_count(views_text)

        yield VideoItem(
            platform="tiktok",
            external_id=video_id_match.group(1),
            url=f"https://www.tiktok.com{link}",
            views=views,
            hashtags=[],
            likes=0, shares=0, comments=0,
            source="css_fallback",
        )

    @staticmethod
    def _parse_count(text: str) -> int:
        """Parse '1.2M' → 1200000 etc."""
        text = text.strip().upper()
        multipliers = {"K": 1_000, "M": 1_000_000, "B": 1_000_000_000}
        for suffix, mult in multipliers.items():
            if text.endswith(suffix):
                try:
                    return int(float(text[:-1]) * mult)
                except ValueError:
                    return 0
        try:
            return int(text.replace(",", ""))
        except ValueError:
            return 0
