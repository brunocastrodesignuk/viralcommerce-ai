"""
ViralCommerce AI — Virality Detection & Scoring Engine
Computes a composite viral score for videos and tracks trend acceleration.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional

import numpy as np
import structlog

log = structlog.get_logger()


@dataclass
class VideoSnapshot:
    """A single time-series snapshot of a video's metrics."""
    video_id: str
    platform: str
    views: int
    likes: int
    shares: int
    comments: int
    recorded_at: datetime
    author_followers: int = 0


@dataclass
class ViralScore:
    """Full viral score breakdown for a video."""
    video_id: str
    total_score: float          # 0-100
    views_score: float
    shares_score: float
    comments_score: float
    likes_score: float
    engagement_rate: float
    share_rate: float
    growth_velocity: float      # % growth per hour
    trend_acceleration: float   # second derivative (acceleration)
    is_viral: bool
    computed_at: datetime

    def to_dict(self) -> dict:
        return {
            "video_id": self.video_id,
            "total_score": round(self.total_score, 2),
            "views_score": round(self.views_score, 2),
            "shares_score": round(self.shares_score, 2),
            "comments_score": round(self.comments_score, 2),
            "likes_score": round(self.likes_score, 2),
            "engagement_rate": round(self.engagement_rate, 4),
            "share_rate": round(self.share_rate, 4),
            "growth_velocity": round(self.growth_velocity, 4),
            "trend_acceleration": round(self.trend_acceleration, 4),
            "is_viral": self.is_viral,
            "computed_at": self.computed_at.isoformat(),
        }


class ViralityScorer:
    """
    Multi-factor virality scoring engine.

    Viral Score Formula:
    ─────────────────────────────────────────────────
    viral_score = (views_growth   × 0.40)
                + (shares_ratio   × 0.30)
                + (comments_growth × 0.20)
                + (like_ratio     × 0.10)
    ─────────────────────────────────────────────────
    All sub-scores normalized to 0-100.
    """

    # Weight configuration
    WEIGHT_VIEWS    = 0.40
    WEIGHT_SHARES   = 0.30
    WEIGHT_COMMENTS = 0.20
    WEIGHT_LIKES    = 0.10

    # Normalization thresholds (tuned empirically)
    VIEWS_MAX_LOG  = math.log10(50_000_000)   # 50M views = perfect score
    SHARES_MAX_RATIO  = 0.08    # 8% of views = perfect shares score
    COMMENTS_MAX_RATIO = 0.04   # 4% = perfect comments score
    LIKES_MAX_RATIO   = 0.12   # 12% = perfect likes score

    # Viral threshold
    VIRAL_THRESHOLD = 70.0

    def score_single(
        self,
        snapshot: VideoSnapshot,
        prev_snapshot: Optional[VideoSnapshot] = None,
    ) -> ViralScore:
        """
        Compute viral score from a single snapshot.
        If prev_snapshot provided, computes velocity and acceleration.
        """
        views = max(snapshot.views, 1)
        likes = snapshot.likes
        shares = snapshot.shares
        comments = snapshot.comments

        # ── Sub-scores (each 0-100) ─────────────────────────────
        # Views: logarithmic scale
        views_score = min(
            math.log10(max(views, 10)) / self.VIEWS_MAX_LOG, 1.0
        ) * 100

        # Shares: ratio to views
        shares_ratio = shares / views
        shares_score = min(shares_ratio / self.SHARES_MAX_RATIO, 1.0) * 100

        # Comments: ratio to views
        comments_ratio = comments / views
        comments_score = min(comments_ratio / self.COMMENTS_MAX_RATIO, 1.0) * 100

        # Likes: ratio to views
        likes_ratio = likes / views
        likes_score = min(likes_ratio / self.LIKES_MAX_RATIO, 1.0) * 100

        # ── Composite score ─────────────────────────────────────
        total = (
            views_score    * self.WEIGHT_VIEWS +
            shares_score   * self.WEIGHT_SHARES +
            comments_score * self.WEIGHT_COMMENTS +
            likes_score    * self.WEIGHT_LIKES
        )

        # ── Velocity (requires prev snapshot) ───────────────────
        growth_velocity = 0.0
        trend_acceleration = 0.0

        if prev_snapshot and prev_snapshot.views > 0:
            elapsed_hours = max(
                (snapshot.recorded_at - prev_snapshot.recorded_at).total_seconds() / 3600,
                0.01,
            )
            views_growth_pct = (views - prev_snapshot.views) / prev_snapshot.views
            growth_velocity = views_growth_pct / elapsed_hours

            # Acceleration bonus: fast-growing content gets boosted
            if growth_velocity > 0.5:  # > 50% growth per hour
                acceleration_bonus = min(growth_velocity * 5, 20)  # max +20 pts
                total = min(total + acceleration_bonus, 100)
                trend_acceleration = acceleration_bonus

        return ViralScore(
            video_id=snapshot.video_id,
            total_score=round(total, 2),
            views_score=round(views_score, 2),
            shares_score=round(shares_score, 2),
            comments_score=round(comments_score, 2),
            likes_score=round(likes_score, 2),
            engagement_rate=round((likes + comments) / views, 4),
            share_rate=round(shares_ratio, 4),
            growth_velocity=round(growth_velocity, 4),
            trend_acceleration=round(trend_acceleration, 4),
            is_viral=total >= self.VIRAL_THRESHOLD,
            computed_at=datetime.now(timezone.utc),
        )

    def score_time_series(self, snapshots: list[VideoSnapshot]) -> ViralScore:
        """
        Score from a time-series of snapshots.
        Uses linear regression on view counts for velocity.
        """
        if not snapshots:
            raise ValueError("No snapshots provided")

        snapshots = sorted(snapshots, key=lambda s: s.recorded_at)
        latest = snapshots[-1]

        # Compute velocity using linear regression if we have ≥ 3 points
        growth_velocity = 0.0
        trend_acceleration = 0.0

        if len(snapshots) >= 3:
            times = np.array([
                (s.recorded_at - snapshots[0].recorded_at).total_seconds() / 3600
                for s in snapshots
            ])
            views = np.array([s.views for s in snapshots])

            if times[-1] > 0:
                # First derivative (velocity)
                coeffs = np.polyfit(times, views, deg=2)
                growth_velocity = coeffs[1] / max(np.mean(views), 1)
                trend_acceleration = coeffs[0]  # second-degree coefficient

        prev = snapshots[-2] if len(snapshots) >= 2 else None
        score = self.score_single(latest, prev_snapshot=prev)

        # Override with regression-based velocity
        score.growth_velocity = round(float(growth_velocity), 4)
        score.trend_acceleration = round(float(trend_acceleration), 6)

        return score

    def batch_score(self, snapshots: list[VideoSnapshot]) -> list[ViralScore]:
        """Score a list of independent single-snapshot videos."""
        return [self.score_single(s) for s in snapshots]

    def flag_viral_products(self, scores: list[ViralScore]) -> list[ViralScore]:
        """Return only scores above the viral threshold."""
        return [s for s in scores if s.is_viral]
