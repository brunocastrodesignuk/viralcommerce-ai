"use client";

import { useState, useEffect } from "react";
import { Check, Zap, Crown, Building2, Loader2, MessageCircle, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";
import { usePreferences, convertPrice, useT } from "@/store/preferences";

interface PaymentConfig {
  stripe: boolean;
  mercadopago: boolean;
  any_configured: boolean;
  whatsapp: string;
  stripe_methods?: string[];
  mp_methods?: string[];
  all_methods?: string[];
}

const PLANS = [
  {
    id: "free",
    name: "Gratuito",
    price: 0,
    priceBRL: 0,
    interval: "para sempre",
    icon: Zap,
    color: "gray",
    description: "Perfeito para começar",
    features: [
      "50 produtos/mês",
      "1 plataforma de rastreamento",
      "Analytics básico",
      "Suporte da comunidade",
      "1 campanha ativa",
    ],
    cta: "Começar Grátis",
    priceId: null,
  },
  {
    id: "pro",
    name: "Pro",
    price: 47,
    priceBRL: 47,
    interval: "mês",
    icon: Crown,
    color: "sky",
    description: "Para dropshippers sérios",
    features: [
      "Produtos ilimitados",
      "5 plataformas rastreadas",
      "Geração de marketing com IA",
      "Analytics avançado + ROAS",
      "10 campanhas ativas",
      "Descoberta automática de fornecedores",
      "Suporte prioritário",
    ],
    cta: "Assinar Pro",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? "price_pro",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Empresarial",
    price: 197,
    priceBRL: 197,
    interval: "mês",
    icon: Building2,
    color: "purple",
    description: "Para equipes e agências",
    features: [
      "Tudo do plano Pro",
      "Campanhas ilimitadas",
      "Alvos de rastreamento personalizados",
      "Exportação white-label",
      "Acesso à API",
      "Gerente de conta dedicado",
      "SLA 99,9% de uptime",
    ],
    cta: "Assinar Empresarial",
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID ?? "price_enterprise",
  },
];

export default function PricingPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [payConfig, setPayConfig] = useState<PaymentConfig | null>(null);
  const { currency } = usePreferences();
  const t = useT();

  useEffect(() => {
    api.get("/billing/payment-config")
      .then((r) => setPayConfig(r.data))
      .catch(() => setPayConfig({ stripe: false, mercadopago: false, any_configured: false, whatsapp: "" }));
  }, []);

  const handleSubscribe = async (plan: typeof PLANS[0]) => {
    if (!plan.priceId || plan.id === "free") {
      if (!isAuthenticated) window.location.href = "/register";
      else toast.success("Você já está no plano Gratuito!");
      return;
    }

    if (!isAuthenticated) {
      toast.error("Faça login primeiro para assinar um plano.");
      window.location.href = "/login";
      return;
    }

    // Enterprise: use payment if configured, otherwise WhatsApp/email
    if (plan.id === "enterprise") {
      // If payment is configured AND we have an enterprise price ID, use checkout
      const hasEnterpriseCheckout =
        payConfig?.any_configured &&
        plan.priceId &&
        plan.priceId !== "price_enterprise";
      if (!hasEnterpriseCheckout) {
        const wa = payConfig?.whatsapp;
        if (wa) {
          const msg = encodeURIComponent(`Olá! Tenho interesse no Plano Empresarial do ViralCommerce AI.`);
          window.open(`https://wa.me/${wa.replace(/\D/g, "")}?text=${msg}`, "_blank");
        } else {
          window.open("mailto:contato@viralcommerce.ai?subject=Plano Empresarial", "_blank");
        }
        return;
      }
      // Fall through to normal checkout below
    }

    // No payment configured
    if (!payConfig?.any_configured) {
      const wa = payConfig?.whatsapp;
      if (wa) {
        const msg = encodeURIComponent(`Olá! Quero assinar o Plano ${plan.name} do ViralCommerce AI.`);
        window.open(`https://wa.me/${wa.replace(/\D/g, "")}?text=${msg}`, "_blank");
      } else {
        toast.error("Sistema de pagamento ainda não configurado. Entre em contato com o suporte.");
      }
      return;
    }

    setLoading(plan.id);
    try {
      // Prefer Mercado Pago (Brazilian), fallback to Stripe
      if (payConfig?.mercadopago) {
        const { data } = await api.post("/billing/create-mp-preference", {
          plan_id: plan.id,
          plan_name: plan.name,
          price: plan.priceBRL,
          success_url: `${window.location.origin}/settings?payment=success`,
          cancel_url: `${window.location.origin}/pricing`,
        });
        window.location.href = data.checkout_url;
      } else {
        const { data } = await api.post("/billing/create-checkout-session", {
          price_id: plan.priceId,
          success_url: `${window.location.origin}/settings?payment=success`,
          cancel_url: `${window.location.origin}/pricing`,
        });
        window.location.href = data.checkout_url;
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Falha ao iniciar checkout. Tente novamente.");
    } finally {
      setLoading(null);
    }
  };

  const noPayment = payConfig !== null && !payConfig.any_configured;

  return (
    <div className="py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            {t.pricing.title}
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            {t.pricing.subtitle}
          </p>
          {/* Payment provider badges */}
          {payConfig && (
            <div className="mt-5 space-y-2">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {payConfig.mercadopago && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-full text-xs text-sky-400 font-medium">
                    ✅ Mercado Pago — PIX · Boleto · Cartão
                  </span>
                )}
                {payConfig.stripe && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs text-purple-400 font-medium">
                    ✅ Stripe — Card · Apple Pay · Google Pay
                  </span>
                )}
                {payConfig.stripe && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400 font-medium">
                    ✅ PayPal · Klarna · Link
                  </span>
                )}
              </div>
              {payConfig.any_configured && (
                <p className="text-xs text-gray-500 text-center">
                  🌍 Aceito em 135+ países • SSL seguro • Cancele quando quiser
                </p>
              )}
            </div>
          )}
        </div>

        {/* No payment warning banner */}
        {noPayment && (
          <div className="mb-8 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-400">Pagamentos não configurados</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Configure <code className="text-amber-300">MERCADOPAGO_ACCESS_TOKEN</code> ou <code className="text-amber-300">STRIPE_SECRET_KEY</code> no arquivo <code className="text-amber-300">.env</code> para ativar o checkout automático.
                {payConfig?.whatsapp ? " Clicando no botão você será redirecionado para o WhatsApp." : ""}
              </p>
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = user?.plan === plan.id;
            const isPopular = plan.popular;

            return (
              <div
                key={plan.id}
                className={`relative bg-gray-900 border rounded-2xl p-6 flex flex-col ${
                  isPopular
                    ? "border-sky-500 shadow-lg shadow-sky-500/10"
                    : "border-gray-800"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-sky-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {t.pricing.mostPopular}
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                    plan.color === "sky" ? "bg-sky-500/10" :
                    plan.color === "purple" ? "bg-purple-500/10" : "bg-gray-800"
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      plan.color === "sky" ? "text-sky-400" :
                      plan.color === "purple" ? "text-purple-400" : "text-gray-400"
                    }`} />
                  </div>
                  <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold text-white">
                      {plan.price === 0 ? t.pricing.free : `R$${plan.priceBRL}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-500 mb-1.5">/{plan.interval}</span>
                    )}
                    {plan.price === 0 && (
                      <span className="text-gray-500 mb-1.5">{plan.interval}</span>
                    )}
                  </div>
                  {plan.price > 0 && (
                    <p className="text-xs text-gray-600 mt-1">
                      PIX · Boleto · Cartão · Apple Pay · Google Pay · PayPal
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2.5 flex-1 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className={`w-4 h-4 flex-shrink-0 ${
                        plan.color === "sky" ? "text-sky-400" :
                        plan.color === "purple" ? "text-purple-400" : "text-gray-500"
                      }`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading === plan.id || isCurrent}
                  className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                    isCurrent
                      ? "bg-gray-800 text-gray-500 cursor-default"
                      : isPopular
                      ? "bg-sky-500 hover:bg-sky-400 text-white"
                      : plan.color === "purple"
                      ? "bg-purple-600 hover:bg-purple-500 text-white"
                      : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                  }`}
                >
                  {loading === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : noPayment && plan.id !== "free" ? (
                    <MessageCircle className="w-4 h-4" />
                  ) : null}
                  {isCurrent
                    ? t.pricing.currentPlan
                    : noPayment && plan.id !== "free"
                    ? (payConfig?.whatsapp ? "Falar no WhatsApp" : plan.cta)
                    : plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-gray-600 mt-8">
          {t.pricing.trialNote}{" "}
          <Link href="/" className="text-sky-400 hover:text-sky-300">{t.common.back}</Link>
        </p>
      </div>
    </div>
  );
}
