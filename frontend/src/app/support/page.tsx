"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle, Send, Bot, User, Loader2, ExternalLink,
  HelpCircle, CreditCard, Package, Zap, ChevronDown, ChevronUp,
  Phone, Mail,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ = [
  {
    icon: CreditCard,
    q: "Como funciona o pagamento e posso cancelar quando quiser?",
    a: "Sim! Todos os planos são mensais e você pode cancelar a qualquer momento sem multa. O acesso continua até o fim do período pago. Aceitamos PIX, Boleto, Cartão de crédito, Apple Pay, Google Pay e PayPal.",
  },
  {
    icon: Package,
    q: "O plano Gratuito tem limite de produtos?",
    a: "O Plano Gratuito inclui 50 produtos/mês rastreados, 1 campanha ativa e analytics básico. Para acesso ilimitado, o Plano Pro por R$47/mês remove todos os limites.",
  },
  {
    icon: Zap,
    q: "Como a IA gera os anúncios e copy?",
    a: "Usamos o Claude (Anthropic) para analisar o produto e gerar headlines, body copy e CTAs otimizados para Meta Ads, Google Ads e TikTok Ads. O processo leva menos de 30 segundos.",
  },
  {
    icon: Package,
    q: "Como importar produtos para minha loja Shopify?",
    a: "Na página de detalhes de qualquer produto, clique em 'Importar para Shopify'. Você vai precisar inserir a URL da sua loja (ex: minha-loja.myshopify.com) e um token de acesso da API do Shopify. O produto é criado como rascunho para você revisar antes de publicar.",
  },
  {
    icon: Zap,
    q: "Quais plataformas o sistema monitora?",
    a: "Monitoramos TikTok, Instagram, YouTube, Pinterest e Amazon. No Plano Pro você tem acesso a 5 plataformas simultaneamente. No Empresarial, todas sem limite.",
  },
  {
    icon: CreditCard,
    q: "O que acontece com meus dados se eu cancelar?",
    a: "Seus dados ficam salvos por 30 dias após o cancelamento. Se você reativar dentro desse período, tudo é restaurado. Após 30 dias, os dados são removidos permanentemente.",
  },
];

// ─── Chat Component ───────────────────────────────────────────────────────────

function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Olá! 👋 Sou o assistente virtual do ViralCommerce AI. Posso ajudar com dúvidas sobre planos, funcionalidades, pagamentos e uso do sistema. Como posso te ajudar hoje?",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/support/chat", {
        message: text,
        history: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        user_plan: user?.plan ?? "free",
      });
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply, ts: Date.now() },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Desculpe, ocorreu um erro. Por favor, tente novamente ou entre em contato via WhatsApp.",
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickReplies = [
    "Como funciona o Plano Pro?",
    "Como importar para o Shopify?",
    "Quais métodos de pagamento?",
    "Cancelar minha assinatura",
  ];

  return (
    <div className="card flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
        <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-purple-600 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm">Assistente ViralCommerce</p>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-400">Online agora</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === "assistant"
                ? "bg-sky-500/20 text-sky-400"
                : "bg-purple-500/20 text-purple-400"
            }`}>
              {msg.role === "assistant"
                ? <Bot className="w-3.5 h-3.5" />
                : <User className="w-3.5 h-3.5" />
              }
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === "assistant"
                ? "bg-gray-800 text-gray-200 rounded-tl-none"
                : "bg-sky-600 text-white rounded-tr-none"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-sky-500/20 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3">
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 pb-3">
          {quickReplies.map((r) => (
            <button
              key={r}
              onClick={() => { setInput(r); }}
              className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full border border-gray-700 transition-colors"
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-gray-800">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Digite sua mensagem..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-sky-500"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="w-10 h-10 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}

// ─── FAQ Component ────────────────────────────────────────────────────────────

function FAQItem({ item }: { item: typeof FAQ[0] }) {
  const [open, setOpen] = useState(false);
  const Icon = item.icon;
  return (
    <div className="card cursor-pointer" onClick={() => setOpen(!open)}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-sky-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-sky-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium">{item.q}</p>
          {open && (
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">{item.a}</p>
          )}
        </div>
        <div className="flex-shrink-0 ml-2">
          {open
            ? <ChevronUp className="w-4 h-4 text-gray-500" />
            : <ChevronDown className="w-4 h-4 text-gray-500" />
          }
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupportPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-sky-400" />
          Central de Suporte
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Tire suas dúvidas com nosso assistente de IA ou consulte as perguntas frequentes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <Bot className="w-4 h-4 text-sky-400" />
            Chat com IA — respostas instantâneas
          </h2>
          <ChatWidget />
        </div>

        {/* FAQ + Contact */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-purple-400" />
            Perguntas Frequentes
          </h2>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <FAQItem key={i} item={item} />
            ))}
          </div>

          {/* Contact options */}
          <div className="card">
            <p className="text-sm font-semibold text-white mb-3">Precisa de ajuda humana?</p>
            <div className="space-y-2">
              <a
                href="https://wa.me/447470361422?text=Ol%C3%A1!%20Preciso%20de%20suporte%20com%20o%20ViralCommerce%20AI."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl transition-colors"
              >
                <Phone className="w-4 h-4 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-400">WhatsApp Suporte</p>
                  <p className="text-xs text-gray-500">Resposta em até 2h (dias úteis)</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-green-500 ml-auto" />
              </a>
              <a
                href="mailto:suporte@viralcommerce.ai"
                className="flex items-center gap-3 px-4 py-3 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-xl transition-colors"
              >
                <Mail className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-sky-400">E-mail</p>
                  <p className="text-xs text-gray-500">suporte@viralcommerce.ai</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
