#!/usr/bin/env python3
"""
ViralCommerce AI — Stripe Setup Script
Cria os produtos e preços no Stripe e imprime as variáveis de ambiente.

Como usar:
  pip install stripe
  python scripts/stripe_setup.py

Cole sua STRIPE_SECRET_KEY quando solicitado (ou passe como argumento):
  python scripts/stripe_setup.py sk_live_xxxxxxxxxxxxxxxxxx
"""

import sys
import os

try:
    import stripe
except ImportError:
    print("❌ Instale o stripe: pip install stripe")
    sys.exit(1)

# ─── Get secret key ───────────────────────────────────────────────────────────

if len(sys.argv) > 1:
    secret_key = sys.argv[1].strip()
elif "STRIPE_SECRET_KEY" in os.environ:
    secret_key = os.environ["STRIPE_SECRET_KEY"]
else:
    secret_key = input("Cole sua Stripe Secret Key (sk_live_... ou sk_test_...): ").strip()

if not secret_key.startswith(("sk_live_", "sk_test_")):
    print("❌ Chave inválida. Deve começar com sk_live_ ou sk_test_")
    sys.exit(1)

stripe.api_key = secret_key
is_test = secret_key.startswith("sk_test_")
mode = "TESTE" if is_test else "PRODUÇÃO"
print(f"\n🔑 Conectado no modo: {mode}\n")

# ─── Create products ──────────────────────────────────────────────────────────

def get_or_create_product(name: str, description: str, metadata: dict) -> str:
    """Return existing product ID or create new one."""
    # Search for existing
    existing = stripe.Product.search(query=f'name:"{name}" AND active:"true"')
    if existing.data:
        prod = existing.data[0]
        print(f"  ✅ Produto já existe: {prod.name} ({prod.id})")
        return prod.id

    prod = stripe.Product.create(
        name=name,
        description=description,
        metadata=metadata,
    )
    print(f"  ✅ Produto criado: {prod.name} ({prod.id})")
    return prod.id


def get_or_create_price(product_id: str, amount_brl: int, nickname: str) -> str:
    """Return existing recurring price ID or create new one."""
    # Search for existing price on this product
    existing = stripe.Price.list(product=product_id, active=True, limit=10)
    for p in existing.data:
        if (
            p.recurring
            and p.recurring.interval == "month"
            and p.currency == "brl"
            and p.unit_amount == amount_brl * 100
        ):
            print(f"  ✅ Preço já existe: R${amount_brl}/mês ({p.id})")
            return p.id

    price = stripe.Price.create(
        product=product_id,
        unit_amount=amount_brl * 100,  # in centavos
        currency="brl",
        recurring={"interval": "month"},
        nickname=nickname,
    )
    print(f"  ✅ Preço criado: R${amount_brl}/mês ({price.id})")
    return price.id


# ─── Setup plans ──────────────────────────────────────────────────────────────

print("📦 Configurando plano PRO...")
pro_product_id = get_or_create_product(
    name="ViralCommerce AI — Plano Pro",
    description="Acesso completo à plataforma: produtos ilimitados, 5 plataformas rastreadas, geração de marketing com IA, analytics avançado, 10 campanhas ativas, descoberta de fornecedores, suporte prioritário.",
    metadata={"plan": "pro", "app": "viralcommerce"},
)
pro_price_id = get_or_create_price(pro_product_id, 47, "ViralCommerce Pro R$47/mês")

print("\n🏢 Configurando plano EMPRESARIAL...")
enterprise_product_id = get_or_create_product(
    name="ViralCommerce AI — Plano Empresarial",
    description="Tudo do Pro + campanhas ilimitadas, alvos de rastreamento personalizados, exportação white-label, acesso à API, gerente de conta dedicado, SLA 99,9% uptime.",
    metadata={"plan": "enterprise", "app": "viralcommerce"},
)
enterprise_price_id = get_or_create_price(enterprise_product_id, 197, "ViralCommerce Empresarial R$197/mês")

# ─── Configure portal ─────────────────────────────────────────────────────────

print("\n⚙️  Configurando Customer Portal...")
try:
    stripe.billing_portal.Configuration.create(
        business_profile={
            "headline": "Gerencie sua assinatura ViralCommerce AI",
            "privacy_policy_url": "https://viralcommerce-frontend.onrender.com/landing",
            "terms_of_service_url": "https://viralcommerce-frontend.onrender.com/landing",
        },
        features={
            "invoice_history": {"enabled": True},
            "payment_method_update": {"enabled": True},
            "subscription_cancel": {"enabled": True},
            "subscription_pause": {"enabled": False},
        },
    )
    print("  ✅ Customer Portal configurado")
except stripe.error.InvalidRequestError as e:
    if "already have a default" in str(e).lower() or "already exists" in str(e).lower():
        print("  ✅ Customer Portal já configurado")
    else:
        print(f"  ⚠️  Portal: {e}")

# ─── Print env vars ───────────────────────────────────────────────────────────

pk = secret_key.replace("sk_", "pk_")
print("\n" + "═" * 60)
print("🎉 CONFIGURAÇÃO CONCLUÍDA!")
print("═" * 60)
print()
print("📋 VARIÁVEIS PARA O RENDER (Backend — viralcommerce-api):")
print()
print(f"STRIPE_SECRET_KEY={secret_key}")
print(f"STRIPE_PRO_PRICE_ID={pro_price_id}")
print(f"STRIPE_ENTERPRISE_PRICE_ID={enterprise_price_id}")
print()
print("📋 VARIÁVEIS PARA O RENDER (Frontend — viralcommerce-frontend):")
print()
print(f"NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY={pk}")
print(f"NEXT_PUBLIC_STRIPE_PRO_PRICE_ID={pro_price_id}")
print(f"NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID={enterprise_price_id}")
print()
print("🔗 PRÓXIMO PASSO — Configurar Webhook:")
print()
print("  1. Acesse: https://dashboard.stripe.com/webhooks")
print("  2. Clique em '+ Add endpoint'")
print("  3. URL: https://viralcommerce-api.onrender.com/api/v1/billing/webhook")
print("  4. Eventos a ouvir:")
print("       checkout.session.completed")
print("       customer.subscription.updated")
print("       customer.subscription.deleted")
print("       customer.subscription.paused")
print("  5. Clique em 'Add endpoint'")
print("  6. Na página do webhook, clique em 'Reveal' → copie o Signing secret")
print("  7. Adicione ao Render (Backend):")
print("       STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxx")
print()
print("═" * 60)
print(f"Modo: {'⚠️  TESTE (use sk_live_ para produção real)' if is_test else '✅ PRODUÇÃO'}")
print("═" * 60)
