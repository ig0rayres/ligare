"use client";

import { useState, useTransition } from "react";
import {
  Search, Filter, Building2, Users, Heart, DollarSign,
  Calendar, MoreHorizontal, LogIn, Ban, CheckCircle,
  XCircle, Clock, TrendingUp, ChevronDown, X, Phone, Mail,
  MapPin, ExternalLink,
} from "lucide-react";
import { impersonateTenant } from "../actions";
import { toast } from "sonner";

interface Subscription {
  plan: string;
  status: string;
  current_period_end: string | null;
  mrr: number | null;
}

interface Tenant {
  id: string;
  name: string;
  subdomain: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  created_at: string;
  subscriptions: Subscription[] | null;
}

const planColors: Record<string, string> = {
  free:       "bg-gray-100 text-gray-600",
  start:      "bg-blue-50 text-blue-700",
  pro:        "bg-violet-50 text-violet-700",
  enterprise: "bg-amber-50 text-amber-700",
};

const statusConfig: Record<string, { label: string; icon: any; cls: string }> = {
  active:   { label: "Ativo",      icon: CheckCircle, cls: "badge-success" },
  trial:    { label: "Trial",      icon: Clock,       cls: "badge-warning" },
  overdue:  { label: "Inadimpl.",  icon: XCircle,     cls: "badge-danger"  },
  canceled: { label: "Cancelado",  icon: Ban,         cls: "badge-danger"  },
};

function TenantDetailModal({ tenant, onClose }: { tenant: Tenant; onClose: () => void }) {
  const [, startTransition] = useTransition();
  const sub = tenant.subscriptions?.[0];

  function handleImpersonate() {
    startTransition(async () => {
      try {
        await impersonateTenant(tenant.id);
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-[var(--lg-border-light)] flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-lg-mist flex items-center justify-center shrink-0">
              {tenant.logo_url ? (
                <img src={tenant.logo_url} alt={tenant.name} className="w-12 h-12 object-contain rounded-xl" />
              ) : (
                <Building2 className="w-7 h-7 text-lg-primary" />
              )}
            </div>
            <div>
              <h2 className="font-bold text-lg-midnight text-lg leading-tight">{tenant.name}</h2>
              {tenant.subdomain && (
                <a href={`https://${tenant.subdomain}.ligare.app`} target="_blank" rel="noreferrer"
                  className="text-xs text-lg-primary flex items-center gap-1 mt-0.5 hover:underline">
                  {tenant.subdomain}.ligare.app <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-lg-text-muted hover:text-lg-text p-1 rounded-lg hover:bg-lg-surface-raised">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Subscription Info */}
          <div className="card p-4 space-y-3">
            <h3 className="text-xs uppercase tracking-widest text-lg-text-muted font-semibold">Assinatura</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-lg-text-muted">Plano</p>
                <span className={`badge text-xs mt-1 ${planColors[sub?.plan || "free"]}`}>
                  {(sub?.plan || "free").toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-xs text-lg-text-muted">Status</p>
                <span className={`badge text-xs mt-1 ${statusConfig[sub?.status || "trial"]?.cls || "badge-warning"}`}>
                  {statusConfig[sub?.status || "trial"]?.label || sub?.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-lg-text-muted">MRR</p>
                <p className="text-sm font-bold text-lg-midnight">
                  {sub?.mrr ? `R$ ${sub.mrr.toFixed(2).replace(".", ",")}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-lg-text-muted">Expira em</p>
                <p className="text-sm font-medium text-lg-text">
                  {sub?.current_period_end
                    ? new Date(sub.current_period_end).toLocaleDateString("pt-BR")
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="card p-4 space-y-3">
            <h3 className="text-xs uppercase tracking-widest text-lg-text-muted font-semibold">Contato</h3>
            <div className="space-y-2.5">
              {tenant.email && (
                <div className="flex items-center gap-2.5 text-sm text-lg-text">
                  <Mail className="w-4 h-4 text-lg-text-muted shrink-0" />
                  {tenant.email}
                </div>
              )}
              {tenant.phone && (
                <div className="flex items-center gap-2.5 text-sm text-lg-text">
                  <Phone className="w-4 h-4 text-lg-text-muted shrink-0" />
                  {tenant.phone}
                </div>
              )}
              {(tenant.city || tenant.state) && (
                <div className="flex items-center gap-2.5 text-sm text-lg-text">
                  <MapPin className="w-4 h-4 text-lg-text-muted shrink-0" />
                  {[tenant.city, tenant.state].filter(Boolean).join(" — ")}
                </div>
              )}
              <div className="flex items-center gap-2.5 text-sm text-lg-text">
                <Calendar className="w-4 h-4 text-lg-text-muted shrink-0" />
                Cadastrada em {new Date(tenant.created_at).toLocaleDateString("pt-BR")}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[var(--lg-border-light)] space-y-3">
          <button
            onClick={handleImpersonate}
            className="btn btn-primary w-full"
          >
            <LogIn className="w-4 h-4" />
            Entrar como esta Igreja
          </button>
          <button onClick={onClose} className="btn btn-ghost w-full btn-sm">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TenantsClient({ tenants }: { tenants: Tenant[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Tenant | null>(null);

  const filtered = tenants.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.subdomain || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.email || "").toLowerCase().includes(search.toLowerCase());

    const sub = t.subscriptions?.[0];
    const matchStatus = statusFilter === "all" || sub?.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const totalMrr = tenants.reduce((acc, t) => acc + (t.subscriptions?.[0]?.mrr || 0), 0);
  const activeCount = tenants.filter((t) => t.subscriptions?.[0]?.status === "active").length;
  const trialCount  = tenants.filter((t) => t.subscriptions?.[0]?.status === "trial").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
            Tenants
          </h1>
          <p className="text-sm text-lg-text-muted mt-1">
            Gestão de todas as igrejas clientes da plataforma
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {[
          { label: "Total de Igrejas", value: tenants.length, icon: Building2,   color: "var(--lg-primary)"  },
          { label: "MRR Total",        value: `R$ ${totalMrr.toFixed(0)}`, icon: TrendingUp, color: "var(--lg-care)" },
          { label: "Assinantes Ativos",value: activeCount,   icon: CheckCircle,  color: "var(--lg-success)"  },
          { label: "Em Trial",         value: trialCount,    icon: Clock,         color: "var(--lg-warning)"  },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-lg-text-muted font-medium">{kpi.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}18` }}>
                <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lg-text-muted" />
          <input
            type="text"
            placeholder="Buscar por nome, subdomínio ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto min-w-[150px]"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="trial">Trial</option>
          <option value="overdue">Inadimplente</option>
          <option value="canceled">Cancelado</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--lg-border-light)] bg-lg-surface-raised">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-lg-text-muted uppercase tracking-wider">Igreja</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-lg-text-muted uppercase tracking-wider">Plano</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-lg-text-muted uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-lg-text-muted uppercase tracking-wider">MRR</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-lg-text-muted uppercase tracking-wider">Expira</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-lg-text-muted uppercase tracking-wider">Cadastro</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--lg-border-light)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-lg-text-muted text-sm">
                    Nenhuma igreja encontrada.
                  </td>
                </tr>
              ) : filtered.map((tenant) => {
                const sub = tenant.subscriptions?.[0];
                const sc  = statusConfig[sub?.status || "trial"] || statusConfig["trial"];

                return (
                  <tr key={tenant.id} className="hover:bg-lg-surface-raised transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-lg-mist flex items-center justify-center shrink-0">
                          {tenant.logo_url ? (
                            <img src={tenant.logo_url} alt={tenant.name} className="w-8 h-8 object-contain rounded-lg" />
                          ) : (
                            <Building2 className="w-4 h-4 text-lg-primary" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-lg-midnight">{tenant.name}</p>
                          <p className="text-xs text-lg-text-muted">{tenant.subdomain ? `${tenant.subdomain}.ligare.app` : "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge text-xs ${planColors[sub?.plan || "free"]}`}>
                        {(sub?.plan || "free").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge ${sc.cls}`}>
                        <sc.icon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-lg-midnight">
                      {sub?.mrr ? `R$ ${Number(sub.mrr).toFixed(2).replace(".", ",")}` : "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-lg-text-muted">
                      {sub?.current_period_end
                        ? new Date(sub.current_period_end).toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-lg-text-muted">
                      {new Date(tenant.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setSelected(tenant)}
                        className="btn btn-ghost btn-sm px-3 py-1.5 text-xs flex items-center gap-1.5"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                        Detalhes
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3.5 border-t border-[var(--lg-border-light)] bg-lg-surface-raised flex items-center justify-between">
          <p className="text-xs text-lg-text-muted">
            {filtered.length} de {tenants.length} igrejas
          </p>
        </div>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <TenantDetailModal tenant={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
