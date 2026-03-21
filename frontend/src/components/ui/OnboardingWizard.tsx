"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  X, ArrowRight, ArrowLeft, Search, DollarSign,
  Megaphone, Rocket, Flame, CheckCircle2, Package,
  ShoppingBag, TrendingUp, Star, Zap, ExternalLink,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WizardStep {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  content: React.ReactNode;
  cta?: { label: string; href: string };
}

// ── Steps content ─────────────────────────────────────────────────────────────

function StepBemVindo() {
  return (
    <div className="space-y-5">
      <p className="text-gray-300 leading-relaxed">
        Bem-vindo ao <span className="text-white font-semibold">ViralCommerce AI</span> — a plataforma que
        usa inteligência artificial para descobrir produtos virais e te ajudar a faturar na internet.
      </p>

      {/* O que você vai aprender */}
      <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700">
        <p className="text-xs text-sky-400 font-semibold uppercase tracking-wider mb-3">
          📋 O que você vai aprender neste guia
        </p>
        <div className="space-y-2">
          {[
            { icon: "🔍", text: "Como encontrar produtos virais que estão bombando agora" },
            { icon: "🏭", text: "Como achar fornecedores com preço baixo para revender" },
            { icon: "💰", text: "Como calcular sua margem de lucro antes de investir" },
            { icon: "📢", text: "Como criar anúncios prontos com IA em 60 segundos" },
            { icon: "🚀", text: "Como fazer sua primeira venda o mais rápido possível" },
          ].map((item) => (
            <div key={item.text} className="flex items-start gap-2.5">
              <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
              <p className="text-sm text-gray-300">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Potencial de ganhos */}
      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
        <p className="text-green-400 text-sm font-semibold mb-1">💵 Potencial de faturamento real</p>
        <p className="text-gray-300 text-xs leading-relaxed">
          Pessoas comuns estão faturando de <strong className="text-white">R$3.000 a R$30.000/mês</strong> revendendo
          produtos virais com margens de 200% a 500%. Você não precisa ter estoque — é tudo dropshipping.
        </p>
      </div>

      <p className="text-center text-xs text-gray-500">
        ⏱ Este guia leva menos de 3 minutos para ler
      </p>
    </div>
  );
}

function StepEncontreProduto() {
  return (
    <div className="space-y-5">
      <p className="text-gray-300 leading-relaxed">
        O <span className="text-sky-400 font-semibold">Scanner de Produtos Virais</span> monitora TikTok,
        Instagram e YouTube 24h por dia e pontua cada produto de 0 a 100 em potencial viral.
      </p>

      {/* Passo a passo */}
      <div className="space-y-2">
        {[
          {
            step: "1",
            text: "Clique em \"Produtos\" no menu lateral",
            detail: "Abre a lista de produtos virais descobertos pela IA",
            color: "bg-sky-500/20 border-sky-500/30 text-sky-400",
          },
          {
            step: "2",
            text: "Filtre por Score Viral ≥ 85",
            detail: "Produtos acima de 85 têm altíssimo potencial de conversão",
            color: "bg-orange-500/20 border-orange-500/30 text-orange-400",
          },
          {
            step: "3",
            text: "Clique em qualquer produto para ver a análise completa",
            detail: "Tendência, fornecedores, margem estimada e vídeos virais",
            color: "bg-purple-500/20 border-purple-500/30 text-purple-400",
          },
          {
            step: "4",
            text: "Use o botão \"Fornecedor\" para achar onde comprar",
            detail: "Acessa AliExpress, CJ Dropshipping e Temu diretamente",
            color: "bg-green-500/20 border-green-500/30 text-green-400",
          },
        ].map((s) => (
          <div key={s.step} className="flex gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${s.color}`}>
              <span className="text-xs font-bold">{s.step}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{s.text}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Dica */}
      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <p className="text-xs text-amber-400 font-semibold">💡 Dica de ouro</p>
        <p className="text-xs text-gray-400 mt-1">
          Produtos com score 90+ e menos de 10 mil posts no TikTok são uma mina de ouro —
          baixa concorrência, alto potencial viral. Seja o primeiro a vender!
        </p>
      </div>
    </div>
  );
}

function StepFornecedor() {
  return (
    <div className="space-y-5">
      <p className="text-gray-300 leading-relaxed">
        Depois de escolher um produto, o próximo passo é encontrar onde comprar barato para revender com lucro.
        Você <strong className="text-white">não precisa de estoque</strong> — use dropshipping!
      </p>

      {/* Fornecedores recomendados */}
      <div className="space-y-2">
        {[
          {
            name: "AliExpress",
            desc: "Ideal para iniciantes. Frete grátis, mínimo 1 unidade, pagamento fácil.",
            badge: "Recomendado para iniciantes",
            badgeColor: "bg-green-500/20 text-green-400",
            icon: "🛒",
            url: "https://www.aliexpress.com",
          },
          {
            name: "CJ Dropshipping",
            desc: "Entrega mais rápida (7–15 dias). Integração automática com lojas.",
            badge: "Entrega rápida",
            badgeColor: "bg-sky-500/20 text-sky-400",
            icon: "⚡",
            url: "https://app.cjdropshipping.com",
          },
          {
            name: "Temu",
            desc: "Preços muito baixos. Ótimo para testar produtos sem gastar muito.",
            badge: "Preço baixo",
            badgeColor: "bg-orange-500/20 text-orange-400",
            icon: "💸",
            url: "https://www.temu.com",
          },
        ].map((item) => (
          <a
            key={item.name}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-gray-800/60 border border-gray-700/60 hover:border-gray-500 rounded-xl transition-all group"
          >
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-white">{item.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.badgeColor}`}>
                  {item.badge}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-sky-400 transition-colors flex-shrink-0" />
          </a>
        ))}
      </div>

      <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20">
        <p className="text-xs text-sky-400 font-semibold">🔑 Como funciona o dropshipping</p>
        <p className="text-xs text-gray-400 mt-1">
          Você vende primeiro → recebe o pagamento → compra no fornecedor → ele envia direto pro seu cliente.
          <strong className="text-white"> Você nunca toca no produto!</strong>
        </p>
      </div>
    </div>
  );
}

function StepCalcularMargem() {
  return (
    <div className="space-y-5">
      <p className="text-gray-300 leading-relaxed">
        Antes de anunciar qualquer produto, use a <span className="text-green-400 font-semibold">Calculadora de Margem</span> para
        saber exatamente quanto você vai lucrar. A maioria das pessoas falha porque nunca calcula os custos reais.
      </p>

      {/* Exemplo real */}
      <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">📊 Exemplo real — LED Strip RGB</p>
        <div className="space-y-2">
          {[
            { label: "Custo no AliExpress", value: "R$ 25,00", color: "text-red-400" },
            { label: "+ Frete internacional", value: "R$ 15,00", color: "text-orange-400" },
            { label: "+ Taxa plataforma (Shopee/ML)", value: "R$ 10,00", color: "text-yellow-400" },
            { label: "Total de custo", value: "R$ 50,00", color: "text-amber-400" },
            { label: "Preço de venda", value: "R$ 149,90", color: "text-white" },
            { label: "Lucro líquido", value: "R$ 99,90 (66%)", color: "text-green-400" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{row.label}</span>
              <span className={`font-bold ${row.color}`}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
          <p className="text-xl font-black text-green-400">≥ 40%</p>
          <p className="text-xs text-gray-400 mt-1">Margem mínima segura</p>
        </div>
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
          <p className="text-xl font-black text-red-400">&lt; 30%</p>
          <p className="text-xs text-gray-400 mt-1">Anúncio come o lucro</p>
        </div>
      </div>
    </div>
  );
}

function StepAnuncio() {
  return (
    <div className="space-y-5">
      <p className="text-gray-300 leading-relaxed">
        O <span className="text-purple-400 font-semibold">Criador de Anúncios com IA</span> gera em segundos
        tudo que você precisa para anunciar — hooks, scripts, títulos e legendas otimizados para TikTok e Instagram.
      </p>

      {/* O que a IA gera */}
      <div className="grid grid-cols-1 gap-2">
        {[
          { label: "Hook para TikTok",      desc: "Abertura de 3 segundos que prende a atenção",         icon: "🎣" },
          { label: "Script de Vídeo",       desc: "Roteiro completo de 30–60s com chamada para ação",     icon: "🎬" },
          { label: "Copy para Meta Ads",    desc: "Texto principal + título + descrição prontos",          icon: "📣" },
          { label: "Legenda para Instagram",desc: "Caption com hashtags e emojis que engajam",             icon: "📸" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <span className="text-xl">{item.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
          </div>
        ))}
      </div>

      {/* Roteiro */}
      <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700">
        <p className="text-xs font-semibold text-white mb-2">Como criar seu primeiro anúncio:</p>
        <div className="space-y-1.5">
          {[
            "Vá em Campanhas → Novo Anúncio",
            "Selecione o produto viral que encontrou",
            "Clique em Gerar Anúncios — a IA cria 10 variações",
            "Copie e cole no TikTok Ads ou Meta Ads",
            "Comece com R$15–50/dia de orçamento",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-xs font-bold text-sky-400 mt-0.5 w-4 flex-shrink-0">{i + 1}.</span>
              <p className="text-xs text-gray-300">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepOndeVender() {
  return (
    <div className="space-y-5">
      <p className="text-gray-300 leading-relaxed">
        Você tem várias opções para vender — desde completamente gratuito até com loja própria.
        Recomendamos começar pelos canais gratuitos para validar o produto.
      </p>

      <div className="space-y-2">
        {[
          {
            channel: "TikTok / Instagram (orgânico)",
            desc: "Poste vídeos mostrando o produto em uso. Adicione o link de compra na bio. Totalmente grátis.",
            tags: ["Grátis", "Iniciante"],
            icon: "📱",
            color: "bg-pink-500/10 border-pink-500/20",
            tagColor: "text-pink-400",
          },
          {
            channel: "WhatsApp / Grupos",
            desc: "Venda para amigos e grupos temáticos. Use as descrições geradas pela IA do sistema.",
            tags: ["Grátis", "Mais fácil"],
            icon: "💬",
            color: "bg-green-500/10 border-green-500/20",
            tagColor: "text-green-400",
          },
          {
            channel: "Shopee / Mercado Livre",
            desc: "Cadastre o produto, use as fotos e textos da IA. Comece a receber pedidos em horas.",
            tags: ["Grátis p/ começar", "Intermediário"],
            icon: "🛒",
            color: "bg-orange-500/10 border-orange-500/20",
            tagColor: "text-orange-400",
          },
          {
            channel: "Loja Shopify",
            desc: "Importe produtos com 1 clique direto do sistema. Ideal para escalar.",
            tags: ["A partir de R$5/mês", "Avançado"],
            icon: "🏪",
            color: "bg-sky-500/10 border-sky-500/20",
            tagColor: "text-sky-400",
          },
        ].map((item) => (
          <div key={item.channel} className={`flex items-start gap-3 p-3 border rounded-xl ${item.color}`}>
            <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="text-sm font-semibold text-white">{item.channel}</p>
                {item.tags.map((tag) => (
                  <span key={tag} className={`text-xs font-medium ${item.tagColor}`}>• {tag}</span>
                ))}
              </div>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepPronto() {
  return (
    <div className="space-y-6">
      <div className="text-center py-2">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-sky-500/20 border border-green-500/20 items-center justify-center mb-3">
          <Rocket className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-white font-bold text-base">Você está pronto para vender! 🎉</h3>
        <p className="text-gray-400 text-sm mt-1">
          Comece agora pelos 3 passos abaixo e faça sua primeira venda ainda essa semana.
        </p>
      </div>

      {/* Checklist de ação */}
      <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700">
        <p className="text-xs font-semibold text-white uppercase tracking-wider mb-3">✅ Checklist — Primeira Venda</p>
        <div className="space-y-2">
          {[
            { text: "Escolhi 1 produto com score viral ≥ 85", link: "/products" },
            { text: "Verifiquei o preço no AliExpress/CJ", link: "/products" },
            { text: "Calculei a margem de lucro (≥40%)", link: "/profit-calculator" },
            { text: "Gerei os anúncios com IA", link: "/ad-creator" },
            { text: "Cadastrei na Shopee ou Mercado Livre", link: "/suppliers" },
          ].map((item, i) => (
            <Link
              key={i}
              href={item.link}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-4 h-4 rounded border border-gray-600 group-hover:border-green-500 transition-colors flex-shrink-0" />
              <p className="text-sm text-gray-300 group-hover:text-white transition-colors">{item.text}</p>
              <ArrowRight className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
            </Link>
          ))}
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="space-y-2">
        {[
          { href: "/products",          label: "Encontrar meu primeiro produto",   color: "bg-sky-500 hover:bg-sky-600",    icon: Search },
          { href: "/profit-calculator", label: "Calcular minha margem de lucro",   color: "bg-green-600 hover:bg-green-700",  icon: DollarSign },
          { href: "/ad-creator",        label: "Criar meu primeiro anúncio com IA", color: "bg-purple-600 hover:bg-purple-700", icon: Megaphone },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 p-3 rounded-xl ${item.color} text-white text-sm font-semibold transition-colors group`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>

      <p className="text-center text-xs text-gray-600">
        Tempo médio até a primeira venda: <span className="text-gray-400 font-semibold">3 a 7 dias</span>
      </p>
    </div>
  );
}

// ── Steps definition ──────────────────────────────────────────────────────────

const STEPS: WizardStep[] = [
  {
    id: 0,
    title: "Bem-vindo ao ViralCommerce AI! 🚀",
    subtitle: "Você está a 5 passos de fazer sua primeira venda",
    icon: Flame,
    iconColor: "text-sky-400",
    iconBg: "bg-gradient-to-br from-sky-500/20 to-purple-500/20 border-sky-500/20",
    content: <StepBemVindo />,
  },
  {
    id: 1,
    title: "Passo 1 — Encontre um Produto Viral 🔥",
    subtitle: "Nossa IA monitora TikTok, Instagram e YouTube 24h por dia",
    icon: Search,
    iconColor: "text-sky-400",
    iconBg: "bg-sky-500/10 border-sky-500/20",
    content: <StepEncontreProduto />,
    cta: { label: "Ver Produtos Virais →", href: "/products" },
  },
  {
    id: 2,
    title: "Passo 2 — Encontre o Fornecedor 🏭",
    subtitle: "Compre barato no AliExpress e revenda com alta margem",
    icon: ShoppingBag,
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    content: <StepFornecedor />,
    cta: { label: "Ver Fornecedores →", href: "/suppliers" },
  },
  {
    id: 3,
    title: "Passo 3 — Calcule sua Margem 💰",
    subtitle: "Saiba exatamente quanto vai lucrar antes de gastar",
    icon: DollarSign,
    iconColor: "text-green-400",
    iconBg: "bg-green-500/10 border-green-500/20",
    content: <StepCalcularMargem />,
    cta: { label: "Calculadora de Margem →", href: "/profit-calculator" },
  },
  {
    id: 4,
    title: "Passo 4 — Crie seus Anúncios com IA 📢",
    subtitle: "Hooks, scripts e copies prontos em menos de 60 segundos",
    icon: Megaphone,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/10 border-purple-500/20",
    content: <StepAnuncio />,
    cta: { label: "Criar Anúncio com IA →", href: "/ad-creator" },
  },
  {
    id: 5,
    title: "Passo 5 — Onde e Como Vender 🛒",
    subtitle: "Escolha o canal certo para começar a vender hoje",
    icon: TrendingUp,
    iconColor: "text-pink-400",
    iconBg: "bg-pink-500/10 border-pink-500/20",
    content: <StepOndeVender />,
  },
  {
    id: 6,
    title: "Tudo pronto! Hora de vender 🎉",
    subtitle: "Siga o checklist e faça sua primeira venda essa semana",
    icon: Rocket,
    iconColor: "text-green-400",
    iconBg: "bg-green-500/10 border-green-500/20",
    content: <StepPronto />,
    cta: { label: "Encontrar Meu Primeiro Produto →", href: "/products" },
  },
];

const STORAGE_KEY = "vc_wizard_done_v2";

// ── Component ─────────────────────────────────────────────────────────────────

export function OnboardingWizard() {
  const { user } = useAuthStore();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Só mostra para usuários autenticados que ainda não viram
    if (!user) return;
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) {
        const t = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage indisponível — não mostrar
    }
  }, [user]);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden"
        style={{ maxHeight: "calc(100vh - 2rem)" }}
      >
        {/* Barra de progresso */}
        <div className="h-1 bg-gray-800">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Botão fechar */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 z-10 p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Fechar guia"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Indicadores de passo */}
        <div className="flex items-center justify-center gap-1.5 pt-5 pb-1 px-6">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-6 bg-sky-500"
                  : i < step
                  ? "w-3 bg-sky-500/50"
                  : "w-3 bg-gray-700"
              }`}
              aria-label={`Ir para passo ${i + 1}`}
            />
          ))}
        </div>

        {/* Header */}
        <div className="px-6 pt-4 pb-2 flex items-start gap-4">
          <div className={`shrink-0 w-11 h-11 rounded-xl border flex items-center justify-center ${current.iconBg}`}>
            <Icon className={`w-5 h-5 ${current.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h2 className="text-base font-bold text-white leading-snug">{current.title}</h2>
            <p className="text-xs text-gray-500 mt-0.5 leading-snug">{current.subtitle}</p>
          </div>
        </div>

        {/* Divisor */}
        <div className="mx-6 h-px bg-gray-800 my-1" />

        {/* Conteúdo */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {current.content}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex items-center gap-3">
          {/* Voltar */}
          {!isFirst ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm font-medium rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </button>
          ) : (
            <button
              onClick={dismiss}
              className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Pular
            </button>
          )}

          <div className="flex-1" />

          {/* Ação primária */}
          {isLast ? (
            <Link
              href={current.cta?.href ?? "/products"}
              onClick={dismiss}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-green-500/20"
            >
              {current.cta?.label ?? "Vamos lá!"}
              <Rocket className="w-4 h-4" />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              {current.cta && (
                <Link
                  href={current.cta.href}
                  onClick={dismiss}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm font-medium rounded-xl transition-colors"
                >
                  {current.cta.label}
                </Link>
              )}
              <button
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold rounded-xl transition-colors"
              >
                Próximo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Contador de passo */}
        <p className="text-center text-[10px] text-gray-700 pb-2">
          {step + 1} / {STEPS.length} — {Math.round(progress)}% concluído
        </p>
      </div>
    </div>
  );
}

/**
 * Botão para reabrir o onboarding a qualquer momento (usado na página de Configurações).
 */
export function ReopenOnboardingButton() {
  const open = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    } catch {}
  };
  return (
    <button
      onClick={open}
      className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium transition-colors"
    >
      <Rocket className="w-4 h-4" />
      Ver guia de primeiras vendas novamente
    </button>
  );
}

export default OnboardingWizard;
