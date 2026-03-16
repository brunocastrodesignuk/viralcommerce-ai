"use client";

import { useState } from "react";
import {
  Key, Globe, Bell, Shield, ChevronRight,
  Eye, EyeOff, Check, Copy, RefreshCw, Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

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
          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-colors"
        />
        {isPassword && (
          <button
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
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
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled ? "bg-brand-500" : "bg-gray-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
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

  // API Key display
  const [apiKey] = useState("vc_" + "x".repeat(32));
  const [saving, setSaving] = useState(false);

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success("API key copied!");
  };

  const saveSettings = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success("Settings saved!");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 text-sm mt-1">
            Configure API keys, crawler behavior, and campaign rules
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>

      {/* Your API Key */}
      <Section title="Your API Key" description="Use this key to access the ViralCommerce API" icon={Shield}>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">API Key</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={apiKey}
              className="flex-1 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-400 font-mono focus:outline-none"
            />
            <button
              onClick={copyApiKey}
              className="px-3 py-2.5 bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg text-gray-400 hover:text-gray-200 transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-1">Never share this key. Rotate it if compromised.</p>
        </div>
      </Section>

      {/* AI & Ad Network Keys */}
      <Section title="API Keys" description="Connect AI and advertising platforms" icon={Key}>
        <Field
          label="Anthropic API Key"
          value={anthropicKey}
          type="password"
          placeholder="sk-ant-..."
          onChange={setAnthropicKey}
          hint="Used for AI content generation and product analysis"
        />
        <Field
          label="Meta Ads Token"
          value={metaToken}
          type="password"
          placeholder="EAA..."
          onChange={setMetaToken}
          hint="Facebook & Instagram ad campaigns"
        />
        <Field
          label="Google Ads Token"
          value={googleToken}
          type="password"
          placeholder="ya29..."
          onChange={setGoogleToken}
          hint="Google Search and Display campaigns"
        />
        <Field
          label="TikTok Ads Token"
          value={tiktokToken}
          type="password"
          placeholder="..."
          onChange={setTiktokToken}
          hint="TikTok for Business campaigns"
        />
        <Field
          label="YouTube Data API Key"
          value={youtubeKey}
          type="password"
          placeholder="AIza..."
          onChange={setYoutubeKey}
          hint="YouTube trending videos and Shorts"
        />
      </Section>

      {/* Crawler Settings */}
      <Section title="Crawler" description="Control how and how often platforms are scraped" icon={Globe}>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="TikTok Crawl Interval (minutes)"
            value={crawlInterval}
            onChange={setCrawlInterval}
            placeholder="30"
            hint="Default: every 30 min"
          />
          <Field
            label="Max Concurrent Crawlers"
            value={maxConcurrent}
            onChange={setMaxConcurrent}
            placeholder="5"
            hint="Limit parallel scrapers"
          />
        </div>
        <Field
          label="Viral Score Threshold"
          value={viralThreshold}
          onChange={setViralThreshold}
          placeholder="70"
          hint="Products above this score are flagged as viral (0–100)"
        />
        <Toggle
          label="Use Proxy Rotation"
          description="Route requests through residential proxies to avoid blocks"
          enabled={useProxy}
          onChange={setUseProxy}
        />
        {useProxy && (
          <Field
            label="Proxy URL"
            value={proxyUrl}
            onChange={setProxyUrl}
            placeholder="http://user:pass@proxy.example.com:8000"
          />
        )}
      </Section>

      {/* Campaign Automation */}
      <Section title="Campaign Automation" description="Rules for killing and scaling ads automatically" icon={RefreshCw}>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Kill Threshold (ROAS)"
            value={killRoas}
            onChange={setKillRoas}
            placeholder="0.8"
            hint="Pause ads below this ROAS after $10 spend"
          />
          <Field
            label="Scale Threshold (ROAS)"
            value={scaleRoas}
            onChange={setScaleRoas}
            placeholder="2.5"
            hint="Double budget for ads above this ROAS"
          />
          <Field
            label="Initial Ad Budget ($)"
            value={initialBudget}
            onChange={setInitialBudget}
            placeholder="5"
            hint="Daily budget per ad on launch"
          />
          <Field
            label="Ad Variations per Launch"
            value={adCount}
            onChange={setAdCount}
            placeholder="10"
            hint="AI generates this many headlines"
          />
        </div>
        <Toggle
          label="Auto-pause underperforming campaigns"
          description="Automatically pause entire campaigns with ROAS < 0.5 after 3 days"
          enabled={autoPause}
          onChange={setAutoPause}
        />
      </Section>

      {/* Notifications */}
      <Section title="Notifications" description="Get alerted when important events happen" icon={Bell}>
        <Field
          label="Notification Email"
          value={emailNotify}
          onChange={setEmailNotify}
          placeholder="you@example.com"
        />
        <div className="space-y-3 pt-1">
          <Toggle
            label="Viral product detected"
            description="Alert when a product hits the viral score threshold"
            enabled={notifyViral}
            onChange={setNotifyViral}
          />
          <Toggle
            label="Campaign performance alerts"
            description="ROAS drops below kill threshold or exceeds scale threshold"
            enabled={notifyCampaign}
            onChange={setNotifyCampaign}
          />
          <Toggle
            label="New supplier found"
            description="When a high-margin supplier is discovered for a tracked product"
            enabled={notifySupplier}
            onChange={setNotifySupplier}
          />
        </div>
      </Section>

      {/* Danger Zone */}
      <div className="bg-gray-900 border border-red-900/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-red-900/30">
          <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-200">Clear crawler history</p>
              <p className="text-xs text-gray-500">Delete all crawl job records (keeps products)</p>
            </div>
            <button className="px-4 py-2 border border-red-800 hover:bg-red-900/20 text-red-400 rounded-lg text-sm transition-colors">
              Clear History
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-200">Reset viral scores</p>
              <p className="text-xs text-gray-500">Recompute all scores from raw data</p>
            </div>
            <button className="px-4 py-2 border border-red-800 hover:bg-red-900/20 text-red-400 rounded-lg text-sm transition-colors">
              Reset Scores
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Save */}
      <div className="flex justify-end pt-2">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save All Settings
        </button>
      </div>
    </div>
  );
}
