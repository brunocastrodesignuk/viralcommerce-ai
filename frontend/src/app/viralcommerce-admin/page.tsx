"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, Shield, Mail, TrendingUp, Package, Crown,
  Zap, Building2, CheckCircle, XCircle, RefreshCw,
  Send, Eye, AlertTriangle, Lock, LogOut, Flame, Copy, Gift,
} from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

// ─── Helpers ────────────────────────────────────────────────────────────────

const SESSION_KEY = "vc_admin_key";

const PLAN_BADGE: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  free:       { label: "Gratuito",    color: "text-gray-400 bg-gray-400/10",     icon: <Zap className="w-3 h-3" /> },
  pro:        { label: "Pro",         color: "text-sky-400 bg-sky-400/10",       icon: <Crown className="w-3 h-3" /> },
  enterprise: { label: "Empresarial", color: "text-purple-400 bg-purple-400/10", icon: <Building2 className="w-3 h-3" /> },
};

function PlanBadge({ plan }: { plan: string }) {
  const b = PLAN_BADGE[plan] ?? PLAN_BADGE.free;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${b.color}`}>
      {b.icon} {b.label}
    </span>
  );
}

// ─── Password Gate ───────────────────────────────────────────────────────────

function PasswordGate({ onAuthenticated }: { onAuthenticated: (key: string) => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    try {
      await api.get("/admin/stats", { headers: { "X-Admin-Key": password } });
      // Success — store key and grant access
      sessionStorage.setItem(SESSION_KEY, password);
      onAuthenticated(password);
    } catch (err: any) {
      if (err?.response?.status === 403 || err?.response?.status === 401) {
        setError("Senha incorreta. Acesso negado.");
      } else {
        setError("Erro ao conectar com o servidor. Verifique se o backend está rodando.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-white leading-none">ViralCommerce</p>
            <p className="text-xs text-sky-400 leading-none mt-0.5">Painel Administrativo</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Acesso Restrito</h1>
              <p className="text-xs text-gray-500">Somente o administrador pode entrar</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">Senha de Administrador</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Digite a senha..."
                autoFocus
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/5 border border-red-400/20 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Verificando...</>
              ) : (
                <><Shield className="w-4 h-4" /> Entrar</>
              )}
            </button>
          </form>

          <p className="text-xs text-gray-600 text-center mt-4">
            A senha é definida via <code className="text-gray-500">ADMIN_SECRET_KEY</code> no .env
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Panel ─────────────────────────────────────────────────────────────

function AdminPanel({ adminKey, onLogout }: { adminKey: string; onLogout: () => void }) {
  const queryClient = useQueryClient();
  const [planFilter, setPlanFilter]         = useState<string>("");
  const [emailSubject, setEmailSubject]     = useState("🔥 Novidades do ViralCommerce AI");
  const [emailBody, setEmailBody]           = useState(
    `<h1>Olá!</h1>\n<p>Temos novidades incríveis para você no ViralCommerce AI.</p>\n<p>Acesse agora e descubra os produtos mais virais do momento!</p>\n<a href="https://app.viralcommerce.ai">Acessar Plataforma →</a>`
  );
  const [emailPlanFilter, setEmailPlanFilter] = useState<string>("");

  const headers = { "X-Admin-Key": adminKey };

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats", adminKey],
    queryFn: () => api.get("/admin/stats", { headers }).then(r => r.data),
    retry: false,
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users", adminKey, planFilter],
    queryFn: () =>
      api.get("/admin/users", {
        headers,
        params: planFilter ? { plan: planFilter } : {},
      }).then(r => r.data),
    retry: false,
  });

  const changePlan = useMutation({
    mutationFn: ({ userId, plan }: { userId: string; plan: string }) =>
      api.patch(`/admin/users/${userId}/plan`, { plan }, { headers }).then(r => r.data),
    onSuccess: (data) => {
      toast.success(`✅ Plano atualizado: ${data.email} → ${data.plan}`);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: () => toast.error("Erro ao atualizar plano"),
  });

  const toggleActive = useMutation({
    mutationFn: ({ userId, is_active }: { userId: string; is_active: boolean }) =>
      api.patch(`/admin/users/${userId}/active`, { is_active }, { headers }).then(r => r.data),
    onSuccess: (data) => {
      toast.success(`${data.is_active ? "✅ Ativado" : "🚫 Desativado"}: ${data.email}`);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Erro ao alterar status"),
  });

  const sendEmail = useMutation({
    mutationFn: ({ preview_only }: { preview_only: boolean }) =>
      api.post("/admin/send-email-blast", {
        subject: emailSubject,
        body_html: emailBody,
        plan_filter: emailPlanFilter || null,
        preview_only,
      }, { headers }).then(r => r.data),
    onSuccess: (data, vars) => {
      if (vars.preview_only) {
        toast.success(`👀 Preview: ${data.recipients} destinatários\n${(data.preview_emails || []).join(", ")}`);
      } else {
        toast.success(`📧 Email enviado para ${data.sent} usuários!`);
      }
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? "Erro ao enviar emails"),
  });

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
              <p className="text-gray-400 text-sm mt-0.5">ViralCommerce AI — Gestão de usuários, planos e comunicações</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
                queryClient.invalidateQueries({ queryKey: ["admin-users"] });
              }}
              className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-red-400 hover:bg-red-400/5 rounded-lg text-sm transition-colors border border-gray-800"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>

        {/* Stats */}
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total Usuários",  value: stats.total_users,                    color: "text-white",        icon: <Users className="w-4 h-4" /> },
              { label: "Novos (7 dias)",  value: stats.new_users_7d,                   color: "text-green-400",    icon: <TrendingUp className="w-4 h-4" /> },
              { label: "Plano Pro",       value: stats.users_by_plan?.pro ?? 0,        color: "text-sky-400",      icon: <Crown className="w-4 h-4" /> },
              { label: "Empresarial",     value: stats.users_by_plan?.enterprise ?? 0, color: "text-purple-400",   icon: <Building2 className="w-4 h-4" /> },
              { label: "Produtos Virais", value: stats.viral_products,                 color: "text-red-400",      icon: <Package className="w-4 h-4" /> },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 text-gray-500">{s.icon}<p className="text-xs">{s.label}</p></div>
                <p className={`text-2xl font-bold ${s.color}`}>{(s.value ?? 0).toLocaleString("pt-BR")}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users Table */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Usuários
                {users && <span className="text-xs text-gray-600 ml-1">({users.total})</span>}
              </h2>
              <select
                value={planFilter}
                onChange={e => setPlanFilter(e.target.value)}
                className="px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-400 focus:outline-none"
              >
                <option value="">Todos os planos</option>
                <option value="free">Gratuito</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Empresarial</option>
              </select>
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="w-5 h-5 text-sky-500 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-600 border-b border-gray-800">
                      <th className="text-left py-3 px-4">Usuário</th>
                      <th className="text-left py-3 px-4">Plano</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Cadastro</th>
                      <th className="text-left py-3 px-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(users?.items ?? []).map((user: any) => (
                      <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <p className="text-gray-200 font-medium text-xs">{user.full_name || "—"}</p>
                          <p className="text-gray-500 text-xs truncate max-w-40">{user.email}</p>
                        </td>
                        <td className="py-3 px-4">
                          <PlanBadge plan={user.plan} />
                        </td>
                        <td className="py-3 px-4">
                          {user.is_active ? (
                            <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle className="w-3 h-3" />Ativo</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="w-3 h-3" />Inativo</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-xs">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : "—"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={user.plan}
                              onChange={e => changePlan.mutate({ userId: user.id, plan: e.target.value })}
                              className="px-1.5 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-400 focus:outline-none focus:border-sky-500"
                            >
                              <option value="free">Gratuito</option>
                              <option value="pro">Pro</option>
                              <option value="enterprise">Enterprise</option>
                            </select>
                            <button
                              onClick={() => toggleActive.mutate({ userId: user.id, is_active: !user.is_active })}
                              className={`p-1 rounded text-xs transition-colors ${user.is_active ? "text-red-400 hover:bg-red-400/10" : "text-green-400 hover:bg-green-400/10"}`}
                              title={user.is_active ? "Desativar" : "Ativar"}
                            >
                              {user.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(users?.items ?? []).length === 0 && (
                  <div className="flex items-center justify-center h-20 text-gray-600 text-sm">
                    Nenhum usuário encontrado
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Email Blast Panel */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Enviar Email em Massa
            </h2>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Filtrar por plano</label>
              <select
                value={emailPlanFilter}
                onChange={e => setEmailPlanFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-sky-500"
              >
                <option value="">Todos os usuários</option>
                <option value="free">Somente Gratuito</option>
                <option value="pro">Somente Pro</option>
                <option value="enterprise">Somente Empresarial</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Assunto</label>
              <input
                type="text"
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Corpo do Email (HTML)</label>
              <textarea
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 font-mono focus:outline-none focus:border-sky-500 resize-y"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => sendEmail.mutate({ preview_only: true })}
                disabled={sendEmail.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={() => {
                  if (!confirm(`Enviar para ${emailPlanFilter || "TODOS"} os usuários?`)) return;
                  sendEmail.mutate({ preview_only: false });
                }}
                disabled={sendEmail.isPending || !emailSubject || !emailBody}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Send className="w-4 h-4" />
                Enviar
              </button>
            </div>

            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <p className="text-xs text-amber-400 font-semibold mb-1">⚠️ Configure SMTP no .env</p>
              <p className="text-xs text-gray-500">SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM</p>
            </div>
          </div>
        </div>

        {/* Coupon Generator */}
        <CouponGenerator />
      </div>
    </div>
  );
}

// ─── Coupon Generator ─────────────────────────────────────────────────────────

function CouponGenerator() {
  const PRESETS = [
    { label: "10% OFF", discount: 10, prefix: "VIRAL10" },
    { label: "20% OFF", discount: 20, prefix: "VIRAL20" },
    { label: "30% OFF", discount: 30, prefix: "VIRAL30" },
    { label: "Lançamento 50%", discount: 50, prefix: "LAUNCH50" },
    { label: "Black Friday", discount: 40, prefix: "BLACK40" },
  ];

  const [discount, setDiscount] = useState(20);
  const [prefix, setPrefix] = useState("VIRAL");
  const [generated, setGenerated] = useState<{ code: string; discount: number; expires: string }[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const generate = () => {
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    const code = `${prefix}${discount}-${rand}`;
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR");
    setGenerated(prev => [{ code, discount, expires }, ...prev].slice(0, 20));
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    toast.success(`Cupom ${code} copiado!`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
        <Gift className="w-4 h-4 text-purple-400" />
        Gerador de Cupons de Desconto
      </h2>

      {/* Presets */}
      <div>
        <label className="text-xs text-gray-500 block mb-2">Presets rápidos</label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => { setDiscount(p.discount); setPrefix(p.prefix.replace(/\d+$/, "")); }}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs text-gray-300 rounded-lg transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Prefixo</label>
          <input
            value={prefix}
            onChange={e => setPrefix(e.target.value.toUpperCase().replace(/\s/g, ""))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 font-mono focus:outline-none focus:border-purple-500"
            placeholder="VIRAL"
            maxLength={12}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">
            Desconto: <span className="text-purple-400 font-bold">{discount}%</span>
          </label>
          <input
            type="range" min={5} max={70} step={5}
            value={discount} onChange={e => setDiscount(Number(e.target.value))}
            className="w-full mt-1.5 accent-purple-500"
          />
        </div>
      </div>

      <button
        onClick={generate}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold transition-colors"
      >
        <Gift className="w-4 h-4" />
        Gerar Cupom — {discount}% OFF
      </button>

      {/* Generated codes */}
      {generated.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Cupons gerados (sesssão atual)</p>
          <div className="max-h-48 overflow-y-auto space-y-1.5">
            {generated.map((c, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 bg-gray-800 rounded-lg">
                <span className="text-sm font-mono font-bold text-purple-400 flex-1">{c.code}</span>
                <span className="text-xs text-gray-500">{c.discount}% OFF</span>
                <span className="text-xs text-gray-600">válido até {c.expires}</span>
                <button
                  onClick={() => copyCode(c.code)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    copied === c.code
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-400"
                  }`}
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600">
            ⚠️ Adicione estes cupons manualmente no Stripe ou Mercado Pago para ativá-los.
            Os cupons acima são apenas referências visuais — configure no painel de pagamentos.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Page Entry Point ────────────────────────────────────────────────────────

export default function SecretAdminPage() {
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // On mount, try to restore session
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      // Verify the saved key is still valid
      api.get("/admin/stats", { headers: { "X-Admin-Key": saved } })
        .then(() => setAdminKey(saved))
        .catch(() => sessionStorage.removeItem(SESSION_KEY))
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setAdminKey(null);
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-sky-500 animate-spin" />
      </div>
    );
  }

  if (!adminKey) {
    return <PasswordGate onAuthenticated={setAdminKey} />;
  }

  return <AdminPanel adminKey={adminKey} onLogout={handleLogout} />;
}
