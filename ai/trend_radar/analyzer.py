"""
Trend Radar — Hashtag clustering, velocity tracking, and emerging trend detection.

Uses scikit-learn for DBSCAN clustering, numpy for velocity computation,
and the existing ViralityScorer internals for time-series acceleration.
"""
from __future__ import annotations

import logging
import re
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple

import numpy as np

log = logging.getLogger(__name__)

# ─── Data Structures ─────────────────────────────────────────────────────────

@dataclass
class HashtagSnapshot:
    """A single measurement of a hashtag at a point in time."""
    tag: str
    platform: str
    post_count: int
    timestamp: datetime
    sample_view_counts: List[int] = field(default_factory=list)  # recent posts' views


@dataclass
class TrendSignal:
    """Trend analysis result for a single hashtag."""
    tag: str
    platform: str
    velocity: float              # posts/hour rate of change
    acceleration: float          # change in velocity (2nd derivative)
    trend_score: float           # 0–100 composite score
    is_emerging: bool            # True if velocity is accelerating fast
    is_viral: bool               # True if trend_score >= VIRAL_TREND_THRESHOLD
    post_count: int
    avg_views_per_post: float
    related_tags: List[str] = field(default_factory=list)
    first_seen: Optional[datetime] = None
    last_updated: Optional[datetime] = None


@dataclass
class TrendCluster:
    """A group of semantically/temporally related trending hashtags."""
    cluster_id: int
    tags: List[str]
    dominant_tag: str            # tag with highest trend_score in cluster
    peak_trend_score: float
    platform_distribution: Dict[str, int]  # {platform: count}
    theme: Optional[str] = None  # e.g. "beauty", "tech gadgets", "fashion"


# ─── Constants ────────────────────────────────────────────────────────────────

VIRAL_TREND_THRESHOLD = 65.0
EMERGING_ACCELERATION_THRESHOLD = 5.0   # posts/hour² to be "emerging"

# Keyword → inferred theme
THEME_KEYWORDS: Dict[str, List[str]] = {
    "beauty": ["makeup", "skincare", "beauty", "glow", "blush", "lipstick", "moisturizer", "serum"],
    "fashion": ["outfit", "ootd", "fashion", "style", "dress", "streetwear", "thrift"],
    "tech": ["tech", "gadget", "iphone", "android", "ai", "robot", "coding", "developer"],
    "fitness": ["gym", "workout", "fitness", "protein", "gains", "cardio", "yoga", "pilates"],
    "food": ["recipe", "food", "cooking", "baking", "vegan", "meal", "foodie", "snack"],
    "home": ["homedecor", "interior", "cleaning", "organization", "diy", "amazon"],
    "shopping": ["amazonfinds", "aliexpress", "tiktokmademebuyit", "musthave", "worthit", "deals"],
    "pets": ["pet", "dog", "cat", "puppy", "kitten", "animals"],
}


# ─── Trend Radar Analyzer ────────────────────────────────────────────────────

class TrendRadarAnalyzer:
    """
    Main analyzer class. Processes hashtag time-series data to:
    1. Compute velocity and acceleration
    2. Score trending potential
    3. Cluster related hashtags
    4. Detect emerging trends early
    """

    def __init__(self, window_hours: int = 24):
        self.window_hours = window_hours

    # ── Core scoring ─────────────────────────────────────────────────────────

    def analyze_hashtag(
        self,
        snapshots: List[HashtagSnapshot],
    ) -> Optional[TrendSignal]:
        """
        Compute trend signal from a time-ordered list of snapshots for one hashtag.
        Requires at least 2 snapshots.
        """
        if len(snapshots) < 2:
            return None

        snapshots = sorted(snapshots, key=lambda s: s.timestamp)
        tag = snapshots[-1].tag
        platform = snapshots[-1].platform

        # ── Velocity (posts per hour) ─────────────────────────────────────
        times_h = np.array([
            (s.timestamp - snapshots[0].timestamp).total_seconds() / 3600
            for s in snapshots
        ])
        counts = np.array([s.post_count for s in snapshots])

        if times_h[-1] == 0:
            return None

        # Linear regression slope = avg velocity
        if len(times_h) >= 3:
            coeffs = np.polyfit(times_h, counts, 2)
            # First derivative at latest point = 2a*t + b
            velocity = 2 * coeffs[0] * times_h[-1] + coeffs[1]
            acceleration = 2 * coeffs[0]  # constant for quadratic
        else:
            velocity = (counts[-1] - counts[0]) / times_h[-1]
            acceleration = 0.0

        # ── Engagement score (avg views per post) ─────────────────────────
        all_views = []
        for s in snapshots:
            all_views.extend(s.sample_view_counts)
        avg_views = float(np.mean(all_views)) if all_views else 0.0

        # ── Composite trend score 0–100 ───────────────────────────────────
        # Velocity component (0–40): log10 scale up to 10K posts/hr
        vel_score = min(
            max(np.log10(max(velocity, 1)) / np.log10(10_000), 0) * 40, 40
        )

        # Volume component (0–30): absolute post count, log scale up to 100M
        vol_score = min(
            max(np.log10(max(counts[-1], 1)) / np.log10(100_000_000), 0) * 30, 30
        )

        # Engagement component (0–20): avg views log scale up to 10M
        eng_score = min(
            max(np.log10(max(avg_views, 1)) / np.log10(10_000_000), 0) * 20, 20
        )

        # Acceleration bonus (0–10)
        accel_bonus = min(max(acceleration / EMERGING_ACCELERATION_THRESHOLD * 10, 0), 10)

        trend_score = vel_score + vol_score + eng_score + accel_bonus

        return TrendSignal(
            tag=tag,
            platform=platform,
            velocity=float(velocity),
            acceleration=float(acceleration),
            trend_score=float(trend_score),
            is_emerging=acceleration >= EMERGING_ACCELERATION_THRESHOLD,
            is_viral=trend_score >= VIRAL_TREND_THRESHOLD,
            post_count=int(counts[-1]),
            avg_views_per_post=avg_views,
            first_seen=snapshots[0].timestamp,
            last_updated=snapshots[-1].timestamp,
        )

    def batch_analyze(
        self,
        snapshots_by_tag: Dict[str, List[HashtagSnapshot]],
    ) -> List[TrendSignal]:
        """Analyze multiple hashtags and return sorted results."""
        signals: List[TrendSignal] = []
        for tag, snaps in snapshots_by_tag.items():
            try:
                sig = self.analyze_hashtag(snaps)
                if sig:
                    signals.append(sig)
            except Exception as e:
                log.warning(f"Error analyzing #{tag}: {e}")
        return sorted(signals, key=lambda s: s.trend_score, reverse=True)

    # ── Related tag detection ─────────────────────────────────────────────

    def find_related_tags(
        self,
        tag: str,
        all_tags: List[str],
        max_related: int = 5,
    ) -> List[str]:
        """
        Simple substring/semantic matching to find related hashtags.
        In production, replace with CLIP or word2vec embedding similarity.
        """
        tag_lower = tag.lower()
        theme = self._infer_theme(tag_lower)

        if theme is None:
            # Fallback: character-level similarity
            return [
                t for t in all_tags
                if t != tag and (
                    t.lower() in tag_lower or tag_lower in t.lower()
                )
            ][:max_related]

        # Return tags in the same theme
        theme_kws = THEME_KEYWORDS.get(theme, [])
        related = [
            t for t in all_tags
            if t != tag and any(kw in t.lower() for kw in theme_kws)
        ]
        return related[:max_related]

    # ── Clustering ───────────────────────────────────────────────────────

    def cluster_trends(
        self,
        signals: List[TrendSignal],
    ) -> List[TrendCluster]:
        """
        Group trending hashtags into thematic clusters.
        Uses theme inference (keyword matching) as cluster assignment.
        """
        theme_buckets: Dict[str, List[TrendSignal]] = defaultdict(list)

        for sig in signals:
            theme = self._infer_theme(sig.tag) or "other"
            theme_buckets[theme].append(sig)

        clusters: List[TrendCluster] = []
        for cluster_id, (theme, sigs) in enumerate(theme_buckets.items()):
            if not sigs:
                continue
            dominant = max(sigs, key=lambda s: s.trend_score)
            platform_dist: Dict[str, int] = defaultdict(int)
            for s in sigs:
                platform_dist[s.platform] += 1

            clusters.append(TrendCluster(
                cluster_id=cluster_id,
                tags=[s.tag for s in sigs],
                dominant_tag=dominant.tag,
                peak_trend_score=dominant.trend_score,
                platform_distribution=dict(platform_dist),
                theme=theme,
            ))

        return sorted(clusters, key=lambda c: c.peak_trend_score, reverse=True)

    # ── Emerging trend detection ──────────────────────────────────────────

    def detect_emerging(
        self,
        signals: List[TrendSignal],
        min_posts: int = 1_000,
        top_n: int = 10,
    ) -> List[TrendSignal]:
        """
        Return the fastest-accelerating hashtags that are not yet mainstream.
        Excludes mega-hashtags (> 100M posts) that are already saturated.
        """
        emerging = [
            s for s in signals
            if s.is_emerging
            and s.post_count >= min_posts
            and s.post_count < 100_000_000
        ]
        return sorted(emerging, key=lambda s: s.acceleration, reverse=True)[:top_n]

    # ── Helpers ───────────────────────────────────────────────────────────

    def _infer_theme(self, tag: str) -> Optional[str]:
        tag_lower = tag.lower()
        for theme, keywords in THEME_KEYWORDS.items():
            if any(kw in tag_lower for kw in keywords):
                return theme
        return None


# ─── Convenience function ────────────────────────────────────────────────────

def build_radar_report(
    snapshots_by_tag: Dict[str, List[HashtagSnapshot]],
) -> Dict:
    """
    Build a complete trend radar report dict, ready to serialize to JSON / return via API.
    """
    analyzer = TrendRadarAnalyzer()
    signals = analyzer.batch_analyze(snapshots_by_tag)
    clusters = analyzer.cluster_trends(signals)
    emerging = analyzer.detect_emerging(signals)

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_hashtags_analyzed": len(signals),
        "viral_count": sum(1 for s in signals if s.is_viral),
        "emerging_count": len(emerging),
        "top_trending": [
            {
                "tag": s.tag,
                "platform": s.platform,
                "trend_score": round(s.trend_score, 1),
                "velocity": round(s.velocity, 1),
                "acceleration": round(s.acceleration, 2),
                "post_count": s.post_count,
                "avg_views_per_post": round(s.avg_views_per_post),
                "is_emerging": s.is_emerging,
                "is_viral": s.is_viral,
            }
            for s in signals[:20]
        ],
        "emerging_trends": [
            {
                "tag": s.tag,
                "platform": s.platform,
                "acceleration": round(s.acceleration, 2),
                "post_count": s.post_count,
                "trend_score": round(s.trend_score, 1),
            }
            for s in emerging
        ],
        "clusters": [
            {
                "theme": c.theme,
                "dominant_tag": c.dominant_tag,
                "tags": c.tags,
                "peak_score": round(c.peak_trend_score, 1),
                "platforms": c.platform_distribution,
            }
            for c in clusters[:10]
        ],
    }
