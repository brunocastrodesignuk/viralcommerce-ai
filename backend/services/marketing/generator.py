"""
AI Marketing Generator — generates all marketing assets using Claude AI
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any

import anthropic

from backend.core.config import settings

log = logging.getLogger(__name__)

ANTHROPIC_CLIENT = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)


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
        self.client = ANTHROPIC_CLIENT

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
            return f"[Error generating {asset_type}]"

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
