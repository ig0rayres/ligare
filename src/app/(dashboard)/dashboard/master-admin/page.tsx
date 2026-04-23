import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Building2,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Shield,
  TrendingUp,
  Users,
  Heart,
  Baby,
  DollarSign,
  BarChart3,
  LogOut,
} from "lucide-react";
import { impersonateTenant } from "./actions";

// Plan pricing for MRR calculation
const planPrices: Record<string, number> = {
  free: 0,
  start: 97,
  growth: 197,
  pro: 497,
  enterprise: 997,
};

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

  // Fetch all churches with related data
  const { data: churches } = await supabase
    .from("churches")
    .select("id, name, subdomain, city, state, created_at")
    .order("created_at", { ascending: false });

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("church_id, plan, status, expires_at, max_members");

  // Fetch member counts per church
  const { data: profileCounts } = await supabase
    .from("profiles")
    .select("church_id");

  // Fetch cell counts per church
  const { data: cellCounts } = await supabase
    .from("cells")
    .select("church_id");

  // Build per-church stats
  const memberCountMap = new Map<string, number>();
  (profileCounts || []).forEach((p) => {
    memberCountMap.set(p.church_id, (memberCountMap.get(p.church_id) || 0) + 1);
  });

  const cellCountMap = new Map<string, number>();
  (cellCounts || []).forEach((c) => {
    cellCountMap.set(c.church_id, (cellCountMap.get(c.church_id) || 0) + 1);
  });

  const subMap = new Map(
    (subscriptions || []).map((s) => [s.church_id, s])
  );

  // --- Metrics ---
  const totalChurches = churches?.length || 0;
  const activeTrials = subscriptions?.filter((s) => s.status === "trial").length || 0;
  const activePaid = subscriptions?.filter((s) => s.status === "active" && s.plan !== "free").length || 0;

  // MRR = sum of plan prices for active/trial subscriptions
  const mrr = (subscriptions || []).reduce((acc, s) => {
    if (s.status === "active" || s.status === "trial") {
      return acc + (planPrices[s.plan] || 0);
    }
    return acc;
  }, 0);

  const totalMembers = Array.from(memberCountMap.values()).reduce((a, b) => a + b, 0);
  const totalCells = Array.from(cellCountMap.values()).reduce((a, b) => a + b, 0);

  // Top 4 churches by member count
  const churchesWithStats = (churches || []).map((church) => ({
    ...church,
    members: memberCountMap.get(church.id) || 0,
    cells: cellCountMap.get(church.id) || 0,
    sub: subMap.get(church.id),
  }));

  const topChurches = [...churchesWithStats]
    .sort((a, b) => b.members - a.members)
    .slice(0, 4);

  const maxMembers = Math.max(...topChurches.map((c) => c.members), 1);

  const statusStyles: Record<string, { className: string; label: string; icon: typeof Clock }> = {
    trial: { className: "badge-warning", label: "Trial", icon: Clock },
    active: { className: "badge-success", label: "Ativo", icon: CheckCircle2 },
    suspended: { className: "badge-danger", label: "Suspenso", icon: AlertTriangle },
    cancelled: { className: "badge-primary", label: "Cancelado", icon: Clock },
  };

  const planLabels: Record<string, string> = {
    free: "Free", start: "Start", growth: "Growth", pro: "Pro", enterprise: "Enterprise",
  };

  const planColors: Record<string, string> = {
    free: "var(--lg-text-muted)",
    start: "var(--lg-primary)",
    growth: "var(--lg-care)",
    pro: "#F59E0B",
    enterprise: "var(--lg-midnight)",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-lg-midnight flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1
              className="text-2xl font-bold text-lg-midnight"
              style={{ fontFamily: "var(--lg-font-heading)" }}
            >
              Painel Master Admin
            </h1>
            <p className="text-sm text-lg-text-muted">
              Visão geral da operação Ligare SaaS
            </p>
          </div>
        </div>
      </div>

      {/* Financial + Operational Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-lg-text-muted font-medium uppercase tracking-wider">MRR</p>
              <p className="text-2xl font-bold text-lg-midnight mt-1" style={{ fontFamily: "var(--lg-font-heading)" }}>
                R$ {mrr.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-lg-care" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-lg-text-muted font-medium uppercase tracking-wider">Igrejas</p>
              <p className="text-2xl font-bold text-lg-midnight mt-1" style={{ fontFamily: "var(--lg-font-heading)" }}>
                {totalChurches}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-lg-primary-light flex items-center justify-center">
              <Building2 className="w-4 h-4 text-lg-primary" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-lg-text-muted font-medium uppercase tracking-wider">Em Trial</p>
              <p className="text-2xl font-bold text-lg-midnight mt-1" style={{ fontFamily: "var(--lg-font-heading)" }}>
                {activeTrials}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)" }}>
              <Clock className="w-4 h-4 text-[#F59E0B]" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-lg-text-muted font-medium uppercase tracking-wider">Membros</p>
              <p className="text-2xl font-bold text-lg-midnight mt-1" style={{ fontFamily: "var(--lg-font-heading)" }}>
                {totalMembers}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-lg-primary" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-lg-text-muted font-medium uppercase tracking-wider">Células</p>
              <p className="text-2xl font-bold text-lg-midnight mt-1" style={{ fontFamily: "var(--lg-font-heading)" }}>
                {totalCells}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.1)" }}>
              <Heart className="w-4 h-4 text-[#8B5CF6]" />
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 Churches Chart */}
      <div className="card">
        <div className="p-5 border-b border-[var(--lg-border-light)]">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-lg-primary" />
            <h2
              className="font-bold text-lg-midnight"
              style={{ fontFamily: "var(--lg-font-heading)" }}
            >
              Top Igrejas por Membros
            </h2>
          </div>
        </div>
        <div className="p-5">
          {topChurches.length === 0 ? (
            <p className="text-center text-sm text-lg-text-muted py-8">
              Nenhuma igreja cadastrada ainda.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topChurches.map((church, index) => {
                const sub = church.sub;
                const plan = sub?.plan || "free";
                const barPercent = (church.members / maxMembers) * 100;
                const colors = ["var(--lg-primary)", "var(--lg-care)", "#F59E0B", "#8B5CF6"];
                const bgColors = ["rgba(31,111,235,0.08)", "rgba(24,179,126,0.08)", "rgba(245,158,11,0.08)", "rgba(139,92,246,0.08)"];

                return (
                  <div key={church.id} className="card p-5 border border-[var(--lg-border-light)]">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: colors[index] }}
                      >
                        {(index + 1)}º
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-lg-midnight truncate">
                          {church.name}
                        </p>
                        <p className="text-xs text-lg-text-muted">
                          {church.city}{church.state ? `, ${church.state}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Visual Bar */}
                    <div className="mb-4">
                      <div className="flex items-end gap-1 h-20">
                        <div className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-lg font-bold" style={{ color: colors[index] }}>
                            {church.members}
                          </span>
                          <div
                            className="w-full rounded-t-lg transition-all"
                            style={{
                              height: `${Math.max(barPercent, 15)}%`,
                              background: bgColors[index],
                              borderBottom: `3px solid ${colors[index]}`,
                            }}
                          />
                          <span className="text-[10px] text-lg-text-muted uppercase">Membros</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-lg font-bold text-lg-text-secondary">
                            {church.cells}
                          </span>
                          <div
                            className="w-full rounded-t-lg transition-all"
                            style={{
                              height: `${Math.max((church.cells / Math.max(maxMembers, 1)) * 100, 15)}%`,
                              background: "rgba(0,0,0,0.04)",
                              borderBottom: "3px solid var(--lg-text-muted)",
                            }}
                          />
                          <span className="text-[10px] text-lg-text-muted uppercase">Células</span>
                        </div>
                      </div>
                    </div>

                    {/* Plan Badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-md"
                        style={{
                          color: planColors[plan] || "var(--lg-text-muted)",
                          background: `${planColors[plan] || "var(--lg-text-muted)"}12`,
                        }}
                      >
                        {planLabels[plan] || plan}
                      </span>
                      <span className="text-xs text-lg-text-muted">
                        R$ {(planPrices[plan] || 0).toLocaleString("pt-BR")}/mês
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* All Churches Table */}
      <div className="card">
        <div className="p-5 border-b border-[var(--lg-border-light)] flex items-center justify-between">
          <h2
            className="font-bold text-lg-midnight"
            style={{ fontFamily: "var(--lg-font-heading)" }}
          >
            Todas as Igrejas
          </h2>
          <span className="text-sm text-lg-text-muted">
            {totalChurches} {totalChurches === 1 ? "igreja" : "igrejas"}
          </span>
        </div>

        {totalChurches === 0 ? (
          <div className="p-10 text-center">
            <Building2 className="w-12 h-12 text-lg-text-muted mx-auto mb-3 opacity-40" />
            <p className="text-sm text-lg-text-muted">
              Nenhuma igreja cadastrada ainda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--lg-border-light)] bg-lg-surface-raised">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-lg-text-muted uppercase tracking-wider">
                    Igreja
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-lg-text-muted uppercase tracking-wider">
                    Membros
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-lg-text-muted uppercase tracking-wider">
                    Células
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-lg-text-muted uppercase tracking-wider">
                    Plano
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-lg-text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-lg-text-muted uppercase tracking-wider">
                    Receita
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-lg-text-muted uppercase tracking-wider">
                    Expira em
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-lg-text-muted uppercase tracking-wider">
                    Criada em
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-lg-text-muted uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--lg-border-light)]">
                {churchesWithStats.map((church) => {
                  const sub = church.sub;
                  const status = sub?.status || "unknown";
                  const plan = sub?.plan || "free";
                  const style = statusStyles[status] || { className: "badge-primary", label: status, icon: Clock };
                  const StatusIcon = style.icon;

                  return (
                    <tr key={church.id} className="hover:bg-lg-surface-raised transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: planColors[plan] || "var(--lg-primary)" }}
                          >
                            {church.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-lg-midnight truncate">{church.name}</p>
                            <p className="text-xs text-lg-text-muted">
                              {church.city && church.state ? `${church.city}, ${church.state}` : church.subdomain || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-bold text-lg-midnight">{church.members}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-bold text-lg-text-secondary">{church.cells}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded-md"
                          style={{
                            color: planColors[plan],
                            background: `${planColors[plan]}12`,
                          }}
                        >
                          {planLabels[plan] || plan}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`badge ${style.className}`}>
                          <StatusIcon className="w-3 h-3" />
                          {style.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-lg-care">
                          R$ {(planPrices[plan] || 0).toLocaleString("pt-BR")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-lg-text-secondary">
                        {sub?.expires_at
                          ? new Date(sub.expires_at).toLocaleDateString("pt-BR")
                          : "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-lg-text-muted">
                        {new Date(church.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <form action={impersonateTenant.bind(null, church.id)}>
                          <button
                            type="submit"
                            title="Assumir Tenant e Ver Dashboard"
                            className="flex items-center gap-2 px-3 py-1.5 mx-auto bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium"
                          >
                            Entrar <LogOut className="w-3.5 h-3.5 transform rotate-180" />
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
