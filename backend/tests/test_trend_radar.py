"""
Unit tests for the TrendRadarAnalyzer AI module.
Pure logic — no database or HTTP.
"""
import pytest
from datetime import datetime, timezone, timedelta

from ai.trend_radar.analyzer import (
    TrendRadarAnalyzer,
    HashtagSnapshot,
    VIRAL_TREND_THRESHOLD,
    EMERGING_ACCELERATION_THRESHOLD,
    build_radar_report,
)


@pytest.fixture
def analyzer():
    return TrendRadarAnalyzer()


def make_snapshots(tag, platform, count_start, count_end, hours=24):
    now = datetime.now(timezone.utc)
    return [
        HashtagSnapshot(tag=tag, platform=platform, post_count=count_start,
                        timestamp=now - timedelta(hours=hours)),
        HashtagSnapshot(tag=tag, platform=platform, post_count=count_end,
                        timestamp=now),
    ]


class TestHashtagAnalysis:
    def test_fast_growing_hashtag_gets_high_score(self, analyzer):
        snaps = make_snapshots("viralproduct", "tiktok", 1_000_000, 50_000_000)
        result = analyzer.analyze_hashtag(snaps)
        assert result is not None
        assert result.trend_score > 50

    def test_stagnant_hashtag_gets_low_score(self, analyzer):
        snaps = make_snapshots("oldhashtag", "tiktok", 1_000_000, 1_000_100)
        result = analyzer.analyze_hashtag(snaps)
        assert result is not None
        assert result.trend_score < 50

    def test_single_snapshot_returns_none(self, analyzer):
        snap = [HashtagSnapshot(tag="solo", platform="tiktok",
                                post_count=1_000_000,
                                timestamp=datetime.now(timezone.utc))]
        result = analyzer.analyze_hashtag(snap)
        assert result is None

    def test_score_is_bounded_0_to_100(self, analyzer):
        snaps = make_snapshots("megaviral", "tiktok", 1, 100_000_000_000)
        result = analyzer.analyze_hashtag(snaps)
        if result:
            assert 0.0 <= result.trend_score <= 100.0

    def test_velocity_is_positive_for_growth(self, analyzer):
        snaps = make_snapshots("growing", "tiktok", 500_000, 2_000_000)
        result = analyzer.analyze_hashtag(snaps)
        assert result is not None
        assert result.velocity > 0

    def test_platform_preserved(self, analyzer):
        for platform in ["tiktok", "instagram", "youtube", "pinterest"]:
            snaps = make_snapshots("test_tag", platform, 100_000, 500_000)
            result = analyzer.analyze_hashtag(snaps)
            assert result.platform == platform

    def test_tag_preserved(self, analyzer):
        snaps = make_snapshots("mytag123", "tiktok", 100_000, 500_000)
        result = analyzer.analyze_hashtag(snaps)
        assert result.tag == "mytag123"


class TestBatchAnalysis:
    def test_batch_returns_sorted_by_score(self, analyzer):
        data = {
            "slow": make_snapshots("slow", "tiktok", 1_000_000, 1_010_000),
            "fast": make_snapshots("fast", "tiktok", 1_000_000, 50_000_000),
            "medium": make_snapshots("medium", "tiktok", 500_000, 5_000_000),
        }
        results = analyzer.batch_analyze(data)
        scores = [r.trend_score for r in results]
        assert scores == sorted(scores, reverse=True)

    def test_batch_handles_empty_input(self, analyzer):
        results = analyzer.batch_analyze({})
        assert results == []

    def test_batch_skips_invalid_snapshots(self, analyzer):
        data = {
            "valid": make_snapshots("valid", "tiktok", 500_000, 5_000_000),
            "invalid": [HashtagSnapshot(tag="invalid", platform="tiktok",
                                        post_count=0, timestamp=datetime.now(timezone.utc))],
        }
        results = analyzer.batch_analyze(data)
        # Should process valid ones and skip invalid (single snapshot)
        assert any(r.tag == "valid" for r in results)


class TestEmergingDetection:
    def test_fast_accelerating_is_emerging(self, analyzer):
        # Rapid quadratic growth = high acceleration
        now = datetime.now(timezone.utc)
        snaps = [
            HashtagSnapshot(tag="emerging", platform="tiktok", post_count=10_000,
                            timestamp=now - timedelta(hours=12)),
            HashtagSnapshot(tag="emerging", platform="tiktok", post_count=100_000,
                            timestamp=now - timedelta(hours=6)),
            HashtagSnapshot(tag="emerging", platform="tiktok", post_count=900_000,
                            timestamp=now),
        ]
        result = analyzer.analyze_hashtag(snaps)
        assert result is not None
        # Acceleration should be positive
        assert result.acceleration > 0

    def test_detect_emerging_filters_mega_hashtags(self, analyzer):
        data = {
            "mega": make_snapshots("tiktokmademebuyit", "tiktok", 8_000_000_000, 8_500_000_000),
            "small": make_snapshots("newtrend2025", "tiktok", 5_000, 500_000),
        }
        signals = analyzer.batch_analyze(data)
        emerging = analyzer.detect_emerging(signals, min_posts=1_000)
        # mega hashtag should be filtered out (> 100M posts)
        tags = [e.tag for e in emerging]
        assert "tiktokmademebuyit" not in tags

    def test_detect_emerging_min_posts_filter(self, analyzer):
        data = {
            "tiny": make_snapshots("tinytag", "tiktok", 10, 500),
        }
        signals = analyzer.batch_analyze(data)
        emerging = analyzer.detect_emerging(signals, min_posts=1_000)
        assert len(emerging) == 0


class TestClustering:
    def test_beauty_cluster_groups_beauty_tags(self, analyzer):
        data = {
            "makeuptutorial": make_snapshots("makeuptutorial", "tiktok", 100_000, 1_000_000),
            "skincareroutine": make_snapshots("skincareroutine", "instagram", 500_000, 3_000_000),
            "ledlights": make_snapshots("ledlights", "tiktok", 200_000, 2_000_000),
        }
        signals = analyzer.batch_analyze(data)
        clusters = analyzer.cluster_trends(signals)
        themes = [c.theme for c in clusters]
        assert "beauty" in themes

    def test_clusters_have_required_fields(self, analyzer):
        data = {
            "gadget2025": make_snapshots("gadget2025", "youtube", 100_000, 5_000_000),
        }
        signals = analyzer.batch_analyze(data)
        clusters = analyzer.cluster_trends(signals)
        for c in clusters:
            assert c.cluster_id is not None
            assert isinstance(c.tags, list)
            assert c.dominant_tag in c.tags
            assert c.peak_trend_score >= 0

    def test_empty_signals_returns_empty_clusters(self, analyzer):
        clusters = analyzer.cluster_trends([])
        assert clusters == []


class TestThemeInference:
    def test_infer_beauty_theme(self, analyzer):
        assert analyzer._infer_theme("makeuptutorial") == "beauty"
        assert analyzer._infer_theme("skincareproducts") == "beauty"

    def test_infer_tech_theme(self, analyzer):
        assert analyzer._infer_theme("techgadgets") == "tech"
        assert analyzer._infer_theme("airobot") == "tech"

    def test_infer_shopping_theme(self, analyzer):
        assert analyzer._infer_theme("amazonfinds") == "shopping"
        assert analyzer._infer_theme("tiktokmademebuyit") == "shopping"

    def test_infer_unknown_returns_none(self, analyzer):
        assert analyzer._infer_theme("zzznonsense999") is None


class TestRadarReport:
    def test_build_radar_report_structure(self):
        data = {
            "tiktokmademebuyit": make_snapshots("tiktokmademebuyit", "tiktok", 8_000_000_000, 8_500_000_000),
            "ledlights": make_snapshots("ledlights", "tiktok", 200_000, 5_000_000),
            "skincareroutine": make_snapshots("skincareroutine", "instagram", 500_000, 3_000_000),
        }
        report = build_radar_report(data)
        assert "generated_at" in report
        assert "top_trending" in report
        assert "emerging_trends" in report
        assert "clusters" in report
        assert report["total_hashtags_analyzed"] == 3

    def test_top_trending_sorted_by_score(self):
        data = {
            "slow": make_snapshots("slow", "tiktok", 1_000_000, 1_050_000),
            "fast": make_snapshots("fast", "tiktok", 1_000_000, 50_000_000),
        }
        report = build_radar_report(data)
        scores = [t["trend_score"] for t in report["top_trending"]]
        assert scores == sorted(scores, reverse=True)
