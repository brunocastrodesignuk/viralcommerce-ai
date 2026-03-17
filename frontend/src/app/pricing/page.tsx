"use client";

import { useState } from "react";
import { Check, Zap, Crown, Building2, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";
import { usePreferences, convertPrice, useT } from "@/store/preferences";

const PLANS = [
  {
    id: "free",
    name: "Gratuito",
    price: 0,
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
    cta: "Falar com Vendas",
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID ?? "price_enterprise",
  },
];

export default function PricingPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const { currency } = usePreferences();
  const t = useT();

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

    if (plan.id === "enterprise") {
      window.open("mailto:sales@viralcommerce.ai?subject=Plano Empresarial", "_blank");
      return;
    }

    setLoading(plan.id);
    try {
      const { data } = await api.post("/billing/create-checkout-session", {
        price_id: plan.priceId,
        success_url: `${window.location.origin}/settings?payment=success`,
        cancel_url: `${window.location.origin}/pricing`,
      });
      window.location.href = data.checkout_url;
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Falha ao iniciar checkout. Tente novamente.");
    } finally {
      setLoading(null);
    }
  };

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
        </div>

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
                      {plan.price === 0 ? t.pricing.free : convertPrice(plan.price, currency)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-500 mb-1.5">/{plan.interval}</span>
                    )}
                    {plan.price === 0 && (
                      <span className="text-gray-500 mb-1.5">{plan.interval}</span>
                    )}
                  </div>
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
                  ) : null}
                  {isCurrent ? t.pricing.currentPlan : plan.cta}
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
