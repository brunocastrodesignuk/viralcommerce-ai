"""
Viral Score Pipeline — computes viral score for each video item
"""
import math


class ViralScorePipeline:
    """
    Viral Score Formula:
    viral_score = (views_growth * 0.4) + (shares_ratio * 0.3)
                + (comments_growth * 0.2) + (like_ratio * 0.1)
    Normalized to 0-100 scale.
    """

    # Normalization thresholds (empirically calibrated)
    VIEWS_VIRAL_THRESHOLD = 1_000_000    # 1M views = max views score
    SHARES_VIRAL_RATIO = 0.10            # 10% share rate = max
    COMMENTS_VIRAL_RATIO = 0.05          # 5% comment rate = max
    LIKES_VIRAL_RATIO = 0.15             # 15% like rate = max

    def process_item(self, item, spider):
        views = max(item.get("views", 0), 1)
        likes = item.get("likes", 0)
        shares = item.get("shares", 0)
        comments = item.get("comments", 0)

        # Normalize each metric to 0-1
        views_score = min(math.log10(max(views, 1)) / math.log10(self.VIEWS_VIRAL_THRESHOLD), 1.0)
        shares_ratio = min(shares / views, self.SHARES_VIRAL_RATIO) / self.SHARES_VIRAL_RATIO
        comments_ratio = min(comments / views, self.COMMENTS_VIRAL_RATIO) / self.COMMENTS_VIRAL_RATIO
        likes_ratio = min(likes / views, self.LIKES_VIRAL_RATIO) / self.LIKES_VIRAL_RATIO

        raw_score = (
            views_score   * 0.4 +
            shares_ratio  * 0.3 +
            comments_ratio * 0.2 +
            likes_ratio   * 0.1
        )

        item["viral_score"] = round(raw_score * 100, 2)
        return item
