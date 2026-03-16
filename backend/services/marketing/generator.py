"""
AI Marketing Generator — generates all marketing assets using Claude AI
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any

from backend.core.config import settings

log = logging.getLogger(__name__)

# Lazy client — only instantiated when actually needed so a missing key
# doesn't crash every import of this module.
_anthropic_client = None


def _get_anthropic_client():
    global _anthropic_client
    if _anthropic_client is not None:
        return _anthropic_client
    api_key = settings.ANTHROPIC_API_KEY
    if not api_key:
        return None
    try:
        import anthropic
        _anthropic_client = anthropic.AsyncAnthropic(api_key=api_key)
        return _anthropic_client
    except Exception as e:
        log.warning(f"Could not instantiate Anthropic client: {e}")
        return None


# ─── Prompt Templates ─────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert e-commerce copywriter and digital marketer
specialized in viral products, TikTok marketing, and high-conversion ad copy.
You write punchy, engaging copy that makes people want to buy immediately.
Always be specific, use power words, create urgency, and focus on benefits over features.
Return ONLY the requested content, no explanations."""


PROMPTS: dict[str, str] = {
    "headline": """Write 5 high-converting ad headlines for this product.
Each headline should be under 60 characters, create curiosity or urgency.
Format: one headline per line, no numbering.

Product: {name}
Category: {category}
Key benefit: {description}
Tone: {tone}""",

    "description": """Write a compelling product description (150-200 words) for:

Product: {name}
Category: {category}
Price: ${sale_price}
Supplier cost: ${cost_price}

Focus on:
- The #1 problem it solves
- Key features as benefits
- Social proof angle
- Call to action
Tone: {tone}""",

    "hook": """Write 5 viral TikTok/Instagram video HOOKS for this product.
Hooks should be the first 3-5 seconds of a video script.
Make them shocking, curiosity-driven, or emotionally compelling.
Format: one hook per line.

Product: {name}
Category: {category}
Tone: {tone}""",

    "tiktok_script": """Write a complete TikTok video script (60 seconds) for this product.
Include: Hook (0-5s), Problem (5-15s), Solution (15-35s), Demo/Features (35-50s), CTA (50-60s)
Add [B-ROLL] and [TEXT ON SCREEN] cues.

Product: {name}
Category: {category}
Target audience: {target_audience}
Tone: {tone}""",

    "caption": """Write 3 Instagram/TikTok captions for this product post.
Each caption: 1-2 sentences + 5-10 relevant hashtags.
Format: Caption 1: [text] [hashtags]

Product: {name}
Category: {category}
Tone: {tone}""",

    "landing_page": """Write complete landing page copy for this product.
Sections:
1. HERO: Headline + subheadline + CTA button text
2. PROBLEM: 3 bullet points
3. SOLUTION: Product intro paragraph
4. FEATURES: 4 feature/benefit pairs
5. SOCIAL PROOF: 2 fake testimonials with names
6. FAQ: 3 Q&A pairs
7. CTA SECTION: Final pitch + urgency + button text

Product: {name}
Category: {category}
Price: ${sale_price}
Tone: {tone}""",

    "email_subject": """Write 5 email subject lines for this product promotion.
Make them personal, curiosity-driven, under 50 characters.
Format: one per line.

Product: {name}
Tone: {tone}""",
}


class MarketingGeneratorService:
    """
    Generates all marketing assets using Claude claude-sonnet-4-6.
    Supports batch generation with async concurrency.
    """

    def __init__(self, model: str | None = None):
        self.model = model or settings.LLM_MODEL
        self.client = _get_anthropic_client()

    async def generate(
        self,
        asset_type: str,
        product: Any,
        tone: str = "engaging",
        language: str = "en",
        target_audience: str = "general consumers",
    ) -> str:
        """Generate a single marketing asset."""
        prompt_template = PROMPTS.get(asset_type)
        if not prompt_template:
            raise ValueError(f"Unknown asset type: {asset_type}. Available: {list(PROMPTS)}")

        # Build template variables
        listing = getattr(product, "best_listing", None)
        cost_price = listing.cost_price if listing else 5.0
        sale_price = listing.sale_price_suggested if listing else 25.0

        prompt = prompt_template.format(
            name=getattr(product, "name", "Product"),
            category=getattr(product, "category", "General"),
            description=getattr(product, "description", "") or "",
            tone=tone,
            cost_price=cost_price,
            sale_price=sale_price,
            target_audience=target_audience,
        )

        # Add language instruction if not English
        if language != "en":
            prompt = f"Respond in {language} language.\n\n" + prompt

        if self.client is None:
            log.warning(f"Anthropic client not available — returning fallback for {asset_type}")
            return self._fallback_copy(asset_type, getattr(product, "name", "Product"),
                                       getattr(product, "category", "General"))

        try:
            msg = await self.client.messages.create(
                model=self.model,
                max_tokens=1500,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )
            return msg.content[0].text.strip()
        except Exception as e:
            log.error(f"LLM generation failed for {asset_type}: {e}")
            return self._fallback_copy(asset_type, getattr(product, "name", "Product"),
                                       getattr(product, "category", "General"))

    async def generate_all(
        self,
        product: Any,
        asset_types: list[str] | None = None,
        tone: str = "engaging",
        language: str = "en",
    ) -> dict[str, str]:
        """Generate multiple asset types concurrently."""
        if asset_types is None:
            asset_types = ["headline", "description", "hook", "tiktok_script", "caption"]

        tasks = {
            asset_type: self.generate(asset_type, product, tone, language)
            for asset_type in asset_types
        }
        results = await asyncio.gather(*tasks.values(), return_exceptions=True)

        output = {}
        for asset_type, result in zip(tasks.keys(), results):
            if isinstance(result, Exception):
                log.warning(f"Failed to generate {asset_type}: {result}")
                output[asset_type] = ""
            else:
                output[asset_type] = result

        return output

    @staticmethod
    def _fallback_copy(asset_type: str, name: str, category: str) -> str:
        """Return high-quality demo marketing copy when AI is unavailable."""
        cat_clean = category.replace(" & ", " ").replace(" ", "")
        fallbacks = {
            "headline": (
                f"This {name} Is Breaking The Internet\n"
                f"50,000+ People Already Own This — Do You?\n"
                f"The {category} Product TikTok Can't Stop Talking About\n"
                f"Order Before They Sell Out Again\n"
                f"Why Everyone's Obsessed With {name}"
            ),
            "description": (
                f"Tired of settling for less? {name} is the {category.lower()} solution "
                f"you didn't know you needed — until now.\n\n"
                f"With over 50,000 five-star reviews and millions of TikTok views, "
                f"this product solves the everyday problem everyone faces but nobody talks about.\n\n"
                f"Key benefits:\n"
                f"- Works instantly from day one\n"
                f"- Premium quality at an unbeatable price\n"
                f"- Trusted by thousands of happy customers\n"
                f"- 30-day money-back guarantee\n\n"
                f"Don't wait — limited stock available. Order yours today!"
            ),
            "hook": (
                f"POV: You just found the {category.lower()} product everyone's obsessed with\n"
                f"I can't believe this actually WORKS\n"
                f"Stop scrolling — this changes everything\n"
                f"TikTok made me buy it and I have ZERO regrets\n"
                f"This is why {name} has 2M views this week"
            ),
            "tiktok_script": (
                f"[0-5s HOOK] 'I spent $30 on this and my life changed — let me explain'\n"
                f"[TEXT ON SCREEN: '{name}']\n\n"
                f"[5-15s PROBLEM] Show the frustrating before — the struggle everyone relates to.\n\n"
                f"[15-35s SOLUTION] Unbox and reveal the {name}.\n"
                f"[TEXT ON SCREEN: 'Life. Changed.']\n\n"
                f"[35-50s DEMO] Show it working in real life — close-up shots.\n"
                f"[B-ROLL: Use in real scenario, reaction shots]\n\n"
                f"[50-60s CTA] 'Link in bio — they sell out every single week'\n"
                f"[TEXT ON SCREEN: 'Get Yours Before They Are Gone']"
            ),
            "caption": (
                f"Caption 1: This {name} is the reason I can't stop spending money on TikTok "
                f"#TikTokMadeMeBuyIt #ViralProduct #{cat_clean}\n\n"
                f"Caption 2: POV: Your FYP finds the best products so you don't have to "
                f"#MustHave #TikTokFinds #AmazonFinds\n\n"
                f"Caption 3: Tested it so you don't have to — and it absolutely SLAPS "
                f"#ProductReview #ViralTikTok #Trending"
            ),
            "email_subject": (
                f"Everyone's buying this {category.lower()} product\n"
                f"You need to see this before it sells out\n"
                f"2M TikTok views — here's why\n"
                f"Limited stock alert for {name}\n"
                f"This week's #1 viral product"
            ),
            "landing_page": (
                f"HERO\nHeadline: The {category} Product Taking Over TikTok\n"
                f"Subheadline: Join 50,000+ happy customers who discovered {name}\n"
                f"CTA Button: Shop Now — Limited Stock\n\n"
                f"PROBLEM\n- Struggling to find quality {category.lower()} products?\n"
                f"- Tired of overpaying for mediocre results?\n"
                f"- Done wasting time on products that don't deliver?\n\n"
                f"SOLUTION\nIntroducing {name} — the viral sensation that actually works.\n\n"
                f"FAQ\nQ: How fast does it ship? A: 3-7 business days standard.\n"
                f"Q: What if I don't love it? A: 30-day money-back guarantee.\n"
                f"Q: Is it worth the price? A: Over 50,000 five-star reviews say yes.\n\n"
                f"FINAL CTA\nDon't miss out. Stock is limited and sells out weekly.\n"
                f"[Shop Now — Free Shipping Today]"
            ),
        }
        return fallbacks.get(asset_type, f"Premium {name} — trending viral product in {category}.")

    async def generate_landing_page(self, product: Any) -> dict[str, str]:
        """Generate a full structured landing page."""
        content = await self.generate("landing_page", product)
        return {"type": "landing_page", "content": content}

    async def personalize_for_platform(
        self,
        product: Any,
        platform: str,  # 'tiktok' | 'instagram' | 'facebook' | 'google'
    ) -> dict[str, str]:
        """Generate platform-optimized content."""
        platform_configs = {
            "tiktok": {"types": ["hook", "tiktok_script", "caption"], "tone": "trendy"},
            "instagram": {"types": ["caption", "headline", "description"], "tone": "aspirational"},
            "facebook": {"types": ["headline", "description", "email_subject"], "tone": "persuasive"},
            "google": {"types": ["headline", "description"], "tone": "informative"},
        }
        config = platform_configs.get(platform, {"types": ["headline", "description"], "tone": "engaging"})
        return await self.generate_all(
            product=product,
            asset_types=config["types"],
            tone=config["tone"],
        )
