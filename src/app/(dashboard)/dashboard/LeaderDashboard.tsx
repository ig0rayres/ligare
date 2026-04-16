"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import {
  User, Phone, Mail, UserPlus, Trash2, Pencil, X, Loader2,
  AlertCircle, Baby, Heart, Check, ClipboardList, Users,
  TrendingUp, BarChart3, CalendarDays, UserCheck, AlertTriangle, Star
} from "lucide-react";
import {
  createCellMember, createCellKid, removeCellMember, removeCellKid, updateCellName,
  registerAttendance, getExistingAttendance
} from "./leader-actions";
import { toast } from "sonner";

// ─── Types ───
interface CellMember {
  id: string;
  full_name: string;
  email?: string | null;
  whatsapp?: string | null;
  status: string;
  birth_date?: string | null;
  is_baptized?: boolean;
  avatar_url?: string | null;
  is_kid?: boolean;
  allergies?: string | null;
  medical_notes?: string | null;
}

interface AttendanceRecord {
  member_id: string | null;
  kid_id: string | null;
  visitor_name: string | null;
  service_date: string;
  status: string;
}

interface Props {
  members: CellMember[];
  callerRole: string;
  cellTerm: string;
  leaderId: string;
  initialCellName: string | null;
  attendanceRecords: AttendanceRecord[];
  distinctDates: string[];
  availableEvents: { event_id: string; title: string; instance_date: string; target_members?: string[] | null }[];
}

// ─── Helper ───
function getWeekLabel(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function formatDateInput(date: Date) {
  return date.toISOString().split("T")[0];
}

// ─── Component ───
export default function LeaderDashboard({
  members, callerRole, cellTerm, leaderId, initialCellName,
  attendanceRecords, distinctDates, availableEvents
}: Props) {
  const [isPending, startTransition] = useTransition();

  // Cell name editing
  const [cellName, setCellName] = useState(initialCellName || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(cellName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Member management
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Attendance
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const defaultEvent = availableEvents.length > 0 ? availableEvents[0] : null;
  const [selectedEventKey, setSelectedEventKey] = useState<string>(
    defaultEvent ? `${defaultEvent.event_id}|${defaultEvent.instance_date}` : ""
  );
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [visitors, setVisitors] = useState<{ name: string; whatsapp: string }[]>([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);

  const isKidsTeam = callerRole === "kids_team";

  // ─── Focus name input ───
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // ─── Cell Name Save ───
  function handleSaveName() {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === cellName) {
      setIsEditingName(false);
      setNameDraft(cellName);
      return;
    }
    setCellName(trimmed);
    setIsEditingName(false);
    startTransition(async () => {
      try {
        await updateCellName(trimmed);
        toast.success("Nome atualizado!");
      } catch (e: any) {
        toast.error(e.message);
        setCellName(initialCellName || "");
      }
    });
  }

  // ─── Attendance Modal Open ───
  async function openAttendanceModal() {
    setShowAttendanceModal(true);
    setCheckedIds(new Set());
    setVisitors([]);
    
    const def = availableEvents.length > 0 ? availableEvents[0] : null;
    if (def) {
      const key = `${def.event_id}|${def.instance_date}`;
      setSelectedEventKey(key);
      loadExistingAttendance(def.event_id, def.instance_date);
    } else {
      setSelectedEventKey("");
    }
  }

  async function loadExistingAttendance(eventId: string, date: string) {
    if (!eventId || !date) return;
    setIsLoadingExisting(true);
    try {
      const existing = await getExistingAttendance(leaderId, eventId, date);
      const ids = new Set<string>();
      const vis: { name: string; whatsapp: string }[] = [];
      existing.forEach((r: any) => {
        if (r.status === "present") {
          if (r.member_id) ids.add(r.member_id);
          if (r.kid_id) ids.add(r.kid_id);
          if (r.visitor_name) vis.push({ name: r.visitor_name, whatsapp: r.visitor_whatsapp || "" });
        }
      });
      setCheckedIds(ids);
      setVisitors(vis);
    } catch {
      // no existing data
    } finally {
      setIsLoadingExisting(false);
    }
  }

  function handleEventChange(newKey: string) {
    setSelectedEventKey(newKey);
    if (!newKey) return;
    const [evId, evDate] = newKey.split("|");
    loadExistingAttendance(evId, evDate);
  }

  function toggleMember(id: string) {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSaveAttendance() {
    if (!selectedEventKey) {
      toast.error("Selecione um evento válido");
      return;
    }
    const [eventId, eventDate] = selectedEventKey.split("|");

    const records: any[] = [];

    members.forEach(m => {
      const key = isKidsTeam ? "kid_id" : "member_id";
      records.push({
        [key]: m.id,
        status: checkedIds.has(m.id) ? "present" : "absent",
      });
    });

    visitors.forEach(v => {
      if (v.name.trim()) {
        records.push({
          visitor_name: v.name.trim(),
          visitor_whatsapp: v.whatsapp.trim() || undefined,
          status: "present",
        });
      }
    });

    startTransition(async () => {
      try {
        await registerAttendance(eventId, eventDate, records);
        toast.success("Presença registrada com sucesso!");
        setShowAttendanceModal(false);
      } catch (e: any) {
        toast.error(e.message || "Erro ao registrar presença");
      }
    });
  }

  // ─── Member Management ───
  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    (m.email && m.email.toLowerCase().includes(memberSearch.toLowerCase())) ||
    (m.whatsapp && m.whatsapp.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  async function handleCreateMember(formData: FormData) {
    setFormError(null);
    startTransition(async () => {
      try {
        if (isKidsTeam) {
          await createCellKid(formData);
          toast.success("Criança adicionada!");
        } else {
          await createCellMember(formData);
          toast.success("Membro adicionado!");
        }
        setShowMemberModal(false);
      } catch (e: any) {
        setFormError(e.message);
      }
    });
  }

  async function handleRemove(id: string) {
    if (!confirm(`Remover da sua ${cellTerm.toLowerCase()}?`)) return;
    startTransition(async () => {
      try {
        isKidsTeam ? await removeCellKid(id) : await removeCellMember(id);
        toast.success("Removido!");
      } catch (e: any) { toast.error(e.message); }
    });
  }

  // ─── KPI Calculations ───
  const totalMembers = members.length;
  const lastDate = distinctDates.length > 0 ? distinctDates[distinctDates.length - 1] : null;
  const lastDatePresent = lastDate
    ? attendanceRecords.filter(r => r.service_date === lastDate && r.status === "present" && (r.member_id || r.kid_id)).length
    : 0;

  // Average attendance across all dates
  let avgPercent = 0;
  if (distinctDates.length > 0 && totalMembers > 0) {
    const totalPresent = distinctDates.reduce((sum, date) => {
      return sum + attendanceRecords.filter(r => r.service_date === date && r.status === "present" && (r.member_id || r.kid_id)).length;
    }, 0);
    avgPercent = Math.round((totalPresent / (distinctDates.length * totalMembers)) * 100);
  }

  // Per-member assiduity (last 4 dates)
  const recentDates = distinctDates.slice(-4);
  const assiduity = members.map(m => {
    const key = isKidsTeam ? "kid_id" : "member_id";
    const dots = recentDates.map(date => {
      const rec = attendanceRecords.find(r => r.service_date === date && r[key] === m.id);
      if (!rec) return "none";
      return rec.status === "present" ? "present" : "absent";
    });
    const presentCount = dots.filter(d => d === "present").length;
    const total = dots.filter(d => d !== "none").length;
    const pct = total > 0 ? Math.round((presentCount / total) * 100) : -1;
    return { member: m, dots, pct };
  }).sort((a, b) => b.pct - a.pct);

  // Weekly bar chart data
  const barData = recentDates.map(date => {
    const present = attendanceRecords.filter(r => r.service_date === date && r.status === "present" && (r.member_id || r.kid_id)).length;
    const absent = attendanceRecords.filter(r => r.service_date === date && r.status === "absent").length;
    return { date, present, absent, total: present + absent };
  });
  const maxBar = Math.max(...barData.map(b => b.total), 1);

  // Min date for date picker (7 days ago)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 7);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-lg-primary to-lg-secondary flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  ref={nameInputRef}
                  value={nameDraft}
                  onChange={e => setNameDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") { setIsEditingName(false); setNameDraft(cellName); } }}
                  onBlur={handleSaveName}
                  maxLength={60}
                  className="text-xl font-bold text-lg-midnight bg-lg-off-white border border-[var(--lg-primary)] rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-lg-primary w-64"
                  style={{ fontFamily: "var(--lg-font-heading)" }}
                  placeholder={`Nome da ${cellTerm.toLowerCase()}...`}
                />
                <button type="button" onMouseDown={e => { e.preventDefault(); handleSaveName(); }} className="p-1.5 rounded-lg bg-lg-primary text-white">
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setNameDraft(cellName); setIsEditingName(true); }}
                className="group flex items-center gap-2 hover:bg-lg-off-white rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors"
              >
                <h1 className="text-xl font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
                  {cellName || `Minha ${cellTerm}`}
                </h1>
                <Pencil className="w-3.5 h-3.5 text-lg-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            <p className="text-sm text-lg-text-muted">
              {totalMembers} {isKidsTeam ? "crianças" : "integrantes"} • {cellTerm}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ KPI CARDS ═══ */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-lg-text-muted font-medium">Total {isKidsTeam ? "Crianças" : "Membros"}</p>
              <p className="text-2xl font-bold text-lg-midnight mt-1" style={{ fontFamily: "var(--lg-font-heading)" }}>{totalMembers}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--lg-primary-light)" }}>
              <Users className="w-5 h-5" style={{ color: "var(--lg-primary)" }} />
            </div>
          </div>
        </div>
        <div className="card p-5 hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-lg-text-muted font-medium">Último Encontro</p>
              <p className="text-2xl font-bold text-lg-midnight mt-1" style={{ fontFamily: "var(--lg-font-heading)" }}>
                {lastDate ? `${lastDatePresent}/${totalMembers}` : "—"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-50">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
          </div>
          {lastDate && <p className="text-xs text-lg-text-muted mt-2">{getWeekLabel(lastDate)}</p>}
        </div>
        <div className="card p-5 hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-lg-text-muted font-medium">Frequência Média</p>
              <p className="text-2xl font-bold text-lg-midnight mt-1" style={{ fontFamily: "var(--lg-font-heading)" }}>
                {distinctDates.length > 0 ? `${avgPercent}%` : "—"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          {distinctDates.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-lg-care" />
              <span className="text-xs text-lg-text-muted">últimas {distinctDates.length} reuniões</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ ATTENDANCE BUTTON ═══ */}
      <button
        onClick={openAttendanceModal}
        disabled={isPending || availableEvents.length === 0}
        className="w-full btn-primary py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
      >
        <ClipboardList className="w-5 h-5" />
        {availableEvents.length === 0 ? "Nenhum evento disponível" : "Registrar Presença"}
      </button>

      {/* ═══ FREQUENCY CHART ═══ */}
      {recentDates.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-lg-midnight mb-4 flex items-center gap-2" style={{ fontFamily: "var(--lg-font-heading)" }}>
            <BarChart3 className="w-4 h-4 text-lg-primary" />
            Frequência por Encontro
          </h3>
          <div className="flex items-end gap-3 h-32">
            {barData.map(bar => {
              const presentH = bar.total > 0 ? (bar.present / maxBar) * 100 : 0;
              const absentH = bar.total > 0 ? (bar.absent / maxBar) * 100 : 0;
              return (
                <div key={bar.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end h-24 rounded-lg overflow-hidden bg-gray-50">
                    <div className="bg-red-400/70 transition-all duration-500" style={{ height: `${absentH}%` }} />
                    <div className="bg-emerald-500 transition-all duration-500" style={{ height: `${presentH}%` }} />
                  </div>
                  <span className="text-[10px] text-lg-text-muted font-medium">{getWeekLabel(bar.date)}</span>
                  <span className="text-[10px] font-bold text-lg-midnight">{bar.present}/{bar.total}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-[10px] text-lg-text-muted">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Presentes</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400/70" /> Ausentes</span>
          </div>
        </div>
      )}

      {/* ═══ INDIVIDUAL ASSIDUITY ═══ */}
      {recentDates.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-lg-midnight mb-4 flex items-center gap-2" style={{ fontFamily: "var(--lg-font-heading)" }}>
            <TrendingUp className="w-4 h-4 text-lg-primary" />
            Assiduidade Individual
          </h3>
          <div className="space-y-2.5">
            {assiduity.map(({ member, dots, pct }) => (
              <div key={member.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-lg-off-white transition-colors">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-lg-primary to-lg-secondary flex items-center justify-center text-white font-bold text-[10px] ring-1 ring-white overflow-hidden shrink-0">
                  {member.avatar_url ? <img src={member.avatar_url} alt="" className="w-full h-full object-cover" /> : member.full_name?.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-lg-midnight flex-1 truncate">{member.full_name}</span>
                <div className="flex items-center gap-1">
                  {dots.map((d, i) => (
                    <span key={i} className={`w-3 h-3 rounded-full ${d === "present" ? "bg-emerald-500" : d === "absent" ? "bg-red-400" : "bg-gray-200"}`} />
                  ))}
                </div>
                <span className={`text-xs font-bold w-10 text-right ${pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : pct >= 0 ? "text-red-500" : "text-gray-400"}`}>
                  {pct >= 0 ? `${pct}%` : "—"}
                </span>
                {pct === 100 && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                {pct >= 0 && pct < 50 && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ EMPTY STATE ═══ */}
      {recentDates.length === 0 && (
        <div className="card p-8 text-center">
          <ClipboardList className="w-10 h-10 text-lg-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm text-lg-text-muted font-medium">Nenhuma presença registrada ainda.</p>
          <p className="text-xs text-lg-text-muted mt-1">Use o botão acima para registrar o primeiro encontro!</p>
        </div>
      )}

      {/* ═══ MEMBERS TABLE ═══ */}
      <div className="card">
        <div className="p-4 border-b border-[var(--glass-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/50">
          <h3 className="text-sm font-bold text-lg-midnight flex items-center gap-2" style={{ fontFamily: "var(--lg-font-heading)" }}>
            <Users className="w-4 h-4 text-lg-primary" />
            Gestão {isKidsTeam ? "das Crianças" : "dos Membros"}
          </h3>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Buscar..."
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/80 border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary"
              />
              <User className="absolute left-3 top-2.5 w-4 h-4 text-lg-text-muted" />
            </div>
            <button onClick={() => { setFormError(null); setShowMemberModal(true); }} className="btn-primary px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 shrink-0">
              {isKidsTeam ? <Baby className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span className="hidden sm:inline">Adicionar</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--glass-border)] bg-lg-off-white/50">
                <th className="py-3 px-4 text-xs font-semibold text-lg-text-muted uppercase tracking-wider">Nome</th>
                <th className="py-3 px-4 text-xs font-semibold text-lg-text-muted uppercase tracking-wider">{isKidsTeam ? "Saúde" : "Contato"}</th>
                <th className="py-3 px-4 text-xs font-semibold text-lg-text-muted uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-lg-text-muted uppercase tracking-wider">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-sm text-lg-text-muted">Nenhum integrante. Adicione o primeiro!</td></tr>
              ) : filtered.map(m => (
                <tr key={m.id} className="hover:bg-lg-off-white transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lg-primary to-lg-secondary flex items-center justify-center text-white font-bold text-xs ring-2 ring-white overflow-hidden shrink-0">
                        {m.avatar_url ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" /> : m.full_name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium text-sm text-lg-midnight block">{m.full_name}</span>
                        {m.birth_date && <span className="text-[10px] text-lg-text-muted">Nasc: {new Date(m.birth_date).toLocaleDateString("pt-BR")}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {isKidsTeam ? (
                      <div className="flex flex-col gap-0.5">
                        {m.allergies && <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded-sm inline-block w-fit">⚠️ {m.allergies}</span>}
                        {m.medical_notes && <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-1 py-0.5 rounded-sm inline-block w-fit truncate max-w-[150px]">{m.medical_notes}</span>}
                        {!m.allergies && !m.medical_notes && <span className="text-xs text-lg-text-muted opacity-50">Sem restrições</span>}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        {m.email && <div className="flex items-center gap-1.5 text-xs text-lg-text-muted"><Mail className="w-3 h-3" /> {m.email}</div>}
                        {m.whatsapp && <div className="flex items-center gap-1.5 text-xs text-lg-text-muted"><Phone className="w-3 h-3" /> {m.whatsapp}</div>}
                        {!m.email && !m.whatsapp && <span className="text-xs text-lg-text-muted opacity-50">—</span>}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      m.status === "active" || m.status === "approved" ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}>
                      {m.status === "active" || m.status === "approved" ? "Ativo" : m.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleRemove(m.id)} disabled={isPending} className="text-lg-text-muted hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50" title="Remover">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ ATTENDANCE MODAL ═══ */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto border border-[var(--glass-border)]">
            <div className="p-5 border-b border-[var(--glass-border)] flex items-center justify-between bg-lg-mist">
              <h3 className="font-bold text-lg-midnight flex items-center gap-2" style={{ fontFamily: "var(--lg-font-heading)" }}>
                <ClipboardList className="w-5 h-5 text-lg-primary" />
                Registrar Presença
              </h3>
              <button onClick={() => setShowAttendanceModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-lg-text-muted" disabled={isPending}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Event selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-1.5 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" /> Reunião / Evento
                </label>
                {availableEvents.length > 0 ? (
                  <select
                    value={selectedEventKey}
                    onChange={e => handleEventChange(e.target.value)}
                    className="w-full px-4 py-2 bg-lg-off-white border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary"
                  >
                    {availableEvents.map(ev => {
                      const dateStr = new Date(ev.instance_date + "T12:00:00").toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' });
                      return (
                        <option key={`${ev.event_id}|${ev.instance_date}`} value={`${ev.event_id}|${ev.instance_date}`}>
                          {ev.title} — {dateStr}
                        </option>
                      )
                    })}
                  </select>
                ) : (
                  <div className="text-sm text-red-500 py-2">
                    Não há eventos cadastrados com data no passado.
                  </div>
                )}
              </div>

              {/* Member checklist */}
              {isLoadingExisting ? (
                <div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-lg-primary" /></div>
              ) : (() => {
                const selectedEvt = availableEvents.find(ev => `${ev.event_id}|${ev.instance_date}` === selectedEventKey);
                const displayMembers = selectedEvt?.target_members?.length
                  ? members.filter(m => selectedEvt.target_members!.includes(m.id))
                  : members;
                
                return (
                  <div className="max-h-64 overflow-y-auto space-y-1 border border-[var(--glass-border)] rounded-xl p-2">
                    {displayMembers.map(m => (
                      <label key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-lg-off-white cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={checkedIds.has(m.id)}
                        onChange={() => toggleMember(m.id)}
                        className="w-4 h-4 rounded text-lg-primary focus:ring-lg-primary border-gray-300"
                      />
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-lg-primary to-lg-secondary flex items-center justify-center text-white font-bold text-[9px] overflow-hidden shrink-0">
                        {m.avatar_url ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" /> : m.full_name?.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-lg-midnight truncate">{m.full_name}</span>
                    </label>
                  ))}
                  </div>
                );
              })()}

              {/* Visitors */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-2">Visitantes</p>
                {visitors.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={v.name}
                      onChange={e => { const next = [...visitors]; next[i].name = e.target.value; setVisitors(next); }}
                      placeholder="Nome"
                      className="flex-1 px-3 py-1.5 bg-lg-off-white border border-[var(--glass-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary"
                    />
                    <input
                      type="text"
                      value={v.whatsapp}
                      onChange={e => { const next = [...visitors]; next[i].whatsapp = e.target.value; setVisitors(next); }}
                      placeholder="WhatsApp"
                      className="w-32 px-3 py-1.5 bg-lg-off-white border border-[var(--glass-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary"
                    />
                    <button type="button" onClick={() => setVisitors(visitors.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 p-1"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setVisitors([...visitors, { name: "", whatsapp: "" }])}
                  className="text-xs text-lg-primary font-medium flex items-center gap-1 hover:underline mt-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Adicionar visitante
                </button>
              </div>
            </div>

            <div className="p-5 border-t border-[var(--glass-border)] flex justify-between items-center">
              <p className="text-xs text-lg-text-muted">{checkedIds.size} presentes • {visitors.filter(v => v.name.trim()).length} visitantes</p>
              <div className="flex gap-3">
                <button onClick={() => setShowAttendanceModal(false)} disabled={isPending} className="px-4 py-2 rounded-xl text-sm font-medium text-lg-text-muted hover:bg-lg-mist">Cancelar</button>
                <button onClick={handleSaveAttendance} disabled={isPending} className="btn-primary px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MEMBER MODAL ═══ */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto border border-[var(--glass-border)]">
            <div className="p-5 border-b border-[var(--glass-border)] flex items-center justify-between bg-lg-mist">
              <h3 className="font-bold text-lg-midnight flex items-center gap-2" style={{ fontFamily: "var(--lg-font-heading)" }}>
                {isKidsTeam ? <Baby className="w-5 h-5 text-lg-primary" /> : <UserPlus className="w-5 h-5 text-lg-primary" />}
                Adicionar {isKidsTeam ? "Criança" : "Liderado"}
              </h3>
              <button onClick={() => setShowMemberModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-lg-text-muted" disabled={isPending}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form action={handleCreateMember} className="p-6">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">{formError}</p>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-1.5">Nome Completo <span className="text-red-500">*</span></label>
                  <input type="text" name="full_name" required className="w-full px-4 py-2 bg-lg-off-white border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary" placeholder="Nome completo..." />
                </div>
                {isKidsTeam ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-1.5">Alergias</label>
                      <input type="text" name="allergies" className="w-full px-4 py-2 bg-lg-off-white border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary" placeholder="Ex: Amendoim..." />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-1.5">Observações Médicas</label>
                      <input type="text" name="medical_notes" className="w-full px-4 py-2 bg-lg-off-white border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary" placeholder="Condições..." />
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-1.5">WhatsApp</label>
                      <input type="text" name="whatsapp" className="w-full px-4 py-2 bg-lg-off-white border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary" placeholder="(00) 00000-0000" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-1.5">Email</label>
                      <input type="email" name="email" className="w-full px-4 py-2 bg-lg-off-white border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary" placeholder="email@exemplo.com" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-1.5">Data de Nascimento</label>
                  <input type="date" name="birth_date" className="w-full px-4 py-2 bg-lg-off-white border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary" />
                </div>
                {!isKidsTeam && (
                  <label className="flex items-center gap-3 p-3 border border-[var(--glass-border)] rounded-xl cursor-pointer hover:bg-lg-mist transition-colors">
                    <input type="checkbox" name="is_baptized" value="true" className="w-4 h-4 rounded text-lg-primary focus:ring-lg-primary border-gray-300" />
                    <span className="text-sm font-medium text-lg-midnight">Já é batizado(a)?</span>
                  </label>
                )}
                <p className="text-xs text-lg-text-muted">* Será vinculado automaticamente a você.</p>
              </div>
              <div className="mt-6 pt-5 border-t border-[var(--glass-border)] flex justify-end gap-3">
                <button type="button" onClick={() => setShowMemberModal(false)} disabled={isPending} className="px-5 py-2.5 rounded-xl text-sm font-medium text-lg-text-muted hover:bg-lg-mist">Cancelar</button>
                <button type="submit" disabled={isPending} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
