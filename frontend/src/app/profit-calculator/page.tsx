"use client";

import { useState, useCallback } from "react";
import {
  DollarSign, TrendingUp, Package, Truck, Zap, Target,
  BarChart3, AlertCircle, CheckCircle2, Calculator, RefreshCw,
  ShoppingCart, Percent, ArrowRight,
} from "lucide-react";
import { usePreferences, convertPrice } from "@/store/preferences";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Scenario {
  name: string;
  color: string;
  adsRoas: number;   // ROAS (Return on Ad Spend)
  convRate: number;  // conversion rate %
  volume: number;    // units per month
}

interface CalcResult {
  revenue: number;
  grossProfit: number;
  netProfit: number;
  margin: number;
  roi: number;
  breakEven: number;
  breakEvenUnits: number;
  cpa: number;
  ltv: number;
  verdict: "kill" | "test" | "scale" | "winner";
}

// ─── Constants ───────────────────────────────────────────────────────────────
const SCENARIOS: Scenario[] = [
  { name: "Conservador", color: "text-amber-400",  adsRoas: 1.5, convRate: 1.0, volume: 30 },
  { name: "Realista",    color: "text-sky-400",    adsRoas: 2.5, convRate: 2.0, volume: 80 },
  { name: "Otimista",    color: "text-green-400",  adsRoas: 4.0, convRate: 3.5, volume: 200 },
];

const SHOPIFY_RATES: Record<string, number> = {
  basic: 0.02,
  pro: 0.01,
  advanced: 0.005,
};

// ─── Calculator ──────────────────────────────────────────────────────────────
function calculate(
  productCost: number,
  shipping: number,
  salePrice: number,
  adsBudgetPerDay: number,
  shopifyFee: number,
  returnsRate: number,
  scenario: Scenario
): CalcResult {
  const totalCost = productCost + shipping;
  const shopifyFeeAmt = salePrice * shopifyFee;
  const processingFee = salePrice * 0.029 + 0.30; // Stripe/PayPal
  const adsCostPerUnit = adsBudgetPerDay / (scenario.convRate / 100 * scenario.volume / 30);
  const returnsCost = (returnsRate / 100) * salePrice;

  const totalCostPerUnit = totalCost + shopifyFeeAmt + processingFee + adsCostPerUnit + returnsCost;
  const grossProfit = salePrice - totalCost - shopifyFeeAmt - processingFee;
  const netProfit = salePrice - totalCostPerUnit;
  const margin = (netProfit / salePrice) * 100;
  const roi = (netProfit / totalCostPerUnit) * 100;

  const monthlyRevenue = salePrice * scenario.volume;
  const monthlyNet = netProfit * scenario.volume;
  const breakEven = adsBudgetPerDay * 30 / (netProfit > 0 ? netProfit : 1);
  const cpa = adsBudgetPerDay / (scenario.volume / 30 * scenario.convRate / 100 || 1) * (scenario.convRate / 100);
  const ltv = salePrice * 2.3; // avg repeat purchase assumption

  let verdict: "kill" | "test" | "scale" | "winner" = "kill";
  if (margin >= 50 && roi >= 100) verdict = "winner";
  else if (margin >= 35 && roi >= 50) verdict = "scale";
  else if (margin >= 20 && roi >= 20) verdict = "test";

  return {
    revenue: monthlyRevenue,
    grossProfit,
    netProfit: monthlyNet,
    margin,
    roi,
    breakEven,
    breakEvenUnits: Math.ceil(breakEven),
    cpa,
    ltv,
    verdict,
  };
}

// ─── Components ──────────────────────────────────────────────────────────────
function InputField({
  label, value, onChange, prefix, suffix, hint, min = 0, step = 0.01,
}: {
  label: string; value: number; onChange: (v: number) => void;
  prefix?: string; suffix?: string; hint?: string; min?: number; step?: number;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-400 font-medium">{label}</label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-gray-500 text-sm select-none">{prefix}</span>
        )}
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`w-full bg-gray-800 border border-gray-700 rounded-lg py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors ${
            prefix ? "pl-7" : "pl-3"
          } ${suffix ? "pr-12" : "pr-3"}`}
        />
        {suffix && (
          <span className="absolute right-3 text-gray-500 text-sm select-none">{suffix}</span>
        )}
      </div>
      {hint && <p className="text-xs text-gray-600">{hint}</p>}
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: CalcResult["verdict"] }) {
  const config = {
    kill:   { label: "❌ Matar — Não Escalar",     bg: "bg-red-500/10",    border: "border-red-500/30",    text: "text-red-400" },
    test:   { label: "🧪 Testar — Budget Baixo",   bg: "bg-amber-500/10",  border: "border-amber-500/30",  text: "text-amber-400" },
    scale:  { label: "📈 Escalar — Bom Produto",   bg: "bg-sky-500/10",    border: "border-sky-500/30",    text: "text-sky-400" },
    winner: { label: "🏆 WINNER — Escala Máxima",  bg: "bg-green-500/10",  border: "border-green-500/30",  text: "text-green-400" },
  };
  const c = config[verdict];
  return (
    <div className={`px-4 py-2 rounded-lg border text-sm font-semibold ${c.bg} ${c.border} ${c.text}`}>
      {c.label}
    </div>
  );
}

function MetricRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="text-right">
        <span className="text-sm font-semibold text-white">{value}</span>
        {sub && <p className="text-xs text-gray-600">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ProfitCalculatorPage() {
  const { currency } = usePreferences();
  const fmt = (n: number) => convertPrice(n, currency);

  // Inputs
  const [productCost, setProductCost] = useState(8.50);
  const [shipping, setShipping] = useState(3.20);
  const [salePrice, setSalePrice] = useState(29.99);
  const [adsBudgetPerDay, setAdsBudgetPerDay] = useState(20);
  const [shopifyPlan, setShopifyPlan] = useState<keyof typeof SHOPIFY_RATES>("pro");
  const [returnsRate, setReturnsRate] = useState(3);
  const [productName, setProductName] = useState("");

  const shopifyFee = SHOPIFY_RATES[shopifyPlan];

  const results = SCENARIOS.map((s) =>
    calculate(productCost, shipping, salePrice, adsBudgetPerDay, shopifyFee, returnsRate, s)
  );

  const realisticResult = results[1]; // index 1 = Realista

  // Quick margin preview
  const quickMargin = salePrice > 0
    ? (((salePrice - productCost - shipping) / salePrice) * 100).toFixed(1)
    : "0.0";
  const quickProfit = salePrice - productCost - shipping;

  const handleReset = useCallback(() => {
    setProductCost(8.50);
    setShipping(3.20);
    setSalePrice(29.99);
    setAdsBudgetPerDay(20);
    setShopifyPlan("pro");
    setReturnsRate(3);
    setProductName("");
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calculator className="w-6 h-6 text-brand-400" />
            Profit Calculator
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Calcule ROI real antes de vender — custo, margem, break-even e meta
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Quick Margin Banner */}
      <div className={`card border ${
        parseFloat(quickMargin) >= 50
          ? "border-green-500/30 bg-green-500/5"
          : parseFloat(quickMargin) >= 30
            ? "border-amber-500/30 bg-amber-500/5"
            : "border-red-500/30 bg-red-500/5"
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Margem Bruta (sem anúncios)</p>
            <p className={`text-3xl font-bold ${
              parseFloat(quickMargin) >= 50 ? "text-green-400" :
              parseFloat(quickMargin) >= 30 ? "text-amber-400" : "text-red-400"
            }`}>
              {quickMargin}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Lucro Bruto / unidade</p>
            <p className="text-2xl font-bold text-white">{fmt(quickProfit)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Preço de Venda</p>
            <p className="text-2xl font-bold text-white">{fmt(salePrice)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Regra de Ouro</p>
            <p className="text-sm text-gray-300">Margem ideal: <span className="text-green-400 font-semibold">≥ 50%</span></p>
            <p className="text-sm text-gray-300">Markup mínimo: <span className="text-sky-400 font-semibold">3× custo</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Inputs ── */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-400" />
              Produto
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-medium">Nome do Produto (opcional)</label>
                <input
                  type="text"
                  placeholder="ex: Massageador Elétrico Pro"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
                />
              </div>
              <InputField
                label="Custo do Produto (AliExpress/Fornecedor)"
                value={productCost}
                onChange={setProductCost}
                prefix="£"
                hint="Custo unitário do fornecedor"
              />
              <InputField
                label="Frete / Envio"
                value={shipping}
                onChange={setShipping}
                prefix="£"
                hint="ePacket, YunExpress, ou frete nacional"
              />
              <InputField
                label="Preço de Venda"
                value={salePrice}
                onChange={setSalePrice}
                prefix="£"
                hint={`Markup sugerido: ${fmt(productCost * 3)} – ${fmt(productCost * 4.5)}`}
              />
            </div>
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Anúncios & Taxas
            </h2>
            <div className="space-y-4">
              <InputField
                label="Budget de Anúncios por Dia"
                value={adsBudgetPerDay}
                onChange={setAdsBudgetPerDay}
                prefix="£"
                hint="Meta Ads, TikTok Ads, Google Ads"
              />
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Plano Shopify</label>
                <select
                  value={shopifyPlan}
                  onChange={(e) => setShopifyPlan(e.target.value as keyof typeof SHOPIFY_RATES)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="basic">Basic (2% taxa)</option>
                  <option value="pro">Pro (1% taxa)</option>
                  <option value="advanced">Advanced (0.5% taxa)</option>
                </select>
              </div>
              <InputField
                label="Taxa de Devoluções"
                value={returnsRate}
                onChange={setReturnsRate}
                suffix="%"
                hint="Média ecommerce: 3–8%"
                step={0.5}
              />
            </div>
          </div>
        </div>

        {/* ── Results ── */}
        <div className="space-y-4">
          {/* Realistic Scenario Summary */}
          <div className="card border border-sky-500/20 bg-sky-500/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Target className="w-4 h-4 text-sky-400" />
                Resultado Realista
              </h2>
              <VerdictBadge verdict={realisticResult.verdict} />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-800/60 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Margem Líquida</p>
                <p className={`text-2xl font-bold ${
                  realisticResult.margin >= 30 ? "text-green-400" :
                  realisticResult.margin >= 15 ? "text-amber-400" : "text-red-400"
                }`}>
                  {realisticResult.margin.toFixed(1)}%
                </p>
              </div>
              <div className="bg-gray-800/60 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">ROI</p>
                <p className={`text-2xl font-bold ${
                  realisticResult.roi >= 100 ? "text-green-400" :
                  realisticResult.roi >= 50 ? "text-amber-400" : "text-red-400"
                }`}>
                  {realisticResult.roi.toFixed(0)}%
                </p>
              </div>
              <div className="bg-gray-800/60 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Lucro Mensal</p>
                <p className="text-xl font-bold text-white">
                  {fmt(realisticResult.netProfit)}
                </p>
              </div>
              <div className="bg-gray-800/60 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Break-even</p>
                <p className="text-xl font-bold text-white">
                  {realisticResult.breakEvenUnits} und.
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <MetricRow label="Receita Mensal" value={fmt(realisticResult.revenue)} />
              <MetricRow label="Lucro por Unidade" value={fmt(realisticResult.netProfit / SCENARIOS[1].volume)} />
              <MetricRow label="CPA (Custo por Aquisição)" value={fmt(realisticResult.cpa)} />
              <MetricRow label="LTV Estimado" value={fmt(realisticResult.ltv)} sub="2.3× repetição média" />
              <MetricRow label="Receita p/ Break-even" value={fmt(adsBudgetPerDay * 30)} />
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              Breakdown de Custos / unidade
            </h2>
            {[
              { label: "Produto (fornecedor)", value: productCost, color: "bg-sky-500" },
              { label: "Frete / envio", value: shipping, color: "bg-purple-500" },
              { label: "Taxa Shopify + Pagamento", value: salePrice * shopifyFee + salePrice * 0.029 + 0.30, color: "bg-amber-500" },
              { label: "Devoluções (média)", value: (returnsRate / 100) * salePrice, color: "bg-red-500" },
              { label: "Anúncios (estimado)", value: realisticResult.cpa, color: "bg-pink-500" },
            ].map((item) => {
              const pct = salePrice > 0 ? (item.value / salePrice) * 100 : 0;
              return (
                <div key={item.label} className="mb-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{item.label}</span>
                    <span>{fmt(item.value)} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 3-Scenario Comparison ── */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-400" />
          Simulador de Cenários
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SCENARIOS.map((scenario, i) => {
            const r = results[i];
            return (
              <div
                key={scenario.name}
                className={`rounded-xl border p-4 ${
                  i === 1
                    ? "border-sky-500/30 bg-sky-500/5"
                    : "border-gray-700/50 bg-gray-800/30"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-semibold text-sm ${scenario.color}`}>
                    {scenario.name}
                  </h3>
                  <VerdictBadge verdict={r.verdict} />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">ROAS</span>
                    <span className="text-white font-medium">{scenario.adsRoas}×</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Conv. Rate</span>
                    <span className="text-white font-medium">{scenario.convRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Volume/mês</span>
                    <span className="text-white font-medium">{scenario.volume} und.</span>
                  </div>
                  <hr className="border-gray-700 my-2" />
                  <div className="flex justify-between">
                    <span className="text-gray-500">Receita</span>
                    <span className={`font-semibold ${scenario.color}`}>{fmt(r.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Lucro Líquido</span>
                    <span className={`font-semibold ${r.netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {fmt(r.netProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Margem</span>
                    <span className={`font-semibold ${
                      r.margin >= 30 ? "text-green-400" :
                      r.margin >= 15 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {r.margin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">ROI</span>
                    <span className={`font-semibold ${
                      r.roi >= 100 ? "text-green-400" :
                      r.roi >= 50 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {r.roi.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── £100 → £1M Growth Path ── */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-green-400" />
          Seu Caminho £100 → £1,000,000
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { phase: "Fase 1", range: "£100 → £500",    metric: `Budget: £${adsBudgetPerDay}/dia`,   note: "Validar produto", color: "border-amber-500/30 bg-amber-500/5 text-amber-400" },
            { phase: "Fase 2", range: "£500 → £5k",     metric: `${fmt(realisticResult.revenue)}/mês`, note: "Escalar winners", color: "border-sky-500/30 bg-sky-500/5 text-sky-400" },
            { phase: "Fase 3", range: "£5k → £50k",     metric: `ROI ${realisticResult.roi.toFixed(0)}%`, note: "Automatizar", color: "border-purple-500/30 bg-purple-500/5 text-purple-400" },
            { phase: "Fase 4", range: "£50k → £1M",     metric: `LTV ${fmt(realisticResult.ltv)}`,   note: "Multi-store", color: "border-green-500/30 bg-green-500/5 text-green-400" },
          ].map((p) => (
            <div key={p.phase} className={`rounded-lg border p-3 ${p.color.split(" ").slice(0, 2).join(" ")}`}>
              <p className={`text-xs font-bold mb-1 ${p.color.split(" ")[2]}`}>{p.phase}</p>
              <p className="text-sm font-semibold text-white">{p.range}</p>
              <p className="text-xs text-gray-400 mt-1">{p.metric}</p>
              <p className="text-xs text-gray-600 mt-0.5">{p.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="card bg-gray-800/30 border border-gray-700/50">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          Regras de Ouro para Lucro Máximo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
          {[
            "Margem bruta mínima de 50% antes de anunciar",
            "Preço de venda = 3-4× custo do produto + frete",
            "Budget inicial: £20/dia por 3 dias antes de decidir",
            "Matar anúncio se ROAS < 0.8 após £10 gasto",
            "Escalar apenas se ROAS > 2.5 por 3 dias consecutivos",
            "LTV define quanto você pode gastar em CPA",
            "Taxa de devoluções > 10% = problema de produto",
            "Break-even de anúncios deve ser atingido em < 7 dias",
          ].map((tip) => (
            <div key={tip} className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
