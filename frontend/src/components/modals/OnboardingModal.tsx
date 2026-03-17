"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import {
  X, ChevronRight, ChevronLeft, Check, ExternalLink,
  ShoppingBag, Zap, TrendingUp, DollarSign, Share2, Rocket,
} from "lucide-react";

const STORAGE_KEY = "vc_onboarding_done";

// ─── Steps definition ────────────────────────────────────────────────────────

const STEPS = [
  {
    id: "welcome",
    icon: Rocket,
    color: "from-sky-500 to-blue-600",
    title: "Bem-vindo ao ViralCommerce AI! 🚀",
    subtitle: "Você está a 5 passos de começar a vender hoje mesmo.",
    content: (
      <div className="space-y-4">
        <p className="text-gray-300 text-sm leading-relaxed">
          O ViralCommerce AI usa <strong className="text-white">inteligência artificial</strong> para descobrir
          produtos virais no TikTok, Instagram e YouTube — antes da concorrência.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { emoji: "🔍", label: "Detecta produtos virais automaticamente" },
            { emoji: "🏭", label: "Encontra fornecedores com alta margem" },
            { emoji: "📢", label: "Gera anúncios prontos com IA" },
          ].map((item) => (
            <div key={item.label} className="bg-gray-800 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">{item.emoji}</div>
              <p className="text-xs text-gray-400 leading-tight">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <p className="text-green-400 text-sm font-semibold">💰 Potencial de lucro real</p>
          <p className="text-gray-300 text-xs mt-1">
            Usuários como você estão faturando de R$3.000 a R$30.000/mês
            revendendo produtos virais com margens de 200% a 800%.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "accounts",
    icon: ShoppingBag,
    color: "from-purple-500 to-purple-700",
    title: "Passo 1 — Crie suas contas de fornecedor 🏭",
    subtitle: "Você precisa de pelo menos 1 conta para comprar e revender produtos.",
    content: (
      <div className="space-y-3">
        <p className="text-gray-400 text-xs mb-3">
          São todas <strong className="text-white">gratuitas</strong> para criar. Clique no link para abrir:
        </p>
        {[
          {
            name: "AliExpress",
            desc: "Melhor para iniciantes — produtos com frete grátis, mínimo 1 unidade",
            url: "https://www.aliexpress.com",
            badge: "Recomendado",
            badgeColor: "bg-green-500/20 text-green-400",
            time: "5 min",
          },
          {
            name: "CJ Dropshipping",
            desc: "Entrega mais rápida, integração automática com lojas",
            url: "https://app.cjdropshipping.com",
            badge: "Frete rápido",
            badgeColor: "bg-sky-500/20 text-sky-400",
            time: "10 min",
          },
          {
            name: "Shopee / Mercado Livre",
            desc: "Para vender no mercado brasileiro — crie conta de vendedor",
            url: "https://www.shopee.com.br",
            badge: "Brasil",
            badgeColor: "bg-orange-500/20 text-orange-400",
            time: "15 min",
          },
        ].map((item) => (
          <a
            key={item.name}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-xl transition-all group"
          >
            <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
              🏭
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white">{item.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.badgeColor}`}>
                  {item.badge}
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate">{item.desc}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-500">⏱ {item.time}</p>
              <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-sky-400 mt-0.5 ml-auto transition-colors" />
            </div>
          </a>
        ))}
      </div>
    ),
  },
  {
    id: "find-product",
    icon: TrendingUp,
    color: "from-red-500 to-orange-500",
    title: "Passo 2 — Encontre seu 1º produto viral 🔥",
    subtitle: "Nossa IA já encontrou dezenas de produtos com alto potencial de venda.",
    content: (
      <div className="space-y-4">
        <div className="bg-gray-800 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-white">Como usar o ViralCommerce:</p>
          {[
            { step: "1", text: "Vá em Produtos no menu lateral", icon: "📦" },
            { step: "2", text: "Filtre por Score Viral ≥ 85 para os melhores", icon: "🔥" },
            { step: "3", text: "Clique em \"Ver Fornecedor\" para encontrar onde comprar", icon: "🏭" },
            { step: "4", text: "Compre ou faça dropshipping diretamente", icon: "✅" },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-3">
              <div className="w-7 h-7 bg-sky-500/20 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                {item.icon}
              </div>
              <p className="text-sm text-gray-300">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
          <p className="text-amber-400 text-xs font-semibold">💡 Dica de ouro</p>
          <p className="text-gray-300 text-xs mt-1">
            Comece com produtos entre <strong className="text-white">R$20–80</strong> de custo
            e venda por 3–5× o preço. Foque em nichos: beleza, gadgets, casa e pets.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "sell",
    icon: DollarSign,
    color: "from-green-500 to-emerald-600",
    title: "Passo 3 — Onde e como vender 💰",
    subtitle: "Você tem várias opções para começar a vender hoje mesmo.",
    content: (
      <div className="space-y-3">
        {[
          {
            channel: "Instagram & TikTok Shop",
            desc: "Poste vídeos mostrando o produto. Adicione o link na bio ou use o TikTok Shop.",
            difficulty: "Fácil",
            cost: "Grátis",
            icon: "📱",
            color: "bg-pink-500/10 border-pink-500/20",
          },
          {
            channel: "WhatsApp / Grupos",
            desc: "Venda para conhecidos e grupos temáticos. Copie descrições da IA do sistema.",
            difficulty: "Fácil",
            cost: "Grátis",
            icon: "💬",
            color: "bg-green-500/10 border-green-500/20",
          },
          {
            channel: "Shopee / Mercado Livre",
            desc: "Liste o produto, use as fotos e descrições geradas pela IA.",
            difficulty: "Médio",
            cost: "Grátis",
            icon: "🛒",
            color: "bg-orange-500/10 border-orange-500/20",
          },
          {
            channel: "Loja Shopify",
            desc: "Importe produtos diretamente do sistema com 1 clique.",
            difficulty: "Médio",
            cost: "A partir de $1/mês",
            icon: "🏪",
            color: "bg-sky-500/10 border-sky-500/20",
          },
        ].map((item) => (
          <div key={item.channel} className={`flex items-start gap-3 p-3 border rounded-xl ${item.color}`}>
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white">{item.channel}</p>
                <span className="text-xs text-gray-500">• {item.difficulty} • {item.cost}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "ads",
    icon: Zap,
    color: "from-yellow-500 to-amber-600",
    title: "Passo 4 — Lance seu 1º anúncio 📢",
    subtitle: "A IA cria copy pronto. Você só precisa subir no TikTok ou Meta.",
    content: (
      <div className="space-y-4">
        <div className="bg-gray-800 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-white">Roteiro para o 1º anúncio:</p>
          {[
            { text: "Vá em Campanhas → Novo Anúncio", icon: "1️⃣" },
            { text: "Selecione o produto viral que encontrou", icon: "2️⃣" },
            { text: "A IA gera 10 headlines e copies prontas", icon: "3️⃣" },
            { text: "Copie o texto e cole no TikTok Ads ou Meta Ads", icon: "4️⃣" },
            { text: "Comece com R$10–30/dia de orçamento", icon: "5️⃣" },
          ].map((item) => (
            <div key={item.icon} className="flex items-center gap-3">
              <span className="text-base flex-shrink-0">{item.icon}</span>
              <p className="text-sm text-gray-300">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <a
            href="https://ads.tiktok.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-2.5 bg-black border border-gray-700 hover:border-gray-500 rounded-xl text-xs font-medium text-white transition-colors"
          >
            <span>📱</span> TikTok Ads
          </a>
          <a
            href="https://business.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-2.5 bg-blue-900/30 border border-blue-700/40 hover:border-blue-500 rounded-xl text-xs font-medium text-white transition-colors"
          >
            <span>📘</span> Meta Ads
          </a>
        </div>
        <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3">
          <p className="text-sky-400 text-xs font-semibold">🎯 Meta de 30 dias</p>
          <p className="text-gray-300 text-xs mt-1">
            Com R$30/dia de anúncio num produto viral, é possível faturar
            <strong className="text-white"> R$2.000–R$8.000/mês</strong> no primeiro mês.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "share",
    icon: Share2,
    color: "from-indigo-500 to-purple-600",
    title: "Bônus — Ganhe indicando amigos! 🎁",
    subtitle: "Compartilhe seu link de afiliado e ganhe comissão recorrente.",
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4">
          <p className="text-white font-semibold mb-1">Programa de Afiliados ViralCommerce</p>
          <p className="text-gray-300 text-sm">
            Ganhe <strong className="text-green-400">30% de comissão recorrente</strong> para cada amigo
            que assinar o plano Pro ou Empresarial pelo seu link.
          </p>
        </div>
        {[
          { emoji: "👤", text: "1 amigo indicado = R$14,10/mês recorrente (Pro)" },
          { emoji: "👥", text: "5 amigos = R$70,50/mês passivo" },
          { emoji: "🏆", text: "20 amigos = R$282/mês só de indicações" },
        ].map((item) => (
          <div key={item.text} className="flex items-center gap-3 text-sm">
            <span className="text-xl">{item.emoji}</span>
            <span className="text-gray-300">{item.text}</span>
          </div>
        ))}
        <div className="bg-gray-800 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-2">Seu link de afiliado está em:</p>
          <p className="text-sky-400 text-sm font-medium">
            ⚙️ Configurações → Link de Afiliado
          </p>
        </div>
        <p className="text-xs text-gray-500 text-center">
          Tudo pronto! Vamos começar? 🚀
        </p>
      </div>
    ),
  },
];

// ─── Modal Component ──────────────────────────────────────────────────────────

export function OnboardingModal() {
  const { user } = useAuthStore();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Only show for logged-in users who haven't seen it
    if (user && typeof window !== "undefined") {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) {
        // Small delay to let the page render first
        const t = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(t);
      }
    }
  }, [user]);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={close}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-800">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-purple-500 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className={`bg-gradient-to-r ${current.color} p-6`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">
                  {current.title}
                </h2>
                <p className="text-white/70 text-xs mt-0.5">{current.subtitle}</p>
              </div>
            </div>
            <button
              onClick={close}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Step pills */}
          <div className="flex items-center gap-1.5 mt-4">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-6 bg-white"
                    : i < step
                    ? "w-3 bg-white/60"
                    : "w-3 bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-80">
          {current.content}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
          <button
            onClick={() => (isFirst ? close() : setStep(step - 1))}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isFirst ? (
              "Pular tutorial"
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </>
            )}
          </button>

          <span className="text-xs text-gray-600">
            {step + 1} / {STEPS.length}
          </span>

          <button
            onClick={() => (isLast ? close() : setStep(step + 1))}
            className={`flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
              isLast
                ? "bg-green-600 hover:bg-green-500 text-white"
                : "bg-sky-600 hover:bg-sky-500 text-white"
            }`}
          >
            {isLast ? (
              <>
                <Check className="w-4 h-4" />
                Vamos começar!
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Button to re-open the onboarding at any time.
 * Used in Settings page.
 */
export function ReopenOnboardingButton() {
  const open = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };
  return (
    <button
      onClick={open}
      className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium transition-colors"
    >
      <Rocket className="w-4 h-4" />
      Ver guia de início novamente
    </button>
  );
}
