"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Zap, TrendingUp, Target, BarChart2, Search, ShoppingBag,
  Star, ArrowRight, Check, ChevronDown, Play, Globe, Shield,
  Sparkles, Users, DollarSign, Clock, Eye,
} from "lucide-react";

// ─── Demo product ticker ────────────────────────────────────────────────────

const DEMO_PRODUCTS = [
  { name: "Máscara LED Facial",    score: 97, revenue: "R$28.400", img: "https://picsum.photos/seed/200/400/400" },
  { name: "Organizador Magnético", score: 94, revenue: "R$19.200", img: "https://picsum.photos/seed/350/400/400" },
  { name: "Óculos Anti-Luz Azul",  score: 91, revenue: "R$35.700", img: "https://picsum.photos/seed/3/400/400"   },
  { name: "Gel Snail Mucin",       score: 89, revenue: "R$22.100", img: "https://picsum.photos/seed/203/400/400" },
  { name: "Slippers Cloud",        score: 88, revenue: "R$41.300", img: "https://picsum.photos/seed/433/400/400" },
  { name: "Gua Sha Cristal",       score: 95, revenue: "R$17.500", img: "https://picsum.photos/seed/201/400/400" },
  { name: "Lip Treatment",         score: 93, revenue: "R$26.900", img: "https://picsum.photos/seed/473/400/400" },
  { name: "Massageador Pescoço",   score: 90, revenue: "R$31.200", img: "https://picsum.photos/seed/247/400/400" },
];

const FEATURES = [
  {
    icon: Search,
    color: "sky",
    title: "Descoberta de Produtos Virais",
    desc: "IA monitora TikTok, Instagram e YouTube 24/7 para detectar produtos com alto potencial de vendas antes da concorrência.",
  },
  {
    icon: Target,
    color: "purple",
    title: "Geração de Anúncios com IA",
    desc: "Cria copy persuasiva, headlines e criativos para Meta Ads, Google Ads e TikTok Ads em segundos.",
  },
  {
    icon: ShoppingBag,
    color: "pink",
    title: "Rede de Fornecedores",
    desc: "Conecta automaticamente com AliExpress, CJ Dropshipping, Alibaba e Temu. Importação com 1 clique.",
  },
  {
    icon: BarChart2,
    color: "amber",
    title: "Analytics & ROAS em Tempo Real",
    desc: "Painel completo com ROAS por campanha, margem de lucro estimada e alerta de produtos esgotando.",
  },
  {
    icon: TrendingUp,
    color: "green",
    title: "Radar de Hashtags",
    desc: "Monitora as hashtags mais virais do TikTok e Instagram para você criar conteúdo no momento certo.",
  },
  {
    icon: Globe,
    color: "blue",
    title: "Suporte a 8 Idiomas",
    desc: "Interface disponível em Português, English, Español, Français, Deutsch, 日本語, 中文 e العربية.",
  },
];

const PLANS = [
  {
    name: "Gratuito",
    price: "R$0",
    interval: "para sempre",
    color: "gray",
    features: ["50 produtos/mês", "1 plataforma", "Analytics básico", "Suporte comunidade", "1 campanha ativa"],
    cta: "Começar Grátis",
    href: "/register",
  },
  {
    name: "Pro",
    price: "R$47",
    interval: "/mês",
    color: "sky",
    popular: true,
    features: ["Produtos ilimitados", "5 plataformas", "IA para marketing", "Analytics avançado + ROAS", "10 campanhas ativas", "Fornecedores automáticos", "Suporte prioritário"],
    cta: "Assinar Pro",
    href: "/pricing",
  },
  {
    name: "Empresarial",
    price: "R$197",
    interval: "/mês",
    color: "purple",
    features: ["Tudo do Pro", "Campanhas ilimitadas", "API Access", "White-label", "Gerente dedicado", "SLA 99,9%"],
    cta: "Falar com Vendas",
    href: "/pricing",
  },
];

const TESTIMONIALS = [
  {
    name: "Lucas M.",
    role: "Dropshipper Profissional",
    text: "Em 3 semanas encontrei 2 produtos que faturaram R$85k. A IA é incrível para detectar tendências antes de todo mundo.",
    rating: 5,
  },
  {
    name: "Rafaela C.",
    role: "E-commerce Manager",
    text: "Reduzi em 70% o tempo gasto pesquisando produtos. O painel de analytics me dá tudo que preciso em uma tela.",
    rating: 5,
  },
  {
    name: "Diego P.",
    role: "Marketing Digital",
    text: "A geração de anúncios com IA salvou horas de trabalho. Crio 10 variações de copy em menos de 1 minuto.",
    rating: 5,
  },
];

const STATS = [
  { value: "12.000+", label: "Produtos rastreados" },
  { value: "3 bilhões+", label: "Vídeos analisados/mês" },
  { value: "4.8x", label: "ROAS médio dos usuários" },
  { value: "150+", label: "Fornecedores verificados" },
];

// ─── Components ──────────────────────────────────────────────────────────────

function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-gray-950/95 backdrop-blur-md border-b border-gray-800/50" : "bg-transparent"}`}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg">ViralCommerce AI</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Funcionalidades</a>
          <a href="#pricing" className="hover:text-white transition-colors">Preços</a>
          <Link href="/docs" className="hover:text-white transition-colors">Documentação</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors hidden md:block">
            Entrar
          </Link>
          <Link
            href="/register"
            className="text-sm bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Começar Grátis
          </Link>
        </div>
      </div>
    </nav>
  );
}

function ProductTicker() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % DEMO_PRODUCTS.length), 2500);
    return () => clearInterval(t);
  }, []);
  const p = DEMO_PRODUCTS[idx];

  return (
    <div className="inline-flex items-center gap-3 bg-gray-900/80 border border-gray-700 rounded-full px-4 py-2 text-sm">
      <span className="flex items-center gap-1.5 text-green-400">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        Detectado agora
      </span>
      <span className="text-white font-medium">{p.name}</span>
      <span className="bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full text-xs font-bold">
        {p.score}% viral
      </span>
      <span className="text-gray-500">{p.revenue}/mês</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <NavBar />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-16 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-sky-500/10 rounded-full blur-3xl" />
          <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-10 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
          {/* Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <ProductTicker />

          <h1 className="mt-8 text-5xl md:text-7xl font-black text-white leading-tight">
            Descubra produtos virais{" "}
            <span className="bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">
              antes de todos
            </span>
          </h1>

          <p className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            IA que monitora TikTok, Instagram e YouTube em tempo real para encontrar os próximos produtos virais
            e gerar anúncios automaticamente. Escale seu dropshipping com dados reais.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-white text-lg font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-sky-500/25 hover:-translate-y-0.5"
            >
              <Zap className="w-5 h-5" />
              Começar Grátis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-lg font-semibold px-8 py-4 rounded-xl transition-colors"
            >
              <Play className="w-5 h-5" />
              Ver Demo
            </Link>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Sem cartão de crédito • Plano Gratuito para sempre • Cancele quando quiser
          </p>

          {/* Hero dashboard mockup */}
          <div className="mt-16 relative mx-auto max-w-4xl">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 shadow-2xl shadow-black/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 bg-gray-800 rounded-md h-6 mx-4" />
              </div>
              {/* Product grid with real images */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DEMO_PRODUCTS.slice(0, 4).map((p, i) => (
                  <div key={i} className="bg-gray-800 rounded-xl overflow-hidden">
                    <div className="h-24 relative overflow-hidden">
                      <img
                        src={p.img}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-1 right-1 bg-sky-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {p.score}%
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-gray-300 font-medium truncate">{p.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-sky-400 font-bold">{p.score}%</span>
                        <span className="text-xs text-green-400">{p.revenue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Floating badges */}
            <div className="absolute -left-4 top-1/3 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg animate-bounce hidden md:block">
              +R$28.400/mês
            </div>
            <div className="absolute -right-4 top-1/2 bg-sky-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg hidden md:block">
              97% viral score
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <section className="py-16 border-y border-gray-800 bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-3xl md:text-4xl font-black text-white">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sky-400 text-sm font-semibold uppercase tracking-wider">Funcionalidades</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mt-3">
              Tudo que você precisa para
              <br />
              <span className="bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">
                escalar no dropshipping
              </span>
            </h2>
            <p className="text-gray-400 mt-4 text-lg max-w-xl mx-auto">
              Uma plataforma completa com IA, da descoberta do produto até o anúncio publicado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              const colorMap: Record<string, string> = {
                sky: "bg-sky-500/10 text-sky-400 border-sky-500/20",
                purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                pink: "bg-pink-500/10 text-pink-400 border-pink-500/20",
                amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                green: "bg-green-500/10 text-green-400 border-green-500/20",
                blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
              };
              return (
                <div
                  key={f.title}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors group"
                >
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${colorMap[f.color]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-gray-900/50 border-y border-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-purple-400 text-sm font-semibold uppercase tracking-wider">Como funciona</span>
            <h2 className="text-4xl font-black text-white mt-3">De 0 a produto virando em 4 passos</h2>
          </div>
          <div className="space-y-6">
            {[
              { step: "01", icon: Search, color: "sky", title: "IA encontra produtos virais", desc: "Nossos crawlers varrem TikTok, Instagram e YouTube continuamente. Quando um produto dispara em visualizações, você é notificado na hora." },
              { step: "02", icon: ShoppingBag, color: "purple", title: "Conecte com fornecedores", desc: "Com 1 clique, encontre o fornecedor no AliExpress, CJ Dropshipping ou Alibaba com o melhor preço e prazo de entrega." },
              { step: "03", icon: Sparkles, color: "pink", title: "Gere anúncios com IA", desc: "A IA cria copy, headlines e scripts de vídeo otimizados para Meta Ads, TikTok Ads e Google Shopping — prontos para publicar." },
              { step: "04", icon: BarChart2, color: "green", title: "Monitore e escale", desc: "Acompanhe ROAS, CTR e margem em tempo real. Pause o que não funciona e dobre o orçamento no que está convertendo." },
            ].map((item) => {
              const Icon = item.icon;
              const colorMap: Record<string, string> = {
                sky: "bg-sky-500/10 text-sky-400 border-sky-500/20",
                purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                pink: "bg-pink-500/10 text-pink-400 border-pink-500/20",
                green: "bg-green-500/10 text-green-400 border-green-500/20",
              };
              return (
                <div key={item.step} className="flex gap-6 items-start bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className={`w-14 h-14 rounded-xl border flex items-center justify-center flex-shrink-0 ${colorMap[item.color]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-mono text-gray-600">{item.step}</span>
                      <h3 className="text-lg font-bold text-white">{item.title}</h3>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-amber-400 text-sm font-semibold uppercase tracking-wider">Depoimentos</span>
            <h2 className="text-4xl font-black text-white mt-3">O que dizem nossos usuários</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 bg-gray-900/50 border-y border-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-green-400 text-sm font-semibold uppercase tracking-wider">Preços</span>
            <h2 className="text-4xl font-black text-white mt-3">Simples e transparente</h2>
            <p className="text-gray-400 mt-3">Sem taxas ocultas. Cancele quando quiser.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-gray-900 rounded-2xl p-6 flex flex-col border ${
                  plan.popular ? "border-sky-500 shadow-xl shadow-sky-500/10" : "border-gray-800"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-sky-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Mais Popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <div className="flex items-end gap-1 mt-2">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-gray-500 mb-1">{plan.interval}</span>
                  </div>
                </div>
                <ul className="space-y-2.5 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.color === "sky" ? "text-sky-400" : plan.color === "purple" ? "text-purple-400" : "text-gray-500"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`w-full py-3 rounded-xl font-semibold text-sm text-center transition-colors ${
                    plan.popular
                      ? "bg-sky-500 hover:bg-sky-400 text-white"
                      : plan.color === "purple"
                      ? "bg-purple-600 hover:bg-purple-500 text-white"
                      : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-sky-500/10 to-purple-500/10 border border-sky-500/20 rounded-3xl p-12">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Pronto para encontrar o próximo produto viral?
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Junte-se a milhares de dropshippers que já escalam com IA.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white text-lg font-semibold px-10 py-4 rounded-xl transition-all hover:shadow-xl hover:shadow-sky-500/30 hover:-translate-y-1"
            >
              <Zap className="w-5 h-5" />
              Criar Conta Gratuita
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-gray-600 mt-4">Sem cartão de crédito necessário</p>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-sky-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-white font-bold">ViralCommerce AI</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Plataforma de inteligência de produto para dropshippers modernos.
              </p>
            </div>
            {[
              {
                title: "Produto",
                links: [
                  { label: "Funcionalidades", href: "#features" },
                  { label: "Preços", href: "#pricing" },
                  { label: "Documentação", href: "/docs" },
                ],
              },
              {
                title: "Conta",
                links: [
                  { label: "Cadastrar", href: "/register" },
                  { label: "Entrar", href: "/login" },
                  { label: "Dashboard", href: "/" },
                ],
              },
              {
                title: "Suporte",
                links: [
                  { label: "Guia de início rápido", href: "/docs#quickstart" },
                  { label: "API Reference", href: "/docs#api" },
                  { label: "Contato", href: `https://wa.me/447470361422?text=Olá!+Preciso+de+ajuda+com+o+ViralCommerce+AI` },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a href={l.href} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} ViralCommerce AI. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> SSL seguro
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> 8 idiomas
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> 99.9% uptime
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
