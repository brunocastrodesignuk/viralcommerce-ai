"""
WhatsApp AI Agent — auto-responds to incoming WhatsApp messages via Twilio.
Handles purchase inquiries automatically and routes complex issues to support.

Setup:
  1. Create free Twilio account → https://www.twilio.com/try-twilio
  2. Activate WhatsApp Sandbox → Twilio Console → Messaging → Try it out → WhatsApp
  3. Set webhook URL: https://viralcommerce-api.onrender.com/api/v1/whatsapp/webhook
  4. Add env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM

Required env vars:
  TWILIO_ACCOUNT_SID    — from Twilio Console
  TWILIO_AUTH_TOKEN     — from Twilio Console
  TWILIO_WHATSAPP_FROM  — e.g. whatsapp:+14155238886 (Twilio sandbox) or your number
  ANTHROPIC_API_KEY     — for AI responses
  MERCADOPAGO_ACCESS_TOKEN or STRIPE_SECRET_KEY — for payment link generation
"""
import hashlib
import os
from datetime import datetime, timezone
from urllib.parse import urljoin

import httpx
from anthropic import AsyncAnthropic
from fastapi import APIRouter, Form, HTTPException, Request
from fastapi.responses import PlainTextResponse

router = APIRouter()

# ── In-memory conversation history (per phone number) ─────────────────────────
# In production, replace with Redis for persistence across restarts
_conversation_history: dict[str, list[dict]] = {}
_MAX_HISTORY = 12  # messages to keep per conversation

# ── Agent system prompt ───────────────────────────────────────────────────────

AGENT_PROMPT = """Você é o agente de vendas automatizado do ViralCommerce AI.
Seu objetivo é responder dúvidas e converter interessados em clientes pagantes.

PLANOS E PREÇOS:
- Plano Gratuito: R$0 — 50 produtos/mês, 1 campanha, analytics básico
- Plano Pro: R$47/mês — produtos ilimitados, 5 plataformas, IA para anúncios, 10 campanhas
- Plano Empresarial: R$197/mês — tudo do Pro + API access, white-label, SLA 99,9%
- Todos os planos têm trial de 10 dias grátis
- Cancele a qualquer momento sem multa

COMO COMPRAR:
- Para assinar, envie o link de checkout: https://viralcommerce-frontend.onrender.com/pricing
- Aceita: PIX, Boleto, Cartão, Apple Pay, Google Pay, PayPal

FUNCIONALIDADES:
- Descobre produtos virais do TikTok, Instagram, YouTube automaticamente
- Gera anúncios e copy para Meta/Google/TikTok em segundos com IA
- Conecta com AliExpress, SHEIN, Temu, CJ Dropshipping automaticamente
- Importação para Shopify com 1 clique
- Analytics completo: ROAS, CTR, conversões

REGRAS IMPORTANTES:
1. Seja amigável, direto e em Português do Brasil
2. Quando o usuário quiser comprar: forneça o link de checkout imediatamente
3. Para suporte técnico complexo: encaminhe para suporte@viralcommerce.ai
4. Máximo 3 parágrafos por resposta
5. Use emojis com moderação para parecer natural
6. Nunca invente funcionalidades ou preços que não estejam listados acima
7. Se perguntarem se é humano ou robô: seja honesto que é um assistente automatizado
"""


async def _get_ai_response(phone: str, user_message: str) -> str:
    """Get Claude AI response for the WhatsApp conversation."""
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        return (
            "Olá! 👋 Sou o assistente do ViralCommerce AI. "
            "Para comprar ou tirar dúvidas, acesse: "
            "https://viralcommerce-frontend.onrender.com/pricing\n\n"
            "Suporte: suporte@viralcommerce.ai"
        )

    # Get or init conversation history
    history = _conversation_history.get(phone, [])
    history.append({"role": "user", "content": user_message})

    try:
        client = AsyncAnthropic(api_key=api_key)
        response = await client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=400,
            system=AGENT_PROMPT,
            messages=history[-_MAX_HISTORY:],
        )
        reply = response.content[0].text if response.content else "Desculpe, tente novamente."

        # Save to history
        history.append({"role": "assistant", "content": reply})
        _conversation_history[phone] = history[-_MAX_HISTORY:]

        return reply

    except Exception:
        return (
            "Olá! Estou com uma instabilidade momentânea. 😅 "
            "Por favor, acesse https://viralcommerce-frontend.onrender.com/pricing "
            "para assinar ou envie e-mail para suporte@viralcommerce.ai"
        )


async def _send_whatsapp_reply(to: str, body: str) -> bool:
    """Send a WhatsApp reply via Twilio REST API."""
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
    from_number = os.getenv("TWILIO_WHATSAPP_FROM", "")

    if not all([account_sid, auth_token, from_number]):
        return False

    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                url,
                auth=(account_sid, auth_token),
                data={
                    "From": from_number,
                    "To": to,
                    "Body": body,
                },
            )
            return resp.status_code in (200, 201)
    except Exception:
        return False


@router.post("/webhook")
async def whatsapp_webhook(
    request: Request,
    From: str = Form(default=""),
    Body: str = Form(default=""),
    ProfileName: str = Form(default=""),
):
    """
    Twilio WhatsApp webhook — receives incoming messages and auto-replies with AI.
    Configure in Twilio Console → Messaging → Sandbox Settings → When a message comes in.
    """
    if not From or not Body:
        return PlainTextResponse("ok")

    phone = From.strip()
    message = Body.strip()
    name = ProfileName.strip() or "Cliente"

    # Get AI response
    reply = await _get_ai_response(phone, message)

    # Send reply via Twilio
    sent = await _send_whatsapp_reply(phone, reply)

    # If Twilio not configured, log for manual follow-up
    if not sent:
        import structlog
        log = structlog.get_logger()
        log.info(
            "WhatsApp message received (Twilio not configured)",
            from_number=phone,
            name=name,
            message=message[:100],
            reply=reply[:100],
        )

    # Return TwiML response (Twilio standard)
    return PlainTextResponse(
        f'<?xml version="1.0" encoding="UTF-8"?>'
        f'<Response><Message>{reply[:1600]}</Message></Response>',
        media_type="text/xml",
    )


@router.get("/webhook")
async def whatsapp_webhook_verify(request: Request):
    """
    Meta/WhatsApp Business webhook verification (if using Meta API instead of Twilio).
    """
    verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN", "viralcommerce-webhook-token")
    params = request.query_params
    if (
        params.get("hub.mode") == "subscribe"
        and params.get("hub.verify_token") == verify_token
    ):
        return PlainTextResponse(params.get("hub.challenge", ""))
    raise HTTPException(403, "Verification failed")


@router.get("/status")
async def whatsapp_status():
    """Check WhatsApp agent configuration status."""
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN", "")
    twilio_from = os.getenv("TWILIO_WHATSAPP_FROM", "")
    ai_key = os.getenv("ANTHROPIC_API_KEY", "")

    return {
        "twilio_configured": bool(twilio_sid and twilio_token and twilio_from),
        "ai_configured": bool(ai_key),
        "ready": bool(twilio_sid and twilio_token and twilio_from and ai_key),
        "webhook_url": "https://viralcommerce-api.onrender.com/api/v1/whatsapp/webhook",
        "setup_guide": {
            "step1": "Crie conta Twilio: https://www.twilio.com/try-twilio",
            "step2": "Ative sandbox WhatsApp: Twilio Console → Messaging → Try it out → WhatsApp",
            "step3": f"Configure webhook: https://viralcommerce-api.onrender.com/api/v1/whatsapp/webhook",
            "step4": "Adicione env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM",
        },
        "active_conversations": len(_conversation_history),
    }
