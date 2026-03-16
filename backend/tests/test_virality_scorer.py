"""
Unit tests for the ViralityScorer AI module.
No database or HTTP — pure logic tests.
"""
import pytest
from datetime import datetime, timezone, timedelta

from ai.virality.scorer import ViralityScorer, VideoSnapshot, VIRAL_THRESHOLD


@pytest.fixture
def scorer():
    return ViralityScorer()


def make_snapshot(views, likes, comments, shares, hours_ago=0, video_id="vid_001", platform="tiktok"):
    return VideoSnapshot(
        video_id=video_id,
        platform=platform,
        views=views,
        likes=likes,
        comments=comments,
        shares=shares,
        timestamp=datetime.now(timezone.utc) - timedelta(hours=hours_ago),
    )


class TestViralityScorerSingle:
    def test_high_engagement_produces_high_score(self, scorer):
        current = make_snapshot(views=10_000_000, likes=800_000, comments=50_000, shares=120_000)
        prev = make_snapshot(views=1_000_000, likes=80_000, comments=5_000, shares=12_000, hours_ago=24)
        result = scorer.score_single(current, prev)
        assert result.viral_score >= VIRAL_THRESHOLD

    def test_low_engagement_produces_low_score(self, scorer):
        current = make_snapshot(views=500, likes=10, comments=1, shares=0)
        prev = make_snapshot(views=400, likes=8, comments=1, shares=0, hours_ago=24)
        result = scorer.score_single(current, prev)
        assert result.viral_score < VIRAL_THRESHOLD

    def test_score_is_between_0_and_100(self, scorer):
        current = make_snapshot(views=50_000_000, likes=5_000_000, comments=500_000, shares=1_000_000)
        result = scorer.score_single(current)
        assert 0.0 <= result.viral_score <= 100.0

    def test_score_without_previous_snapshot(self, scorer):
        current = make_snapshot(views=1_000_000, likes=50_000, comments=5_000, shares=10_000)
        result = scorer.score_single(current, prev_snapshot=None)
        assert result is not None
        assert result.viral_score >= 0

    def test_viral_score_higher_with_rapid_growth(self, scorer):
        slow_growth_current = make_snapshot(views=200_000, likes=10_000, comments=500, shares=1_000)
        slow_growth_prev = make_snapshot(views=180_000, likes=9_000, comments=450, shares=900, hours_ago=24)

        fast_growth_current = make_snapshot(views=2_000_000, likes=100_000, comments=5_000, shares=10_000, video_id="vid_002")
        fast_growth_prev = make_snapshot(views=100_000, likes=5_000, comments=250, shares=500, hours_ago=24, video_id="vid_002")

        slow = scorer.score_single(slow_growth_current, slow_growth_prev)
        fast = scorer.score_single(fast_growth_current, fast_growth_prev)
        assert fast.viral_score > slow.viral_score

    def test_shares_ratio_component(self, scorer):
        """High shares relative to views should boost score."""
        high_shares = make_snapshot(views=1_000_000, likes=50_000, comments=5_000, shares=200_000)
        low_shares = make_snapshot(views=1_000_000, likes=50_000, comments=5_000, shares=1_000, video_id="vid_low")

        s_high = scorer.score_single(high_shares)
        s_low = scorer.score_single(low_shares)
        assert s_high.viral_score > s_low.viral_score


class TestViralityScorerTimeSeries:
    def test_time_series_returns_scores(self, scorer):
        snapshots = [
            make_snapshot(views=100_000 * (i + 1), likes=5_000 * (i + 1),
                          comments=500 * (i + 1), shares=1_000 * (i + 1),
                          hours_ago=24 - i * 4)
            for i in range(6)
        ]
        results = scorer.score_time_series(snapshots)
        assert len(results) > 0

    def test_time_series_sorted_by_time(self, scorer):
        snapshots = [
            make_snapshot(views=500_000, likes=25_000, comments=2_500, shares=5_000, hours_ago=h)
            for h in [20, 10, 5, 0]
        ]
        results = scorer.score_time_series(snapshots)
        timestamps = [r.computed_at for r in results]
        assert timestamps == sorted(timestamps)

    def test_time_series_requires_minimum_snapshots(self, scorer):
        """Should handle fewer than 2 snapshots gracefully."""
        single = [make_snapshot(views=500_000, likes=25_000, comments=2_500, shares=5_000)]
        results = scorer.score_time_series(single)
        assert isinstance(results, list)


class TestBatchScoring:
    def test_batch_score_multiple_videos(self, scorer):
        snapshots = {
            "vid_A": [make_snapshot(10_000_000, 800_000, 50_000, 120_000, video_id="vid_A")],
            "vid_B": [make_snapshot(500, 10, 1, 0, video_id="vid_B")],
            "vid_C": [make_snapshot(5_000_000, 300_000, 30_000, 60_000, video_id="vid_C")],
        }
        results = scorer.batch_score(snapshots)
        assert len(results) == 3

    def test_flag_viral_products_threshold(self, scorer):
        snapshots = {
            "viral_vid": [make_snapshot(10_000_000, 800_000, 50_000, 120_000, video_id="viral_vid")],
            "boring_vid": [make_snapshot(500, 10, 1, 0, video_id="boring_vid")],
        }
        viral = scorer.flag_viral_products(snapshots)
        ids = [v.video_id for v in viral]
        assert "viral_vid" in ids
        assert "boring_vid" not in ids


class TestViralThreshold:
    def test_viral_threshold_constant(self):
        assert VIRAL_THRESHOLD == 70.0

    def test_borderline_video(self, scorer):
        """Score near 70 — verify threshold classification."""
        current = make_snapshot(views=800_000, likes=30_000, comments=3_000, shares=8_000)
        result = scorer.score_single(current)
        expected_viral = result.viral_score >= VIRAL_THRESHOLD
        assert result.is_viral == expected_viral
