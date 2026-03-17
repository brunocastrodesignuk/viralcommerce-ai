"""
Seed script — populates the database with realistic demo data
Run: python scripts/seed_demo_data.py
"""
import asyncio
import random
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://viralcommerce:viralcommerce@localhost:5432/viralcommerce")
# Convert to asyncpg format if needed
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# ── Product catalog com imagens reais + descrições em PT-BR ──────────────────
# Imagens: Unsplash CDN (free, sem auth, permanentes)
PRODUCT_CATALOG = [
    {"name": "LED Galaxy Projector Night Light", "category": "Electronics",
     "description": "Projetor de galáxia LED com 12 modos, cores RGB e rotação 360°. Transforma qualquer quarto em planetário. Viral no TikTok com +80M views.",
     "image": "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=400&fit=crop&q=80",
     "price_min": 12.5, "price_max": 18.9, "viral_score": 96.2},
    {"name": "Portable Blender Smoothie Maker", "category": "Home & Kitchen",
     "description": "Mini liquidificador portátil USB com 6 lâminas de aço. Faz smoothies em 30s. 380ml, sem BPA, recarregável.",
     "image": "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&h=400&fit=crop&q=80",
     "price_min": 14.0, "price_max": 22.5, "viral_score": 91.5},
    {"name": "Posture Corrector Belt", "category": "Health & Wellness",
     "description": "Corretor de postura ergonômico com material respirável. Alivia dores nas costas e ombros. Discreto sob a roupa.",
     "image": "https://images.unsplash.com/photo-1571019613914-4bda9a0e8e1c?w=400&h=400&fit=crop&q=80",
     "price_min": 8.0, "price_max": 15.0, "viral_score": 88.3},
    {"name": "Jade Facial Roller & Gua Sha Set", "category": "Beauty & Personal Care",
     "description": "Kit jade natural com roller duplo e gua sha. Reduz inchaço, tensão e olheiras. Adorado por influencers com milhões de seguidores.",
     "image": "https://images.unsplash.com/photo-1556909172-54557c7e2f7f?w=400&h=400&fit=crop&q=80",
     "price_min": 7.5, "price_max": 14.0, "viral_score": 94.8},
    {"name": "Resistance Bands Set 5-Pack", "category": "Sports & Outdoors",
     "description": "Kit 5 faixas elásticas de resistência progressiva 2kg–40kg. Perfeito para treino em casa e fisioterapia.",
     "image": "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=400&fit=crop&q=80",
     "price_min": 9.0, "price_max": 16.0, "viral_score": 89.1},
    {"name": "Electric Scalp Massager", "category": "Beauty & Personal Care",
     "description": "Massageador elétrico do couro cabeludo com 4 cabeças rotativas. Estimula crescimento capilar e reduz estresse. USB recarregável.",
     "image": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop&q=80",
     "price_min": 11.0, "price_max": 19.5, "viral_score": 92.7},
    {"name": "Mushroom Coffee Blend Premium", "category": "Health & Wellness",
     "description": "Café funcional com Lion's Mane, Chaga e Reishi. Melhora foco e energia sem ansiedade. 30 doses.",
     "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop&q=80",
     "price_min": 18.0, "price_max": 32.0, "viral_score": 87.4},
    {"name": "Magnetic Phone Car Mount", "category": "Electronics",
     "description": "Suporte magnético universal para carro, rotação 360°. Ímã N52 extra-forte, instalação em 3 segundos.",
     "image": "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&h=400&fit=crop&q=80",
     "price_min": 5.0, "price_max": 10.0, "viral_score": 85.2},
    {"name": "Smart Water Bottle Tracker", "category": "Health & Wellness",
     "description": "Garrafa 1L com marcadores de horário e capa motivacional. Viral com +50M views no TikTok. Tritan sem BPA.",
     "image": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop&q=80",
     "price_min": 10.0, "price_max": 18.0, "viral_score": 90.6},
    {"name": "Mini Projector Portable 1080P", "category": "Electronics",
     "description": "Mini projetor 1080P com bateria 5000mAh. Imagem até 120 polegadas. HDMI, USB e Bluetooth. Cinema em qualquer lugar.",
     "image": "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=400&fit=crop&q=80",
     "price_min": 35.0, "price_max": 65.0, "viral_score": 93.1},
    {"name": "Teeth Whitening Pen Kit", "category": "Beauty & Personal Care",
     "description": "Caneta clareadora dental com gel carbamida 35%. Remove manchas de café e vinho em 7 dias. Sem sensibilidade. 2 canetas.",
     "image": "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=400&h=400&fit=crop&q=80",
     "price_min": 8.5, "price_max": 15.0, "viral_score": 88.9},
    {"name": "Ice Roller Face Massager", "category": "Beauty & Personal Care",
     "description": "Roller facial de gel crioterapia. Desincha, fecha poros e ilumina a pele. Fica 6h gelado após 2h no freezer.",
     "image": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&q=80",
     "price_min": 9.0, "price_max": 16.5, "viral_score": 95.3},
    {"name": "Sunset Lamp Gradient Light", "category": "Home & Kitchen",
     "description": "Luminária sunset projetora efeito pôr-do-sol. Viral no TikTok. 16 cores RGB, controle remoto, bivolt.",
     "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80",
     "price_min": 13.0, "price_max": 22.0, "viral_score": 97.1},
    {"name": "Hair Wax Stick Edge Control", "category": "Beauty & Personal Care",
     "description": "Bastão de cera edge control para baby hair e penteados. Fixação forte 48h com queratina. Sem álcool, travel-size.",
     "image": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop&q=80",
     "price_min": 5.0, "price_max": 9.5, "viral_score": 86.7},
    {"name": "Portable Sauna Blanket", "category": "Health & Wellness",
     "description": "Cobertor sauna infravermelho portátil para detox e relaxamento muscular. Aquece até 80°C, 6 níveis. Equivale a 30min de exercício.",
     "image": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop&q=80",
     "price_min": 45.0, "price_max": 85.0, "viral_score": 91.2},
    {"name": "Green Powder Superfood Mix", "category": "Health & Wellness",
     "description": "Blend de 40 superfoods: espirulina, matcha, ashwagandha e probióticos. 1 colher = 5 porções de vegetais. Sabor tropical.",
     "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop&q=80",
     "price_min": 22.0, "price_max": 40.0, "viral_score": 89.5},
    {"name": "Acupressure Mat & Pillow Set", "category": "Health & Wellness",
     "description": "Tapete e travesseiro de acupressão com 6.210 pontos. Alivia dores crônicas e insônia em 20 minutos. Linho natural certificado.",
     "image": "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&h=400&fit=crop&q=80",
     "price_min": 18.0, "price_max": 30.0, "viral_score": 87.8},
    {"name": "Desktop Punching Bag Stress Relief", "category": "Sports & Outdoors",
     "description": "Mini saco de boxe de mesa com base de sucção. Alivia estresse instantaneamente, silencioso. Ideal para home office.",
     "image": "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=400&fit=crop&q=80",
     "price_min": 12.0, "price_max": 20.0, "viral_score": 84.6},
    {"name": "Collagen Peptides Powder", "category": "Health & Wellness",
     "description": "Colágeno hidrolisado tipos I e III com vitamina C e ácido hialurônico. Melhora pele, cabelo e articulações. Dissolve instantaneamente.",
     "image": "https://images.unsplash.com/photo-1559181567-c3190e99a5fb?w=400&h=400&fit=crop&q=80",
     "price_min": 20.0, "price_max": 38.0, "viral_score": 90.1},
    {"name": "LED Face Mask Phototherapy", "category": "Beauty & Personal Care",
     "description": "Máscara LED facial 7 cores de fototerapia clínica. Luz vermelha: anti-aging. Luz azul: acne. Luz verde: manchas. 20min/sessão.",
     "image": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=400&fit=crop&q=80",
     "price_min": 25.0, "price_max": 55.0, "viral_score": 97.8},
]

PLATFORMS = ["tiktok", "instagram", "youtube", "pinterest"]
HASHTAGS = ["#TikTokMadeMeBuyIt", "#AmazonFinds", "#ViralProduct", "#MustHave", "#LifeHack", "#WorthIt", "#Trending", "#Satisfying"]

async def seed():
    async with AsyncSessionLocal() as db:
        from backend.models.product import Product
        from backend.models.hashtag import Hashtag

        print("Seeding products...")
        products = []
        for item in PRODUCT_CATALOG:
            p = Product(
                id=uuid.uuid4(),
                name=item["name"],
                category=item["category"],
                description=item["description"],
                tags=random.sample(["trending", "viral", "tiktok", "amazon", "bestseller", "organic", "dropshipping"], 3),
                viral_score=round(item["viral_score"], 1),
                competition_score=round(random.uniform(20, 55), 1),
                demand_score=round(min(item["viral_score"] * random.uniform(0.92, 1.0), 99.9), 1),
                estimated_price_min=item["price_min"],
                estimated_price_max=item["price_max"],
                image_urls=[item["image"]],
                status="active",
                first_detected_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30)),
            )
            products.append(p)
            db.add(p)

        print("Seeding hashtags...")
        for tag in HASHTAGS:
            h = Hashtag(
                id=uuid.uuid4(),
                tag=tag.lstrip("#"),
                platform="tiktok",
                post_count=random.randint(500_000, 50_000_000),
                trend_velocity=round(random.uniform(10, 95), 1),
                updated_at=datetime.now(timezone.utc),
            )
            db.add(h)

        await db.commit()
        print(f"Seeded {len(products)} products and {len(HASHTAGS)} hashtags")

if __name__ == "__main__":
    asyncio.run(seed())
