"""
Support Chat — AI-powered customer support using Claude.
Handles: plan questions, Shopify help, payment queries, general usage.
"""
import os

from anthropic import AsyncAnthropic
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

SYSTEM_PROMPT = """Você é o assistente virtual de suporte do ViralCommerce AI — uma plataforma SaaS de dropshipping com IA.

INFORMAÇÕES DO PRODUTO:
- Plano Gratuito: R$0/mês — 50 produtos/mês, 1 plataforma, analytics básico, 1 campanha ativa
- Plano Pro: R$47/mês — produtos ilimitados, 5 plataformas, IA para marketing, 10 campanhas, fornecedores automáticos, suporte prioritário
- Plano Empresarial: R$197/mês — tudo do Pro + campanhas ilimitadas, API access, white-label, gerente dedicado, SLA 99,9%
- Trial de 10 dias grátis no Pro ao assinar
- Cancelamento a qualquer momento sem multa

PAGAMENTOS:
- PIX, Boleto, Cartão de crédito/débito, Apple Pay, Google Pay, PayPal
- Para mudar de plano: /pricing
- Para gerenciar assinatura: /settings (seção Pagamento)

FUNCIONALIDADES PRINCIPAIS:
- Descoberta de produtos virais via crawlers de TikTok, Instagram, YouTube e Pinterest
- Geração de anúncios e copy com IA (Claude/Anthropic)
- Busca automática de fornecedores: AliExpress, CJ Dropshipping, SHEIN, Temu, Alibaba
- Importação 1-clique para Shopify (precisa de URL da loja + token de API Shopify)
- Analytics em tempo real: ROAS, CTR, conversões, radar de hashtags
- Geração de thumbnails e criativos com IA
- Watchlist de produtos favoritos

SHOPIFY:
- Acesse a página do produto → clique "Importar para Shopify"
- URL: ex. minha-loja.myshopify.com (sem https://)
- Token: Shopify Admin → Apps → "App e canal de vendas" → "Desenvolver apps" → criar app com permissão de produtos

SUPORTE HUMANO:
- WhatsApp: https://wa.me/447470361422
- E-mail: suporte@viralcommerce.ai
- Resposta em até 2h em dias úteis

REGRAS DE RESPOSTA:
- Seja direto, amigável e em Português do Brasil
- Máximo 3-4 parágrafos por resposta
- Se não souber algo, direcione para o WhatsApp ou e-mail de suporte
- Não invente informações sobre preços ou funcionalidades que não estão listadas acima
- Se perguntarem sobre compra, informe os planos e redirecione para /pricing
"""


class ChatMessage(BaseModel):
    role: str
    content: str


class SupportChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []
    user_plan: str = "free"


@router.post("/chat")
async def support_chat(req: SupportChatRequest):
    """AI-powered support chat using Claude."""
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        # Fallback when no API key configured
        return {
            "reply": (
                "Olá! No momento o assistente de IA está sendo configurado. "
                "Para suporte imediato, fale conosco via WhatsApp: "
                "https://wa.me/447470361422 ou e-mail: suporte@viralcommerce.ai"
            )
        }

    try:
        client = AsyncAnthropic(api_key=api_key)

        # Build message history
        messages = []
        for msg in req.history[-10:]:  # last 10 messages for context
            if msg.role in ("user", "assistant"):
                messages.append({"role": msg.role, "content": msg.content})

        # Add current message
        messages.append({"role": "user", "content": req.message})

        response = await client.messages.create(
            model="claude-haiku-4-5",  # Fast + cheap for support chat
            max_tokens=512,
            system=SYSTEM_PROMPT + f"\n\nPlano atual do usuário: {req.user_plan}",
            messages=messages,
        )

        reply = response.content[0].text if response.content else "Desculpe, não consegui processar sua mensagem."
        return {"reply": reply}

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Erro ao processar mensagem. Tente novamente ou contate o suporte via WhatsApp."
        )
