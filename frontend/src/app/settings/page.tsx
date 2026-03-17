"use client";

import { useState, useEffect } from "react";
import {
  Key, Globe, Bell, Shield, ChevronRight,
  Eye, EyeOff, Check, Copy, RefreshCw, Loader2,
  Paintbrush, Languages, DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  usePreferences, applyTheme,
  THEMES, LANGUAGES, CURRENCIES,
  type ThemeId, type LangId, type CurrencyId,
} from "@/store/preferences";

// ─── Shared sub-components ────────────────────────────────────────────────────

function Section({
  title, description, icon: Icon, children,
}: {
  title: string; description: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800">
        <div className="p-2 bg-gray-800 rounded-lg">
          <Icon className="w-4 h-4 text-gray-300" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label, value, type = "text", placeholder, onChange, hint,
}: {
  label: string; value: string; type?: string; placeholder?: string;
  onChange: (v: string) => void; hint?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={isPassword && !show ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-sky-500 transition-colors"
        />
        {isPassword && (
          <button
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-gray-600 mt-1">{hint}</p>}
    </div>
  );
}

function Toggle({ label, description, enabled, onChange }: {
  label: string; description: string; enabled: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-200">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-sky-500" : "bg-gray-700"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export default function SettingsPage() {
  // Preferences (theme / language / currency)
  const { theme, language, currency, setTheme, setLanguage, setCurrency } = usePreferences();

  // Apply theme whenever it changes
  useEffect(() => { applyTheme(theme); }, [theme]);

  // API Keys
  const [anthropicKey, setAnthropicKey] = useState("");
  const [metaToken, setMetaToken] = useState("");
  const [googleToken, setGoogleToken] = useState("");
  const [tiktokToken, setTiktokToken] = useState("");
  const [youtubeKey, setYoutubeKey] = useState("");

  // Crawler
  const [crawlInterval, setCrawlInterval] = useState("30");
  const [maxConcurrent, setMaxConcurrent] = useState("5");
  const [viralThreshold, setViralThreshold] = useState("70");
  const [useProxy, setUseProxy] = useState(false);
  const [proxyUrl, setProxyUrl] = useState("");

  // Campaign
  const [killRoas, setKillRoas] = useState("0.8");
  const [scaleRoas, setScaleRoas] = useState("2.5");
  const [initialBudget, setInitialBudget] = useState("5");
  const [adCount, setAdCount] = useState("10");
  const [autoPause, setAutoPause] = useState(true);

  // Notifications
  const [notifyViral, setNotifyViral] = useState(true);
  const [notifyCampaign, setNotifyCampaign] = useState(true);
  const [notifySupplier, setNotifySupplier] = useState(false);
  const [emailNotify, setEmailNotify] = useState("");

  const [apiKey] = useState("vc_" + "x".repeat(32));
  const [saving, setSaving] = useState(false);

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success("Chave API copiada!");
  };

  const saveSettings = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success("✅ Configurações salvas com sucesso!");
  };

  const handleThemeChange = (id: ThemeId) => {
    setTheme(id);
    applyTheme(id);
    toast.success(`🎨 Tema "${THEMES.find(t => t.id === id)?.label}" aplicado!`);
  };

  const handleLanguageChange = (id: LangId) => {
    setLanguage(id);
    const lang = LANGUAGES.find(l => l.id === id);
    toast.success(`${lang?.flag} Idioma alterado para ${lang?.nativeName}!`);
  };

  const handleCurrencyChange = (id: CurrencyId) => {
    setCurrency(id);
    const c = CURRENCIES.find(x => x.id === id);
    toast.success(`${c?.flag} Moeda alterada para ${c?.label} (${c?.symbol})!`);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-gray-400 text-sm mt-1">
            Personalize aparência, idioma, moeda e integrações
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Salvar Alterações
        </button>
      </div>

      {/* ── APARÊNCIA (SKIN/TEMA) ── */}
      <Section title="Aparência" description="Escolha o tema visual do sistema" icon={Paintbrush}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleThemeChange(t.id)}
              className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                theme === t.id
                  ? "border-sky-500 bg-sky-500/10"
                  : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
              }`}
            >
              {/* Preview dot */}
              <div
                className="w-8 h-8 rounded-lg flex-shrink-0 shadow-lg"
                style={{ backgroundColor: t.card, border: `2px solid ${t.accent}` }}
              >
                <div
                  className="w-full h-full rounded-md flex items-center justify-center"
                  style={{ backgroundColor: t.accent + "22" }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.accent }} />
                </div>
              </div>
              <span className="text-xs font-medium text-gray-200 text-left leading-tight">
                {t.label}
              </span>
              {theme === t.id && (
                <div className="absolute top-1.5 right-1.5">
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600">
          O tema é salvo automaticamente e aplicado em todas as páginas.
        </p>
      </Section>

      {/* ── IDIOMA ── */}
      <Section title="Idioma" description="Selecione o idioma da interface" icon={Languages}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              onClick={() => handleLanguageChange(l.id)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                language === l.id
                  ? "border-sky-500 bg-sky-500/10"
                  : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
              }`}
            >
              <span className="text-lg">{l.flag}</span>
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-200">{l.id.toUpperCase()}</p>
                <p className="text-xs text-gray-500 truncate">{l.nativeName}</p>
              </div>
              {language === l.id && (
                <Check className="w-3 h-3 text-sky-400 ml-auto flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <span className="text-yellow-400 text-sm">⚠️</span>
          <p className="text-xs text-yellow-300">
            Tradução completa em desenvolvimento. Interface principal já está em Português.
          </p>
        </div>
      </Section>

      {/* ── MOEDA ── */}
      <Section title="Moeda" description="Escolha a moeda para exibição de preços e margens" icon={DollarSign}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CURRENCIES.map((c) => (
            <button
              key={c.id}
              onClick={() => handleCurrencyChange(c.id)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                currency === c.id
                  ? "border-sky-500 bg-sky-500/10"
                  : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
              }`}
            >
              <span className="text-lg">{c.flag}</span>
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-200">{c.id}</p>
                <p className="text-xs text-gray-500">{c.symbol}</p>
              </div>
              {currency === c.id && (
                <Check className="w-3 h-3 text-sky-400 ml-auto flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600">
          Taxas de câmbio aproximadas em relação ao USD. Atualizadas diariamente.
        </p>
      </Section>

      {/* ── SUA API KEY ── */}
      <Section title="Sua Chave API" description="Use esta chave para acessar a API do ViralCommerce" icon={Shield}>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Chave API</label>
          <div className="flex gap-2">
            <input
              readOnly value={apiKey}
              className="flex-1 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-400 font-mono focus:outline-none"
            />
            <button
              onClick={copyApiKey}
              className="px-3 py-2.5 bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg text-gray-400 hover:text-gray-200 transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-1">Nunca compartilhe esta chave. Rotacione se comprometida.</p>
        </div>
      </Section>

      {/* ── CHAVES API ── */}
      <Section title="Integrações API" description="Conecte IA e plataformas de publicidade" icon={Key}>
        <Field label="Anthropic API Key" value={anthropicKey} type="password"
          placeholder="sk-ant-..." onChange={setAnthropicKey}
          hint="Para geração de copy de marketing e análise de produtos com IA" />
        <Field label="Meta Ads Token" value={metaToken} type="password"
          placeholder="EAA..." onChange={setMetaToken}
          hint="Campanhas no Facebook e Instagram Ads" />
        <Field label="Google Ads Token" value={googleToken} type="password"
          placeholder="ya29..." onChange={setGoogleToken}
          hint="Campanhas no Google Search e Display" />
        <Field label="TikTok Ads Token" value={tiktokToken} type="password"
          placeholder="..." onChange={setTiktokToken}
          hint="Campanhas no TikTok for Business" />
        <Field label="YouTube Data API Key" value={youtubeKey} type="password"
          placeholder="AIza..." onChange={setYoutubeKey}
          hint="Vídeos em alta e YouTube Shorts" />
      </Section>

      {/* ── RASTREADOR ── */}
      <Section title="Rastreador" description="Controle como e com que frequência as plataformas são rastreadas" icon={Globe}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Intervalo de Rastreamento TikTok (min)" value={crawlInterval}
            onChange={setCrawlInterval} placeholder="30" hint="Padrão: a cada 30 min" />
          <Field label="Máximo de Rastreadores Simultâneos" value={maxConcurrent}
            onChange={setMaxConcurrent} placeholder="5" hint="Limite de scrapers paralelos" />
        </div>
        <Field label="Limite de Score Viral" value={viralThreshold}
          onChange={setViralThreshold} placeholder="70"
          hint="Produtos acima deste score são marcados como virais (0–100)" />
        <Toggle label="Usar Rotação de Proxy"
          description="Roteie requisições por proxies residenciais para evitar bloqueios"
          enabled={useProxy} onChange={setUseProxy} />
        {useProxy && (
          <Field label="URL do Proxy" value={proxyUrl} onChange={setProxyUrl}
            placeholder="http://user:pass@proxy.example.com:8000" />
        )}
      </Section>

      {/* ── AUTOMAÇÃO DE CAMPANHAS ── */}
      <Section title="Automação de Campanhas" description="Regras para pausar e escalar anúncios automaticamente" icon={RefreshCw}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Limite de Corte (ROAS)" value={killRoas} onChange={setKillRoas}
            placeholder="0.8" hint="Pausa anúncios abaixo deste ROAS após $10 gasto" />
          <Field label="Limite de Escala (ROAS)" value={scaleRoas} onChange={setScaleRoas}
            placeholder="2.5" hint="Dobra orçamento para anúncios acima deste ROAS" />
          <Field label="Orçamento Inicial por Anúncio ($)" value={initialBudget}
            onChange={setInitialBudget} placeholder="5" hint="Orçamento diário por anúncio ao lançar" />
          <Field label="Variações de Anúncio por Lançamento" value={adCount}
            onChange={setAdCount} placeholder="10" hint="IA gera esta quantidade de manchetes" />
        </div>
        <Toggle label="Pausar campanhas com baixo desempenho automaticamente"
          description="Pausa campanhas inteiras com ROAS < 0.5 após 3 dias"
          enabled={autoPause} onChange={setAutoPause} />
      </Section>

      {/* ── NOTIFICAÇÕES ── */}
      <Section title="Notificações" description="Receba alertas quando eventos importantes acontecerem" icon={Bell}>
        <Field label="Email de Notificação" value={emailNotify}
          onChange={setEmailNotify} placeholder="voce@exemplo.com" />
        <div className="space-y-3 pt-1">
          <Toggle label="Produto viral detectado"
            description="Alerta quando um produto atinge o score viral definido"
            enabled={notifyViral} onChange={setNotifyViral} />
          <Toggle label="Alertas de performance de campanha"
            description="ROAS cai abaixo do limite de corte ou ultrapassa o de escala"
            enabled={notifyCampaign} onChange={setNotifyCampaign} />
          <Toggle label="Novo fornecedor encontrado"
            description="Quando um fornecedor com alta margem é descoberto para um produto rastreado"
            enabled={notifySupplier} onChange={setNotifySupplier} />
        </div>
      </Section>

      {/* ── ZONA DE PERIGO ── */}
      <div className="bg-gray-900 border border-red-900/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-red-900/30">
          <h2 className="text-sm font-semibold text-red-400">Zona de Perigo</h2>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-200">Limpar histórico do rastreador</p>
              <p className="text-xs text-gray-500">Apaga todos os registros de jobs (mantém produtos)</p>
            </div>
            <button className="px-4 py-2 border border-red-800 hover:bg-red-900/20 text-red-400 rounded-lg text-sm transition-colors">
              Limpar Histórico
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-200">Recalcular scores virais</p>
              <p className="text-xs text-gray-500">Recomputa todos os scores a partir dos dados brutos</p>
            </div>
            <button className="px-4 py-2 border border-red-800 hover:bg-red-900/20 text-red-400 rounded-lg text-sm transition-colors">
              Recalcular Scores
            </button>
          </div>
        </div>
      </div>

      {/* ── BOTÃO SALVAR (inferior) ── */}
      <div className="flex justify-end pt-2">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Salvar Todas as Configurações
        </button>
      </div>
    </div>
  );
}
