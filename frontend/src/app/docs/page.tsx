"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Zap, Search, ShoppingBag, Megaphone, BarChart2, Settings,
  ChevronRight, Copy, CheckCircle2, AlertCircle, Info, Terminal,
  ArrowRight, Globe, Shield, ExternalLink, TrendingUp, Package,
  CreditCard, Key, Users, Sparkles, Video,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
}

// ─── Nav sections ─────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  { id: "quickstart", title: "Início Rápido", icon: Zap },
  { id: "dashboard", title: "Dashboard", icon: BarChart2 },
  { id: "products", title: "Produtos Virais", icon: Package },
  { id: "suppliers", title: "Fornecedores", icon: ShoppingBag },
  { id: "campaigns", title: "Campanhas", icon: Megaphone },
  { id: "analytics", title: "Analytics", icon: TrendingUp },
  { id: "crawler", title: "Crawler", icon: Search },
  { id: "marketing", title: "IA Marketing", icon: Sparkles },
  { id: "billing", title: "Pagamentos", icon: CreditCard },
  { id: "api", title: "API Reference", icon: Terminal },
  { id: "admin", title: "Administração", icon: Shield },
];

// ─── Code Block ───────────────────────────────────────────────────────────────

function Code({ children, lang = "bash" }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copiado!");
  };
  return (
    <div className="relative group">
      <pre className={`bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm font-mono text-gray-300 overflow-x-auto`}>
        <code>{children}</code>
      </pre>
      <button
        onClick={copy}
        className="absolute top-3 right-3 p-1.5 bg-gray-800 hover:bg-gray-700 rounded-md text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
      >
        {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function Callout({ type, children }: { type: "info" | "warning" | "tip"; children: React.ReactNode }) {
  const map = {
    info: { icon: Info, cls: "border-blue-500/30 bg-blue-500/5 text-blue-300", iconCls: "text-blue-400" },
    warning: { icon: AlertCircle, cls: "border-amber-500/30 bg-amber-500/5 text-amber-300", iconCls: "text-amber-400" },
    tip: { icon: CheckCircle2, cls: "border-green-500/30 bg-green-500/5 text-green-300", iconCls: "text-green-400" },
  };
  const { icon: Icon, cls, iconCls } = map[type];
  return (
    <div className={`flex gap-3 p-4 rounded-xl border ${cls} text-sm`}>
      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${iconCls}`} />
      <div>{children}</div>
    </div>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-bold text-white mt-12 mb-4 flex items-center gap-2 scroll-mt-20">
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold text-gray-200 mt-6 mb-3">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-400 leading-relaxed mb-4">{children}</p>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("quickstart");

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/landing" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-sky-500 rounded-lg flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-white font-bold text-sm">ViralCommerce AI</span>
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-400 text-sm">Documentação</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
              Abrir App →
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar nav */}
        <aside className="w-56 flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-gray-800 py-6 px-3 hidden md:block">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3">Conteúdo</p>
          <nav className="space-y-0.5">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeSection === s.id
                      ? "bg-sky-500/10 text-sky-400 font-medium"
                      : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {s.title}
                </a>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-6 md:px-12 py-10 max-w-3xl">

          {/* ── Quickstart ──────────────────────────────────────── */}
          <H2 id="quickstart"><Zap className="w-6 h-6 text-sky-400" /> Início Rápido</H2>
          <P>Bem-vindo ao ViralCommerce AI — a plataforma que usa inteligência artificial para descobrir produtos virais, conectar fornecedores e lançar campanhas automaticamente.</P>

          <Callout type="tip">
            <strong>Demo instantânea:</strong> Acesse{" "}
            <Link href="/login" className="underline text-green-300">a página de login</Link>{" "}
            e use <code className="bg-gray-800 px-1 rounded">demo@viralcommerce.ai</code> / <code className="bg-gray-800 px-1 rounded">Demo1234!</code> para explorar com dados de demonstração.
          </Callout>

          <H3>1. Crie sua conta</H3>
          <P>Acesse <Link href="/register" className="text-sky-400 hover:underline">/register</Link> e crie sua conta gratuita. Nenhum cartão de crédito necessário.</P>

          <H3>2. Explore o Dashboard</H3>
          <P>O painel principal mostra produtos virais detectados nas últimas 24h, score viral médio e hashtags em tendência. Os dados são atualizados em tempo real.</P>

          <H3>3. Encontre um produto viral</H3>
          <P>Navegue até <strong>Produtos</strong> → filtre por score viral ≥ 85 → clique em um produto para ver detalhes de margem, fornecedores sugeridos e copy de anúncio.</P>

          <H3>4. Importe e lance</H3>
          <P>Clique em <strong>Importar</strong> no card do produto para salvar em sua lista, depois em <strong>Criar Campanha</strong> para lançar no TikTok Ads, Meta ou Google.</P>

          {/* ── Dashboard ───────────────────────────────────────── */}
          <H2 id="dashboard"><BarChart2 className="w-6 h-6 text-purple-400" /> Dashboard</H2>
          <P>O dashboard centraliza as métricas mais importantes do seu negócio:</P>
          <ul className="list-none space-y-2 mb-6">
            {[
              ["Produtos Virais 24h", "Total de produtos com score ≥ 70% detectados nas últimas 24 horas"],
              ["Score Viral Médio", "Média ponderada de todos os produtos ativos"],
              ["Vídeos Crawleados", "Número de vídeos analisados pelos robôs hoje"],
              ["Hashtags em Tendência", "Hashtags monitoradas com maior crescimento"],
              ["Timeline Viral", "Gráfico de evolução do score viral ao longo do tempo"],
              ["Ranking por Plataforma", "Onde seus produtos têm melhor desempenho (TikTok, Instagram, YouTube)"],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-2 text-sm">
                <ChevronRight className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-gray-200">{t}:</strong> <span className="text-gray-400">{d}</span></span>
              </li>
            ))}
          </ul>

          {/* ── Products ────────────────────────────────────────── */}
          <H2 id="products"><Package className="w-6 h-6 text-pink-400" /> Produtos Virais</H2>
          <P>A seção de produtos lista todos os itens detectados pelos crawlers com seu <strong>Viral Score</strong> — uma métrica de 0 a 100 calculada com base em:</P>
          <ul className="list-disc list-inside text-gray-400 space-y-1 mb-4 text-sm">
            <li>Crescimento de visualizações nas últimas 24h</li>
            <li>Número de vídeos usando o produto</li>
            <li>Velocidade de hashtags associadas</li>
            <li>Histórico de conversão da categoria</li>
          </ul>

          <H3>Filtros disponíveis</H3>
          <ul className="list-none space-y-1.5 mb-4 text-sm">
            {[
              ["Score Viral Mínimo", "Filtre apenas produtos com alta probabilidade de conversão (recomendado: ≥ 80)"],
              ["Categoria", "Beleza, Casa, Eletrônicos, Moda, Saúde, etc."],
              ["Plataforma", "TikTok, Instagram, YouTube, Amazon, Pinterest"],
              ["Ordenação", "Por score viral, mais recente, margem de lucro estimada"],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-2">
                <ChevronRight className="w-4 h-4 text-pink-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-gray-200">{t}:</strong> <span className="text-gray-400">{d}</span></span>
              </li>
            ))}
          </ul>

          <H3>Ações por produto</H3>
          <ul className="list-disc list-inside text-gray-400 space-y-1 mb-4 text-sm">
            <li><strong>Importar</strong> — salva o produto para o seu painel</li>
            <li><strong>Ver Anúncios</strong> — gera copy e criativos com IA</li>
            <li><strong>Ver Fornecedor</strong> — abre a busca no AliExpress/CJ/Alibaba</li>
            <li><strong>Miniatura IA</strong> — gera thumbnail de produto com IA</li>
          </ul>

          {/* ── Suppliers ───────────────────────────────────────── */}
          <H2 id="suppliers"><ShoppingBag className="w-6 h-6 text-amber-400" /> Fornecedores</H2>
          <P>O módulo de fornecedores conecta automaticamente com as maiores plataformas de sourcing do mundo:</P>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              ["🛒 AliExpress", "Maior variedade, preços baixos, envio mundial"],
              ["🏭 Alibaba", "Pedidos em quantidade, negociação direta com fábrica"],
              ["📦 CJ Dropshipping", "Integração fácil, fulfillment automático"],
              ["🛍 Temu", "Preços ultra-competitivos, crescimento acelerado"],
              ["🔗 Amazon Associates", "Programa de afiliados para produtos físicos"],
              ["🇧🇷 Fornecedores BR", "Em breve: Elo7, Mercado Livre, OLX"],
            ].map(([name, desc]) => (
              <div key={name} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                <p className="text-sm font-medium text-gray-200">{name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>

          <Callout type="info">
            Clicando em <strong>Ver Loja</strong> no card de fornecedor, você é redirecionado para a busca do produto específico na plataforma selecionada.
          </Callout>

          {/* ── Campaigns ───────────────────────────────────────── */}
          <H2 id="campaigns"><Megaphone className="w-6 h-6 text-sky-400" /> Campanhas</H2>
          <P>Crie e gerencie campanhas de anúncios para TikTok Ads, Meta Ads (Facebook/Instagram) e Google Ads.</P>

          <H3>Criando uma campanha</H3>
          <ol className="list-decimal list-inside text-gray-400 space-y-2 text-sm mb-4">
            <li>Clique em <strong>Nova Campanha</strong></li>
            <li>Selecione a rede de anúncios (TikTok / Meta / Google)</li>
            <li>Dê um nome e selecione o produto (opcional)</li>
            <li>Defina o orçamento diário (mínimo: R$25/dia)</li>
            <li>Clique em <strong>Criar Campanha</strong> — ela ficará como Rascunho</li>
            <li>Clique em ▶ para <strong>Lançar</strong> a campanha</li>
          </ol>

          <H3>Conectando APIs reais de anúncios</H3>
          <P>Para sincronizar dados reais de performance, adicione as variáveis de ambiente:</P>
          <Code>{`# TikTok Ads
TIKTOK_ADS_ACCESS_TOKEN=your_token_here

# Meta Ads (Facebook/Instagram)
META_ACCESS_TOKEN=your_token_here

# Google Ads
GOOGLE_ADS_DEVELOPER_TOKEN=your_token_here`}</Code>

          <Callout type="warning">
            Sem as API keys, o sistema usa dados estimados. As campanhas ainda são criadas e gerenciadas normalmente.
          </Callout>

          {/* ── Analytics ───────────────────────────────────────── */}
          <H2 id="analytics"><TrendingUp className="w-6 h-6 text-green-400" /> Analytics</H2>
          <P>O painel de Analytics oferece visão completa da performance:</P>
          <ul className="list-none space-y-2 mb-6 text-sm">
            {[
              ["Overview", "KPIs gerais: produtos virais, score médio, plataforma top"],
              ["Timeline Viral", "Gráfico de linha com score ao longo de 7/30 dias"],
              ["Distribuição por Plataforma", "Barras com volume e taxa de erro por fonte"],
              ["Breakdown por Categoria", "Pizza com distribuição de produtos por nicho"],
              ["Ad Performance", "ROAS, CTR e conversões por rede de anúncios"],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-2">
                <ChevronRight className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-gray-200">{t}:</strong> <span className="text-gray-400">{d}</span></span>
              </li>
            ))}
          </ul>

          {/* ── Crawler ─────────────────────────────────────────── */}
          <H2 id="crawler"><Search className="w-6 h-6 text-blue-400" /> Crawler</H2>
          <P>O Crawler é o motor por trás da descoberta de produtos. Ele analisa continuamente as plataformas sociais para detectar produtos em alta.</P>

          <H3>Iniciando um crawl manual</H3>
          <ol className="list-decimal list-inside text-gray-400 space-y-1 text-sm mb-4">
            <li>Acesse <strong>Crawler</strong> no menu lateral</li>
            <li>Clique em <strong>Iniciar Crawl</strong></li>
            <li>Selecione a plataforma (TikTok, Instagram, YouTube, etc.)</li>
            <li>O job aparece na lista com status em tempo real</li>
          </ol>

          <H3>Monitoramento</H3>
          <P>O painel mostra:</P>
          <ul className="list-disc list-inside text-gray-400 text-sm space-y-1 mb-4">
            <li><strong>Jobs ativos</strong> — crawls em execução agora</li>
            <li><strong>Atividade ao vivo</strong> — feed de produtos detectados em tempo real</li>
            <li><strong>Cobertura geográfica</strong> — mapa de regiões monitoradas</li>
            <li><strong>Stats</strong> — total de jobs, vídeos analisados, produtos encontrados</li>
          </ul>

          {/* ── Marketing AI ────────────────────────────────────── */}
          <H2 id="marketing"><Sparkles className="w-6 h-6 text-purple-400" /> IA Marketing</H2>
          <P>O módulo de marketing usa IA (Claude / Anthropic) para gerar automaticamente:</P>
          <ul className="list-disc list-inside text-gray-400 text-sm space-y-1 mb-4">
            <li>Copy de anúncio para Facebook/Instagram (carrossel, feed, stories)</li>
            <li>Script de vídeo para TikTok (hook + corpo + CTA)</li>
            <li>Headlines e descrições para Google Shopping</li>
            <li>E-mails de marketing e sequências de nutrição</li>
            <li>Thumbnails de produto (via IA de imagem)</li>
          </ul>

          <H3>Ativando geração com IA real</H3>
          <Code>{`# Adicione no .env do backend:
ANTHROPIC_API_KEY=sk-ant-api03-...
LLM_MODEL=claude-sonnet-4-6`}</Code>
          <P>Sem a chave, o sistema retorna templates pré-definidos de alta conversão.</P>

          {/* ── Billing ─────────────────────────────────────────── */}
          <H2 id="billing"><CreditCard className="w-6 h-6 text-rose-400" /> Pagamentos</H2>
          <P>O sistema suporta múltiplos provedores de pagamento:</P>

          <H3>Mercado Pago (Brasil — recomendado)</H3>
          <Code>{`MERCADOPAGO_ACCESS_TOKEN=TEST-xxxx  # sandbox
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxx  # produção`}</Code>
          <P>Aceita PIX, boleto bancário e cartão de crédito. Use <code className="bg-gray-800 px-1 rounded text-amber-300">TEST-</code> para sandbox.</P>

          <H3>Stripe (Internacional)</H3>
          <Code>{`STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...`}</Code>

          <H3>WhatsApp Fallback</H3>
          <P>Quando nenhum provedor de pagamento está configurado, os botões de compra redirecionam para WhatsApp:</P>
          <Code>{`SUPPORT_WHATSAPP=447470361422  # só dígitos, sem + ou espaços`}</Code>

          {/* ── API Reference ────────────────────────────────────── */}
          <H2 id="api"><Terminal className="w-6 h-6 text-emerald-400" /> API Reference</H2>
          <P>O backend expõe uma API REST completa documentada com Swagger/OpenAPI.</P>

          <H3>Base URL</H3>
          <Code>{`https://viralcommerce-api.onrender.com/api/v1`}</Code>

          <H3>Autenticação</H3>
          <P>A maioria dos endpoints requer token JWT no header:</P>
          <Code>{`Authorization: Bearer <token>

# Obtenha um token:
POST /auth/login
{
  "email": "seu@email.com",
  "password": "suasenha"
}`}</Code>

          <H3>Endpoints principais</H3>
          <div className="space-y-2 mb-6">
            {[
              ["GET", "/products/", "Lista produtos virais (filtros: score, categoria, plataforma)"],
              ["GET", "/products/trending", "Top produtos das últimas 24h"],
              ["GET", "/suppliers/", "Lista fornecedores verificados"],
              ["GET", "/campaigns/", "Suas campanhas de anúncios"],
              ["POST", "/campaigns/", "Cria nova campanha"],
              ["POST", "/campaigns/{id}/launch", "Lança campanha"],
              ["GET", "/analytics/overview", "KPIs do dashboard"],
              ["GET", "/analytics/ad-performance", "Performance por rede de anúncios"],
              ["GET", "/trends/hashtags/top", "Hashtags mais virais"],
              ["GET", "/crawler/stats", "Estatísticas do crawler"],
              ["GET", "/billing/payment-config", "Provedor de pagamento ativo"],
              ["POST", "/billing/create-checkout-session", "Cria sessão Stripe"],
              ["POST", "/billing/create-mp-preference", "Cria preferência Mercado Pago"],
            ].map(([method, path, desc]) => (
              <div key={path} className="flex items-start gap-3 text-sm bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
                <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                  method === "GET" ? "bg-green-500/20 text-green-400" :
                  method === "POST" ? "bg-blue-500/20 text-blue-400" :
                  "bg-amber-500/20 text-amber-400"
                }`}>
                  {method}
                </span>
                <span className="font-mono text-gray-300 flex-shrink-0">{path}</span>
                <span className="text-gray-500 text-xs mt-0.5">{desc}</span>
              </div>
            ))}
          </div>

          <Callout type="info">
            Documentação Swagger completa disponível em:{" "}
            <a href="https://viralcommerce-api.onrender.com/docs" target="_blank" rel="noopener noreferrer" className="underline text-blue-300 inline-flex items-center gap-1">
              viralcommerce-api.onrender.com/docs <ExternalLink className="w-3 h-3" />
            </a>
          </Callout>

          {/* ── Admin ───────────────────────────────────────────── */}
          <H2 id="admin"><Shield className="w-6 h-6 text-red-400" /> Administração</H2>
          <P>O painel de administração é acessível apenas com a senha secreta configurada no backend.</P>

          <H3>Acessar o painel admin</H3>
          <ol className="list-decimal list-inside text-gray-400 space-y-1 text-sm mb-4">
            <li>Acesse <code className="bg-gray-800 px-1 rounded">/viralcommerce-admin</code></li>
            <li>Digite a senha configurada em <code className="bg-gray-800 px-1 rounded text-amber-300">ADMIN_SECRET_KEY</code></li>
            <li>O painel exibe estatísticas de usuários, planos e ferramentas de gestão</li>
          </ol>

          <H3>Configuração da senha admin</H3>
          <Code>{`# .env do backend
ADMIN_SECRET_KEY=SuaSenhaSecreta123!`}</Code>

          <Callout type="warning">
            <strong>Nunca compartilhe</strong> a URL <code>/viralcommerce-admin</code> com usuários comuns. Ela não aparece no menu lateral — é secreta por design.
          </Callout>

          {/* ── Footer ──────────────────────────────────────────── */}
          <div className="mt-16 pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">Documentação ViralCommerce AI — Atualizada em {new Date().toLocaleDateString("pt-BR")}</p>
              <div className="flex gap-4">
                <Link href="/landing" className="text-sm text-sky-400 hover:underline">Landing Page</Link>
                <Link href="/" className="text-sm text-sky-400 hover:underline">Abrir App</Link>
                <a
                  href="https://wa.me/447470361422?text=Olá!+Tenho+uma+dúvida+sobre+o+ViralCommerce+AI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-sky-400 hover:underline"
                >
                  Suporte WhatsApp
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
