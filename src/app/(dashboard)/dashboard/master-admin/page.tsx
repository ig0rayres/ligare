import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Building2, TrendingUp, Users, DollarSign, Clock,
  CheckCircle2, AlertTriangle, BarChart3, ArrowUpRight,
  Package, Boxes, LogIn,
} from "lucide-react";
import { impersonateTenant } from "./actions";
import Link from "next/link";

export const metadata = { title: "Master Admin — Ligare" };

export default async function MasterAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin, full_name")
    .eq("id", user.id)
    .single();
  if (!profile?.is_platform_admin) redirect("/dashboard");

  // ─── Data aggregation ─────────────────────────────────────────
  const [churchesRes, subsRes, membersRes, plansRes, addonsRes] = await Promise.all([
    supabase
      .from("churches")
      .select("id, name, subdomain, logo_url, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("church_id, plan, status, mrr, expires_at, current_period_end"),
    supabase
      .from("church_members")
      .select("church_id"),
    supabase.from("platform_plans").select("id, name").order("sort_order"),
    supabase.from("platform_addons").select("id").eq("is_active", true),
  ]);

  const churches    = churchesRes.data || [];
  const subs        = subsRes.data || [];
  const members     = membersRes.data || [];
  const plans       = plansRes.data || [];
  const addons      = addonsRes.data || [];

  const totalMrr    = subs.reduce((acc, s) => acc + (s.mrr || 0), 0);
  const activeCount = subs.filter((s) => s.status === "active").length;
  const trialCount  = subs.filter((s) => s.status === "trial").length;
  const overdueCount= subs.filter((s) => s.status === "overdue").length;
  const totalMembers= members.length;

  // Top churches by member count
  const membersByChurch: Record<string, number> = {};
  members.forEach((m) => {
    if (m.church_id) membersByChurch[m.church_id] = (membersByChurch[m.church_id] || 0) + 1;
  });

  const topChurches = churches
    .map((c) => ({ ...c, memberCount: membersByChurch[c.id] || 0 }))
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, 5);

  // Plan distribution
  const planDist: Record<string, number> = {};
  subs.forEach((s) => {
    const key = s.plan || "free";
    planDist[key] = (planDist[key] || 0) + 1;
  });

  const planColors: Record<string, string> = {
    free: "#94A3B8", start: "#1F6FEB", pro: "#8B5CF6", enterprise: "#F59E0B",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-lg-text-muted font-semibold mb-1">Master Admin</p>
          <h1 className="text-2xl font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
            Visão Geral do SaaS
          </h1>
          <p className="text-sm text-lg-text-muted mt-1">Operação global da plataforma Ligare</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/master-admin/tenants" className="btn btn-ghost btn-sm flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Gerenciar Tenants
          </Link>
          <Link href="/dashboard/master-admin/plans" className="btn btn-primary btn-sm flex items-center gap-2">
            <Package className="w-4 h-4" /> Planos & Addons
          </Link>
        </div>
      </div>

      {/* ── KPI Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {[
          {
            label:  "MRR",
            value:  `R$ ${totalMrr.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`,
            sub:    "Receita recorrente mensal",
            icon:   DollarSign,
            color:  "var(--lg-care)",
            trend:  "+12%",
          },
          {
            label:  "Igrejas",
            value:  churches.length,
            sub:    `${activeCount} ativas • ${trialCount} em trial`,
            icon:   Building2,
            color:  "var(--lg-primary)",
          },
          {
            label:  "Membros Total",
            value:  totalMembers,
            sub:    "Usuários na plataforma",
            icon:   Users,
            color:  "#8B5CF6",
          },
          {
            label:  overdueCount > 0 ? "Inadimplentes" : "Planos Ativos",
            value:  overdueCount > 0 ? overdueCount : plans.length,
            sub:    overdueCount > 0 ? "Requerem atenção" : `${addons.length} addons no catálogo`,
            icon:   overdueCount > 0 ? AlertTriangle : Package,
            color:  overdueCount > 0 ? "var(--lg-danger)" : "var(--lg-warning)",
          },
        ].map((kpi, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-lg-text-muted font-medium">{kpi.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}18` }}>
                <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
              {kpi.value}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-lg-text-muted">{kpi.sub}</p>
              {kpi.trend && (
                <span className="text-xs font-semibold text-lg-care flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />{kpi.trend}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Content Grid ───────────────────────────────────────── */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* Top Churches Table (3 cols) */}
        <div className="lg:col-span-3 card overflow-hidden">
          <div className="p-5 border-b border-[var(--lg-border-light)] flex items-center justify-between">
            <h2 className="font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
              Top Igrejas por Membros
            </h2>
            <Link href="/dashboard/master-admin/tenants"
              className="text-xs text-lg-primary font-medium flex items-center gap-1 hover:underline">
              Ver todas <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-[var(--lg-border-light)]">
            {topChurches.length === 0 ? (
              <p className="text-center py-12 text-sm text-lg-text-muted">Nenhuma Igreja cadastrada.</p>
            ) : topChurches.map((church, idx) => {
              const sub = subs.find((s) => s.church_id === church.id);
              return (
                <div key={church.id} className="px-5 py-4 flex items-center gap-4 hover:bg-lg-surface-raised transition-colors">
                  {/* Rank */}
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                    style={{
                      background: idx === 0 ? "#FEF3C7" : idx === 1 ? "#F1F5F9" : "#FFF",
                      color:      idx === 0 ? "#D97706"  : idx === 1 ? "#64748B" : "#94A3B8",
                      border: "1px solid currentColor",
                    }}>
                    {idx + 1}
                  </div>

                  {/* Logo */}
                  <div className="w-9 h-9 rounded-xl bg-lg-mist flex items-center justify-center shrink-0">
                    {church.logo_url ? (
                      <img src={church.logo_url} alt={church.name} className="w-8 h-8 object-contain rounded-lg" />
                    ) : (
                      <Building2 className="w-4 h-4 text-lg-primary" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-lg-midnight truncate">{church.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-lg-text-muted">{church.subdomain || "—"}</span>
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                        style={{
                          background: `${planColors[sub?.plan || "free"]}18`,
                          color: planColors[sub?.plan || "free"],
                        }}>
                        {(sub?.plan || "free").toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Members & Action */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-lg-midnight">{church.memberCount}</p>
                      <p className="text-[10px] text-lg-text-muted">membros</p>
                    </div>
                    <form action={impersonateTenant.bind(null, church.id)}>
                      <button type="submit"
                        className="flex items-center gap-1.5 text-xs font-semibold text-lg-primary bg-lg-mist hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                        <LogIn className="w-3.5 h-3.5" /> Entrar
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (2 cols) */}
        <div className="lg:col-span-2 space-y-5">

          {/* Plan Distribution */}
          <div className="card p-5">
            <h3 className="font-bold text-lg-midnight text-sm mb-4" style={{ fontFamily: "var(--lg-font-heading)" }}>
              Distribuição por Plano
            </h3>
            <div className="space-y-3">
              {Object.entries(planDist).length === 0 ? (
                <p className="text-xs text-lg-text-muted">Sem dados.</p>
              ) : Object.entries(planDist).map(([plan, count]) => {
                const total   = subs.length || 1;
                const pct     = Math.round((count / total) * 100);
                const color   = planColors[plan] || "#94A3B8";
                return (
                  <div key={plan}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-lg-text capitalize">{plan}</span>
                      <span className="text-xs text-lg-text-muted">{count} iglesias · {pct}%</span>
                    </div>
                    <div className="h-2 bg-lg-surface-raised rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Summary */}
          <div className="card p-5">
            <h3 className="font-bold text-lg-midnight text-sm mb-4" style={{ fontFamily: "var(--lg-font-heading)" }}>
              Status das Assinaturas
            </h3>
            <div className="space-y-2.5">
              {[
                { label: "Ativas",      count: activeCount,  icon: CheckCircle2,  cls: "text-lg-success",  bg: "bg-green-50"  },
                { label: "Em Trial",    count: trialCount,   icon: Clock,          cls: "text-amber-500",   bg: "bg-amber-50"  },
                { label: "Inadimpl.",   count: overdueCount, icon: AlertTriangle,  cls: "text-lg-danger",   bg: "bg-red-50"    },
                { label: "Total",       count: churches.length, icon: Building2,   cls: "text-lg-primary",  bg: "bg-blue-50"   },
              ].map(({ label, count, icon: Icon, cls, bg }) => (
                <div key={label} className={`flex items-center gap-3 p-3 rounded-xl ${bg}`}>
                  <Icon className={`w-4 h-4 shrink-0 ${cls}`} />
                  <span className="text-sm text-lg-text flex-1">{label}</span>
                  <span className={`text-sm font-bold ${cls}`}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="card p-5">
            <h3 className="font-bold text-lg-midnight text-sm mb-3" style={{ fontFamily: "var(--lg-font-heading)" }}>
              Atalhos
            </h3>
            <div className="space-y-2">
              {[
                { href: "/dashboard/master-admin/tenants", icon: Building2, label: "Gerenciar Tenants" },
                { href: "/dashboard/master-admin/plans",   icon: Package,   label: "Precificação & Planos" },
              ].map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-lg-surface-raised transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-lg-mist flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Icon className="w-4 h-4 text-lg-primary" />
                  </div>
                  <span className="text-sm font-medium text-lg-text">{label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-lg-text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
