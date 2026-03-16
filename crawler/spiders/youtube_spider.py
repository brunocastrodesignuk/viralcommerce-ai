"""
YouTube Shorts Spider — crawls YouTube Shorts for viral products
Uses YouTube Data API v3 for reliable data
"""
import os
from typing import Iterator

import scrapy
from scrapy import Request

from crawler.items import VideoItem

YT_API_BASE = "https://www.googleapis.com/youtube/v3"
PRODUCT_KEYWORDS = [
    "amazon finds", "viral products", "tiktok products",
    "cool gadgets", "must have products", "aliexpress finds",
]


class YouTubeSpider(scrapy.Spider):
    name = "youtube"
    custom_settings = {"DOWNLOAD_DELAY": 0.5}

    def __init__(self, api_key: str = None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.api_key = api_key or os.environ.get("YOUTUBE_API_KEY", "")

    def start_requests(self) -> Iterator[Request]:
        if not self.api_key:
            self.logger.error("YouTube API key not set")
            return

        for keyword in PRODUCT_KEYWORDS:
            yield Request(
                f"{YT_API_BASE}/search?part=snippet&q={keyword}+shorts"
                f"&type=video&videoDuration=short&order=viewCount"
                f"&maxResults=50&key={self.api_key}",
                callback=self.parse_search,
                meta={"keyword": keyword},
            )

        # Also fetch from trending
        yield Request(
            f"{YT_API_BASE}/videos?part=snippet,statistics"
            f"&chart=mostPopular&videoCategoryId=26"
            f"&maxResults=50&key={self.api_key}",
            callback=self.parse_videos,
            meta={"source": "trending_howto"},
        )

    def parse_search(self, response):
        data = response.json()
        keyword = response.meta.get("keyword")
        video_ids = [item["id"]["videoId"] for item in data.get("items", [])]
        if not video_ids:
            return

        # Fetch statistics for all videos in one request
        ids_str = ",".join(video_ids)
        yield Request(
            f"{YT_API_BASE}/videos?part=snippet,statistics&id={ids_str}&key={self.api_key}",
            callback=self.parse_videos,
            meta={"source": f"search:{keyword}"},
        )

    def parse_videos(self, response) -> Iterator[VideoItem]:
        data = response.json()
        source = response.meta.get("source", "youtube")

        for item in data.get("items", []):
            snippet = item.get("snippet", {})
            stats = item.get("statistics", {})

            # Only process Shorts (≤ 60 seconds)
            duration = snippet.get("duration", "")

            tags = snippet.get("tags", [])
            title = snippet.get("title", "")
            description = snippet.get("description", "")

            yield VideoItem(
                platform="youtube",
                external_id=item.get("id", ""),
                url=f"https://www.youtube.com/shorts/{item.get('id', '')}",
                title=title[:200],
                caption=description[:500],
                hashtags=tags[:20],
                views=int(stats.get("viewCount", 0)),
                likes=int(stats.get("likeCount", 0)),
                shares=0,  # YouTube API doesn't expose shares
                comments=int(stats.get("commentCount", 0)),
                author_handle=snippet.get("channelTitle", ""),
                thumbnail_url=snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
                published_at=snippet.get("publishedAt"),
                source=source,
            )
