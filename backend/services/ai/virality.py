"""
Virality Scorer service — wraps the AI virality scoring module.
"""
from __future__ import annotations

from typing import Optional


class ViralityScorer:
    """
    Computes viral scores for videos and products.
    Wraps the ai.virality scoring logic with async-friendly interface.
    """

    def __init__(self):
        try:
            from ai.virality.scorer import ViralityScorer as _CoreScorer
            self._core = _CoreScorer()
        except ImportError:
            self._core = None

    async def score_video(self, video_data: dict) -> float:
        """Return a 0-100 viral score for a video dict."""
        if self._core is None:
            # Fallback: simple heuristic based on engagement ratios
            views   = video_data.get("views", 0) or 1
            likes   = video_data.get("likes", 0)
            shares  = video_data.get("shares", 0)
            comments = video_data.get("comments", 0)
            engagement = (likes + shares * 3 + comments * 2) / views
            return min(100.0, engagement * 1000)
        return await self._core.score_async(video_data)

    async def score_product(self, product_data: dict) -> float:
        """Aggregate viral score for a product from linked videos."""
        video_scores = product_data.get("video_scores", [])
        if not video_scores:
            return 0.0
        return sum(video_scores) / len(video_scores)
