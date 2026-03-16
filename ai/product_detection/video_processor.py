"""
Video Processor — orchestrates product detection from viral video URLs.
Downloads thumbnails/videos, runs detection, and persists to DB.
"""
from __future__ import annotations

import asyncio
import logging
import tempfile
from pathlib import Path
from typing import Optional

import httpx

from ai.product_detection.detector import ProductDetector, DetectedProduct

log = logging.getLogger(__name__)


class VideoProcessor:
    """
    Async orchestrator for product detection pipeline:
    1. Download video thumbnail (fast path)
    2. Optionally download video for full-frame analysis (slower)
    3. Run YOLO + CLIP detection
    4. Persist results to PostgreSQL and publish to Kafka
    """

    def __init__(
        self,
        detector: Optional[ProductDetector] = None,
        kafka_topic: str = "viral.products.detected",
    ):
        self.detector = detector or ProductDetector()
        self.kafka_topic = kafka_topic

    async def process_thumbnail(
        self,
        video_id: str,
        thumbnail_url: str,
        platform: str,
    ) -> list[DetectedProduct]:
        """Fast path: detect products from video thumbnail."""
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(thumbnail_url)
            resp.raise_for_status()
            image_bytes = resp.content

        products = self.detector.detect_in_image(image_bytes)
        log.info(
            f"Thumbnail detection: video={video_id} platform={platform} "
            f"found={len(products)} products"
        )
        return products

    async def process_video_url(
        self,
        video_id: str,
        video_url: str,
        platform: str,
        sample_rate: int = 30,
    ) -> list[DetectedProduct]:
        """
        Full path: download video and detect products frame-by-frame.
        Uses temp file to avoid storing large videos.
        """
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("GET", video_url) as resp:
                    with open(tmp_path, "wb") as f:
                        async for chunk in resp.aiter_bytes(chunk_size=8192):
                            f.write(chunk)

            products = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.detector.detect_in_video(tmp_path, sample_rate=sample_rate),
            )

            log.info(
                f"Video detection: video={video_id} platform={platform} "
                f"found={len(products)} products"
            )
            return products

        finally:
            Path(tmp_path).unlink(missing_ok=True)

    async def process_batch(
        self,
        videos: list[dict],
        use_thumbnails_only: bool = True,
    ) -> dict[str, list[DetectedProduct]]:
        """
        Process a batch of videos concurrently.
        videos: list of {video_id, thumbnail_url, url, platform}
        """
        semaphore = asyncio.Semaphore(8)  # max 8 concurrent detections

        async def _process(video: dict):
            async with semaphore:
                vid_id = video["video_id"]
                try:
                    if use_thumbnails_only and video.get("thumbnail_url"):
                        return vid_id, await self.process_thumbnail(
                            vid_id, video["thumbnail_url"], video["platform"]
                        )
                    elif video.get("url"):
                        return vid_id, await self.process_video_url(
                            vid_id, video["url"], video["platform"]
                        )
                except Exception as e:
                    log.warning(f"Detection failed for video {vid_id}: {e}")
                    return vid_id, []

        tasks = [_process(v) for v in videos]
        results = await asyncio.gather(*tasks, return_exceptions=False)
        return dict(results)
