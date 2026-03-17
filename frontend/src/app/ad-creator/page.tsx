"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Wand2, Copy, Check, RefreshCw, Zap, MessageSquare,
  Film, Mail, Globe, Package, Loader2, ChevronDown, ChevronUp,
  TrendingUp, Instagram, Youtube, ShoppingBag,
} from "lucide-react";
import { api, productsApi } from "@/lib/api";
import toast from "react-hot-toast";

// ─── Types ──────────────────────────────────────────────────────────────────
type Tone = "engaging" | "urgent" | "funny" | "aspirational" | "informative" | "trendy";
type AssetKey = "headline" | "description" | "hook" | "tiktok_script" | "caption" | "email_subject";
type Platform = "all" | "tiktok" | "instagram" | "facebook" | "google";

const TONES: { value: Tone; label: string; emoji: string }[] = [
  { value: "engaging",     label: "Engajante",    emoji: "🔥" },
  { value: "urgent",       label: "Urgência",     emoji: "⚡" },
  { value: "funny",        label: "Engraçado",    emoji: "😂" },
  { value: "aspirational", label: "Aspiracional", emoji: "✨" },
  { value: "informative",  label: "Informativo",  emoji: "📊" },
  { value: "trendy",       label: "Viral/Trend",  emoji: "📱" },
];

const ASSET_LABELS: Record<AssetKey, { label: string; icon: React.ElementType; desc: string }> = {
  headline:      { label: "Headlines",           icon: TrendingUp,    desc: "5 títulos para anúncios" },
  description:   { label: "Descrição",           icon: Package,       desc: "Texto de produto 150-200 words" },
  hook:          { label: "Hooks Virais",         icon: Zap,           desc: "5 ganchos para TikTok/Reels" },
  tiktok_script: { label: "Script TikTok",       icon: Film,          desc: "Script completo 60s" },
  caption:       { label: "Captions",            icon: Instagram,     desc: "3 captions com hashtags" },
  email_subject: { label: "Subject Lines Email", icon: Mail,          desc: "5 assuntos de email" },
};

const PLATFORM_PRESETS: Record<Platform, AssetKey[]> = {
  all:       ["headline", "description", "hook", "tiktok_script", "caption", "email_subject"],
  tiktok:    ["hook", "tiktok_script", "caption"],
  instagram: ["hook", "caption", "headline"],
  facebook:  ["headline", "description", "email_subject"],
  google:    ["headline", "description"],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
      title="Copiar"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function AssetCard({
  assetKey, content, isLoading,
}: {
  assetKey: AssetKey; content?: string; isLoading: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const { label, icon: Icon, desc } = ASSET_LABELS[assetKey];

  return (
    <div className="card">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-brand-500/10 rounded-lg">
            <Icon className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{label}</p>
            <p className="text-xs text-gray-500">{desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {content && <CopyButton text={content} />}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-600 text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
              Gerando com IA...
            </div>
          ) : content ? (
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
              {content}
            </pre>
          ) : (
            <div className="text-gray-600 text-sm py-3 text-center border border-dashed border-gray-800 rounded-lg">
              Preencha o produto e clique em Gerar
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdCreatorPage() {
  const [mode, setMode] = useState<"text" | "product">("text");
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [description, setDescription] = useState("");
  const [salePrice, setSalePrice] = useState(29.99);
  const [costPrice, setCostPrice] = useState(8.50);
  const [tone, setTone] = useState<Tone>("engaging");
  const [platform, setPlatform] = useState<Platform>("all");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [generatedAssets, setGeneratedAssets] = useState<Record<AssetKey, string> | null>(null);
  const [language, setLanguage] = useState("pt");

  // Load products for product-select mode
  const { data: productsData } = useQuery({
    queryKey: ["products-select"],
    queryFn: () => productsApi.list({ limit: 50, page: 1 }).then((r) => r.data),
    enabled: mode === "product",
  });

  const selectedAssets = PLATFORM_PRESETS[platform];

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (mode === "text") {
        if (!productName.trim()) throw new Error("Nome do produto obrigatório");
        const { data } = await api.post("/marketing/generate-free", {
          name: productName,
          category,
          description,
          sale_price: salePrice,
          cost_price: costPrice,
          tone,
          language,
          asset_types: selectedAssets,
        });
        return data.assets as Record<AssetKey, string>;
      } else {
        if (!selectedProductId) throw new Error("Selecione um produto");
        const { data } = await api.post(
          `/marketing/generate?product_id=${selectedProductId}&tone=${tone}&language=${language}`,
          selectedAssets.map((a) => a)
        );
        return data as Record<AssetKey, string>;
      }
    },
    onSuccess: (data) => {
      setGeneratedAssets(data);
      toast.success("🤖 Assets de marketing gerados com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao gerar assets");
    },
  });

  const handleGenerate = () => generateMutation.mutate();

  const handleCopyAll = () => {
    if (!generatedAssets) return;
    const text = Object.entries(generatedAssets)
      .map(([k, v]) => `=== ${ASSET_LABELS[k as AssetKey]?.label ?? k} ===\n${v}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    toast.success("Tudo copiado!");
  };

  const CATEGORIES = [
    "Electronics", "Beauty & Personal Care", "Home & Kitchen",
    "Sports & Outdoors", "Health & Wellness", "Clothing & Accessories",
    "Toys & Games", "Pet Supplies", "Kitchen Gadgets", "Fitness",
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-brand-400" />
            Ad Creator AI
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Gere copy completo para anúncios em 1 clique — hooks, scripts TikTok, emails, captions
          </p>
        </div>
        {generatedAssets && (
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors border border-gray-700"
          >
            <Copy className="w-4 h-4" />
            Copiar Tudo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Panel: Inputs ── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Mode Toggle */}
          <div className="card">
            <p className="text-xs text-gray-500 mb-2 font-medium">Modo de Entrada</p>
            <div className="flex gap-2">
              {[
                { value: "text", label: "Texto Livre", icon: MessageSquare },
                { value: "product", label: "Do Catálogo", icon: ShoppingBag },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setMode(value as "text" | "product")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    mode === value
                      ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                      : "bg-gray-800 text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="card space-y-3">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Produto</p>

            {mode === "text" ? (
              <>
                <div>
                  <label className="text-xs text-gray-500">Nome do Produto *</label>
                  <input
                    type="text"
                    placeholder="ex: Massageador Elétrico Shiatsu Pro"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Descrição / Benefícios (opcional)</label>
                  <textarea
                    placeholder="Descreva o produto, seus benefícios, público-alvo..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Preço Custo</label>
                    <div className="relative mt-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">£</span>
                      <input
                        type="number"
                        value={costPrice}
                        onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-6 pr-2 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Preço Venda</label>
                    <div className="relative mt-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">£</span>
                      <input
                        type="number"
                        value={salePrice}
                        onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-6 pr-2 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="text-xs text-gray-500">Selecionar Produto do Catálogo</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Escolha um produto --</option>
                  {(productsData?.items ?? []).map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({Math.round(p.viral_score ?? 0)}🔥)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Platform */}
          <div className="card space-y-3">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Plataforma</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "all",       label: "Tudo",      icon: "🌐" },
                { value: "tiktok",    label: "TikTok",    icon: "🎵" },
                { value: "instagram", label: "Instagram", icon: "📸" },
                { value: "facebook",  label: "Facebook",  icon: "👥" },
                { value: "google",    label: "Google",    icon: "🔍" },
              ].map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => setPlatform(value as Platform)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    platform === value
                      ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                      : "bg-gray-800 text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <span>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-600">
              {selectedAssets.length} tipos de asset selecionados
            </div>
          </div>

          {/* Tone & Language */}
          <div className="card space-y-3">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Tom & Idioma</p>
            <div className="grid grid-cols-2 gap-1.5">
              {TONES.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => setTone(value)}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                    tone === value
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "bg-gray-800 text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <span>{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs text-gray-500">Idioma</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              >
                <option value="pt">🇧🇷 Português</option>
                <option value="en">🇬🇧 English</option>
                <option value="es">🇪🇸 Español</option>
                <option value="fr">🇫🇷 Français</option>
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-all shadow-lg shadow-brand-500/20"
          >
            {generateMutation.isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Gerando com IA...</>
            ) : (
              <><Wand2 className="w-5 h-5" /> Gerar Assets ({selectedAssets.length})</>
            )}
          </button>
        </div>

        {/* ── Right Panel: Assets ── */}
        <div className="lg:col-span-2 space-y-4">
          {selectedAssets.map((assetKey) => (
            <AssetCard
              key={assetKey}
              assetKey={assetKey as AssetKey}
              content={generatedAssets?.[assetKey as AssetKey]}
              isLoading={generateMutation.isPending}
            />
          ))}

          {!generatedAssets && !generateMutation.isPending && (
            <div className="card border-dashed border-gray-700 bg-gray-800/20 flex flex-col items-center justify-center py-16 text-center">
              <Wand2 className="w-12 h-12 text-gray-700 mb-4" />
              <p className="text-gray-500 font-medium">Pronto para criar</p>
              <p className="text-gray-600 text-sm mt-1">
                Preencha os dados do produto e clique em Gerar
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Templates Gallery */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Film className="w-4 h-4 text-pink-400" />
          Templates de Hook Comprovados (clique para usar)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { hook: "POV: Você acabou de encontrar o produto mais viral do TikTok", category: "Curiosidade" },
            { hook: "Eu gastei £30 nisto e minha vida mudou — deixa eu explicar", category: "Storytelling" },
            { hook: "Para de rolar — isso vai te surpreender", category: "Parada" },
            { hook: "Todo mundo vai ter isso até o final do ano", category: "FOMO" },
            { hook: "Testei por 30 dias. O resultado me deixou sem palavras", category: "Prova" },
            { hook: "Se você tem [PROBLEMA], esse produto é pra você", category: "Dor" },
            { hook: "O algoritmo me mostrou isso às 3h da manhã e agora entendo o porquê", category: "Mistério" },
            { hook: "Comprei por curiosidade, agora compro toda semana", category: "Repetição" },
            { hook: "Isso não deveria funcionar tão bem assim", category: "Surpresa" },
          ].map(({ hook, category }) => (
            <button
              key={hook}
              onClick={() => {
                setDescription(description ? description + "\n\nHook: " + hook : "Hook: " + hook);
                toast.success("Hook adicionado à descrição!");
              }}
              className="text-left p-3 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-lg transition-colors group"
            >
              <p className="text-xs text-brand-400 mb-1">{category}</p>
              <p className="text-sm text-gray-300 group-hover:text-white">&quot;{hook}&quot;</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
