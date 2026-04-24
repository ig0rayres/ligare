import {
  Users,
  Baby,
  Heart,
  MessageCircle,
  TrendingUp,
  AlertCircle,
  Check,
  Clock,
  ArrowUpRight,
  BarChart3,
  UserPlus,
  Eye,
} from "lucide-react";

const stats = [
  { label: "Membros ativos", value: "347", change: "+12", icon: Users, color: "var(--lg-primary)" },
  { label: "Kids check-in hoje", value: "23", change: "+5", icon: Baby, color: "var(--lg-care)" },
  { label: "Células ativas", value: "18", change: "+2", icon: Heart, color: "#8B5CF6" },
  { label: "Follow-ups pendentes", value: "12", change: "-3", icon: MessageCircle, color: "#F59E0B" },
];

const recentFollowups = [
  { name: "Maria Silva", type: "Visitante", status: "pending", time: "2h atrás" },
  { name: "João Santos", type: "Faltante", status: "contacted", time: "5h atrás" },
  { name: "Ana Oliveira", type: "Novo membro", status: "pending", time: "1 dia" },
  { name: "Pedro Costa", type: "Faltante", status: "awaiting", time: "2 dias" },
  { name: "Lucas Ferreira", type: "Visitante", status: "closed", time: "3 dias" },
];

const kidsActivity = [
  { child: "Sofia", parent: "Maria Silva", room: "Berçário A", time: "09:32", status: "checked_in" },
  { child: "Miguel", parent: "Ana Oliveira", room: "Kids 3-5", time: "09:28", status: "checked_in" },
  { child: "Laura", parent: "Pedro Costa", room: "Kids 6-8", time: "09:15", status: "checked_out" },
];

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import LeaderDashboard from "./LeaderDashboard";
import { getAttendanceReport } from "./leader-actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const cookieStore = await cookies();
  const isImpersonating = cookieStore.get("lg_is_impersonating")?.value === "true";
  const impersonatingChurchId = cookieStore.get("lg_impersonating_church_id")?.value;
  let profile: any = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("is_platform_admin, role, id, church_id, cell_name")
      .eq("id", user.id)
      .single();
    
    profile = data;

    if (profile?.is_platform_admin && !isImpersonating) {
      redirect("/dashboard/master-admin");
    }

    // When impersonating, use the impersonated church context
    if (isImpersonating && impersonatingChurchId && profile?.is_platform_admin) {
      profile.church_id = impersonatingChurchId;
      // Platform admin impersonating always sees the admin dashboard
      profile.role = "admin";
    }
  }

  // ─── LEADER / KIDS_TEAM: Unified Dashboard ───
  if (profile && (profile.role === "leader" || profile.role === "kids_team")) {
    // Get church term
    const { data: church } = await supabase
      .from("churches")
      .select("cell_term")
      .eq("id", profile.church_id)
      .single();

    const cellTerm = church?.cell_term || "Células";

    // Fetch members
    let cellMembers: any[] = [];
    if (profile.role === "leader") {
      const { data } = await supabase
        .from("church_members")
        .select("id, full_name, email, whatsapp, role_id, leader_id, status, notes, avatar_url, birth_date, is_baptized")
        .eq("church_id", profile.church_id)
        .eq("leader_id", profile.id)
        .order("full_name", { ascending: true });
      cellMembers = data || [];
    } else {
      const { data } = await supabase
        .from("kids")
        .select("id, full_name, birth_date, allergies, medical_notes, photo_url, is_active, status, classroom_id")
        .eq("church_id", profile.church_id)
        .eq("leader_id", profile.id)
        .order("full_name", { ascending: true });
      cellMembers = (data || []).map((k: any) => ({
        ...k,
        status: k.is_active ? "active" : "inactive",
        avatar_url: k.photo_url || null,
        is_kid: true,
      }));
    }

    // Fetch attendance report
    const { records, distinctDates } = await getAttendanceReport(profile.id, profile.church_id, 4);

    // Fetch available events for attendance registration
    const { getAvailableEventsForAttendance } = await import("./leader-actions");
    const availableEvents = await getAvailableEventsForAttendance(profile.church_id, profile.id);

    return (
      <LeaderDashboard
        members={cellMembers}
        callerRole={profile.role}
        cellTerm={cellTerm}
        leaderId={profile.id}
        initialCellName={profile.cell_name || null}
        attendanceRecords={records}
        distinctDates={distinctDates}
        availableEvents={availableEvents}
      />
    );
  }

  // ─── ADMIN DASHBOARD (original) ───
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold text-lg-midnight"
          style={{ fontFamily: "var(--lg-font-heading)" }}
        >
          Dashboard
        </h1>
        <p className="text-sm text-lg-text-muted mt-1">
          Visão geral da sua igreja neste momento
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {stats.map((stat) => {
          return (
            <div key={stat.label} className="card p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-lg-text-muted font-medium">{stat.label}</p>
                  <p
                    className="text-2xl font-bold text-lg-midnight mt-1"
                    style={{ fontFamily: "var(--lg-font-heading)" }}
                  >
                    {stat.value}
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${stat.color}12` }}
                >
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-lg-care" />
                <span className="text-xs font-semibold text-lg-care">{stat.change}</span>
                <span className="text-xs text-lg-text-muted">esta semana</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Follow-up List (3 cols) */}
        <div className="lg:col-span-3 card">
          <div className="p-5 border-b border-[var(--lg-border-light)] flex items-center justify-between">
            <h2
              className="font-bold text-lg-midnight"
              style={{ fontFamily: "var(--lg-font-heading)" }}
            >
              Follow-ups recentes
            </h2>
            <a
              href="/dashboard/followup"
              className="text-sm text-lg-primary font-medium flex items-center gap-1 hover:underline"
            >
              Ver todos <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="divide-y divide-[var(--lg-border-light)]">
            {recentFollowups.map((item, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center justify-between hover:bg-lg-surface-raised transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-lg-mist flex items-center justify-center text-xs font-bold text-lg-primary">
                    {item.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-lg-midnight">{item.name}</p>
                    <p className="text-xs text-lg-text-muted">{item.type} • {item.time}</p>
                  </div>
                </div>
                <span className={`badge ${
                  item.status === 'pending' ? 'badge-warning' :
                  item.status === 'contacted' ? 'badge-primary' :
                  item.status === 'awaiting' ? 'badge-danger' :
                  'badge-success'
                }`}>
                  {item.status === 'pending' && <><Clock className="w-3 h-3" /> Pendente</>}
                  {item.status === 'contacted' && <><Check className="w-3 h-3" /> Contatado</>}
                  {item.status === 'awaiting' && <><AlertCircle className="w-3 h-3" /> Aguardando</>}
                  {item.status === 'closed' && <><Check className="w-3 h-3" /> Encerrado</>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Kids Activity (2 cols) */}
        <div className="lg:col-span-2 card">
          <div className="p-5 border-b border-[var(--lg-border-light)] flex items-center justify-between">
            <h2
              className="font-bold text-lg-midnight"
              style={{ fontFamily: "var(--lg-font-heading)" }}
            >
              Kids Check-in
            </h2>
            <a
              href="/dashboard/kids"
              className="text-sm text-lg-primary font-medium flex items-center gap-1 hover:underline"
            >
              Abrir <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="divide-y divide-[var(--lg-border-light)]">
            {kidsActivity.map((item, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-lg-midnight">{item.child}</p>
                  <p className="text-xs text-lg-text-muted">{item.room} • {item.time}</p>
                </div>
                <span className={`badge ${item.status === 'checked_in' ? 'badge-success' : 'badge-primary'}`}>
                  {item.status === 'checked_in' ? 'Presente' : 'Saiu'}
                </span>
              </div>
            ))}
          </div>
          <div className="p-4">
            <a href="/dashboard/kids" className="btn btn-success w-full">
              <Baby className="w-4 h-4" />
              Fazer Check-in
            </a>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <button className="card p-5 flex items-center gap-4 hover:shadow-md transition-all text-left group">
          <div className="w-11 h-11 rounded-xl bg-lg-primary-light flex items-center justify-center group-hover:scale-110 transition-transform">
            <UserPlus className="w-5 h-5 text-lg-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-lg-midnight">Cadastrar membro</p>
            <p className="text-xs text-lg-text-muted">Novo membro ou visitante</p>
          </div>
        </button>
        <button className="card p-5 flex items-center gap-4 hover:shadow-md transition-all text-left group">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: 'rgba(24,179,126,0.1)' }}>
            <Eye className="w-5 h-5 text-lg-care" />
          </div>
          <div>
            <p className="text-sm font-semibold text-lg-midnight">Registrar presença</p>
            <p className="text-xs text-lg-text-muted">Culto de hoje</p>
          </div>
        </button>
        <button className="card p-5 flex items-center gap-4 hover:shadow-md transition-all text-left group">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: 'rgba(245,158,11,0.1)' }}>
            <BarChart3 className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-lg-midnight">Ver relatórios</p>
            <p className="text-xs text-lg-text-muted">Presença e engajamento</p>
          </div>
        </button>
      </div>
    </div>
  );
}
