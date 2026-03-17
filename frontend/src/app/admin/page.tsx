"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, Shield, Mail, TrendingUp, Package, Crown,
  Zap, Building2, CheckCircle, XCircle, RefreshCw,
  Send, Eye, ChevronDown, AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

const PLAN_BADGE: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  free:       { label: "Gratuito",    color: "text-gray-400 bg-gray-400/10",    icon: <Zap className="w-3 h-3" /> },
  pro:        { label: "Pro",         color: "text-sky-400 bg-sky-400/10",      icon: <Crown className="w-3 h-3" /> },
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

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [adminKey, setAdminKey] = useState("admin-change-me-in-production");
  const [planFilter, setPlanFilter] = useState<string>("");

  // Email blast state
  const [emailSubject, setEmailSubject] = useState("🔥 Novidades do ViralCommerce AI");
  const [emailBody, setEmailBody] = useState(
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

  const isUnauthorized = !statsLoading && !stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
            <p className="text-gray-400 text-sm mt-0.5">Gestão de usuários, planos e comunicações</p>
          </div>
        </div>
        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
          }}
          className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Admin Key Input */}
      <div className="card">
        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">Chave de Administrador (X-Admin-Key)</label>
            <input
              type="password"
              value={adminKey}
              onChange={e => setAdminKey(e.target.value)}
              className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-amber-500"
              placeholder="admin-change-me-in-production"
            />
          </div>
          {isUnauthorized && (
            <div className="flex items-center gap-1.5 text-red-400 text-xs">
              <AlertTriangle className="w-4 h-4" />
              Chave inválida
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Usuários",    value: stats.total_users,    color: "text-white",        icon: <Users className="w-4 h-4" /> },
            { label: "Novos (7 dias)",    value: stats.new_users_7d,   color: "text-green-400",    icon: <TrendingUp className="w-4 h-4" /> },
            { label: "Plano Pro",         value: stats.users_by_plan?.pro ?? 0,         color: "text-sky-400",    icon: <Crown className="w-4 h-4" /> },
            { label: "Empresarial",       value: stats.users_by_plan?.enterprise ?? 0,  color: "text-purple-400", icon: <Building2 className="w-4 h-4" /> },
            { label: "Produtos Virais",   value: stats.viral_products, color: "text-red-400",      icon: <Package className="w-4 h-4" /> },
          ].map((s) => (
            <div key={s.label} className="card">
              <div className="flex items-center gap-2 mb-2 text-gray-500">{s.icon}<p className="text-xs">{s.label}</p></div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value?.toLocaleString("pt-BR") ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users Table */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
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
        <div className="card space-y-4">
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
    </div>
  );
}
