"use client";

import { useState, useTransition, useRef } from "react";
import { CalendarDays, CalendarSync, MapPin, Plus, Trash2, X, Clock, ArrowRight, AlertCircle, Pencil, Bell, Image as ImageIcon, Send, Smartphone, MessageCircle } from "lucide-react";
import { createEvent, deleteEvent, updateEvent, notifyEvent } from "./actions";
import { toast } from "sonner";
import { compressFormDataImage } from "@/lib/image/compress";
import ImageCropper from "@/components/ui/ImageCropper";

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  scope: string;
  recurrence_type: string;
  recurrence_day: string | null;
  target_members?: string[] | null;
}

interface Props {
  events: Event[];
  callerRole: "admin" | "leader" | "kids_team";
  churchRoles?: { id: string; name: string; permissions_level: string }[];
  cellMembers?: { id: string; name: string }[];
}

const AVAILABLE_ROLES = [
  { value: "leader", label: "Líderes" },
  { value: "kids_team", label: "Kids Team" },
  { value: "member", label: "Membros" },
  { value: "admin", label: "Administradores" },
];

const WEEKDAY_NAMES: Record<string, string> = {
  "0": "Domingo", "1": "Segunda-feira", "2": "Terça-feira",
  "3": "Quarta-feira", "4": "Quinta-feira", "5": "Sexta-feira", "6": "Sábado",
};

export default function EventsClient({ events, callerRole, churchRoles = [], cellMembers = [] }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [notifyEventData, setNotifyEventData] = useState<Event | null>(null);
  const [recurrence, setRecurrence] = useState<"once" | "weekly" | "monthly">("once");
  const [formError, setFormError] = useState<string | null>(null);

  // Notify modal state
  const [notifyApp, setNotifyApp] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [croppedImageFile, setCroppedImageFile] = useState<File | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  // Targeting state
  const [targetLevel, setTargetLevel] = useState<"all" | "specific">("all");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  function openCreateModal() {
    setFormError(null);
    setRecurrence("once");
    setTargetLevel("all");
    setSelectedMembers([]);
    setShowCreateModal(true);
  }

  function openEditModal(evt: Event) {
    setFormError(null);
    setRecurrence(evt.recurrence_type as "once" | "weekly" | "monthly");
    setTargetLevel(evt.target_members && evt.target_members.length > 0 ? "specific" : "all");
    setSelectedMembers(evt.target_members || []);
    setEditEvent(evt);
  }

  function openNotifyModal(evt: Event) {
    setFormError(null);
    setNotifyApp(true);
    setNotifyWhatsapp(false);
    setSelectedRoles([]);
    setImagePreview(null);
    setNotifyEventData(evt);
  }

  function toggleRole(role: string) {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  }

  function toggleSelectedMember(memberId: string) {
    setSelectedMembers(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setCropSrc(URL.createObjectURL(file));
    }
  }

  async function handleCreate(formData: FormData) {
    setFormError(null);
    startTransition(async () => {
      try {
        await createEvent(formData);
        toast.success("Evento criado com sucesso!");
        setShowCreateModal(false);
      } catch (e: any) {
        setFormError(e.message);
      }
    });
  }

  async function handleUpdate(formData: FormData) {
    if (!editEvent) return;
    setFormError(null);
    startTransition(async () => {
      try {
        await updateEvent(editEvent.id, formData);
        toast.success("Evento atualizado!");
        setEditEvent(null);
      } catch (e: any) {
        setFormError(e.message);
      }
    });
  }

  async function handleNotify(formData: FormData) {
    if (!notifyEventData) return;
    setFormError(null);
    formData.set("notifyApp", notifyApp ? "true" : "false");
    formData.set("notifyWhatsapp", notifyWhatsapp ? "true" : "false");
    formData.set("targetRoles", selectedRoles.join(","));
    startTransition(async () => {
      try {
        if (croppedImageFile) {
          formData.set("image", croppedImageFile);
        }
        await compressFormDataImage(formData, "image");
        await notifyEvent(notifyEventData.id, formData);
        toast.success("Notificação enviada com sucesso!");
        setNotifyEventData(null);
      } catch (e: any) {
        setFormError(e.message);
      }
    });
  }

  // Shared form fields for Create/Edit modal
  function renderEventForm(isEdit: boolean, initialData?: Event) {
    const startsAtDefault = initialData
      ? new Date(initialData.starts_at).toISOString().slice(0, 16)
      : undefined;

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-1.5">
            Título <span className="text-red-500">*</span>
          </label>
          <input type="text" name="title" required className="input" placeholder="Culto de Domingo, Célula, etc..." defaultValue={initialData?.title || ""} />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-1.5">Tipo do Evento</label>
          <div className="grid grid-cols-3 gap-2">
            {(["once", "weekly", "monthly"] as const).map(type => (
              <button key={type} type="button" onClick={() => setRecurrence(type)}
                className={`border rounded-lg py-2 px-3 text-sm font-medium transition-colors ${recurrence === type ? 'bg-lg-primary border-[var(--lg-primary)] text-white shadow-md' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                {type === "once" ? "Único" : type === "weekly" ? "Semanal" : "Mensal"}
              </button>
            ))}
          </div>
          <input type="hidden" name="recurrence_type" value={recurrence} />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-1.5">
            {recurrence === 'once' ? 'Data e Hora do Evento' : 'Data e Hora do PRIMEIRO Encontro'} <span className="text-red-500">*</span>
          </label>
          <input type="datetime-local" name="starts_at" required className="input" defaultValue={startsAtDefault} />
        </div>

        {recurrence === 'weekly' && (
          <div className="bg-lg-mist p-3 rounded-xl border border-[var(--glass-border)]">
            <label className="block text-xs font-semibold uppercase tracking-wider text-lg-primary mb-1.5">Repete toda semana, no dia:</label>
            <select name="recurrence_day" className="input bg-white" required defaultValue={initialData?.recurrence_day || "1"}>
              <option value="0">Domingo</option>
              <option value="1">Segunda-feira</option>
              <option value="2">Terça-feira</option>
              <option value="3">Quarta-feira</option>
              <option value="4">Quinta-feira</option>
              <option value="5">Sexta-feira</option>
              <option value="6">Sábado</option>
            </select>
          </div>
        )}

        {recurrence === 'monthly' && (
          <div className="bg-lg-mist p-3 rounded-xl border border-[var(--glass-border)]">
            <label className="block text-xs font-semibold uppercase tracking-wider text-lg-primary mb-1.5">Repete todo mês, no dia (1 a 31):</label>
            <input type="number" name="recurrence_day" required min="1" max="31" className="input bg-white" placeholder="Dia do mês (ex: 15)" defaultValue={initialData?.recurrence_day || ""} />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-1.5">Descrição Curta (Opcional)</label>
          <textarea name="description" rows={2} className="input resize-none" placeholder="Detalhes ou pautas..." defaultValue={initialData?.description || ""} />
        </div>

        {callerRole !== 'admin' && (
          <div className="pt-2 border-t border-[var(--glass-border)]">
            <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mt-2 mb-2">Público do Evento (Presença)</label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center justify-center gap-2 text-sm cursor-pointer border px-3 py-2 rounded-lg bg-lg-off-white border-[var(--glass-border)] w-1/2 transition-colors">
                <input type="radio" name="targetLevel" value="all" checked={targetLevel === "all"} onChange={() => setTargetLevel("all")} className="text-lg-primary focus:ring-lg-primary" />
                <span className="font-medium text-lg-midnight">Toda a equipe</span>
              </label>
              <label className="flex items-center justify-center gap-2 text-sm cursor-pointer border px-3 py-2 rounded-lg bg-lg-off-white border-[var(--glass-border)] w-1/2 transition-colors">
                <input type="radio" name="targetLevel" value="specific" checked={targetLevel === "specific"} onChange={() => setTargetLevel("specific")} className="text-lg-primary focus:ring-lg-primary" />
                <span className="font-medium text-lg-midnight">Membros Específicos</span>
              </label>
            </div>
            
            {targetLevel === "specific" && cellMembers && (
              <div className="bg-lg-mist p-3 rounded-xl border border-[var(--glass-border)] max-h-48 overflow-y-auto space-y-1">
                {cellMembers.length === 0 && <p className="text-xs text-gray-400 text-center py-2">Nenhum membro cadastrado.</p>}
                {cellMembers.map(m => (
                  <label key={m.id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                    <input 
                      type="checkbox" 
                      checked={selectedMembers.includes(m.id)} 
                      onChange={() => toggleSelectedMember(m.id)}
                      className="rounded text-lg-primary focus:ring-lg-primary w-4 h-4 border-gray-300" 
                    />
                    <span className="text-sm font-medium text-lg-midnight">{m.name}</span>
                  </label>
                ))}
              </div>
            )}
            <input type="hidden" name="target_members" value={targetLevel === "all" ? "" : JSON.stringify(selectedMembers)} />
          </div>
        )}

        {callerRole === 'admin' && (
          <div className="mt-4 pt-4 border-t border-[var(--glass-border)]">
            <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-1.5">
              Escopo do Evento
            </label>
            <select name="scope" className="input bg-white" defaultValue={initialData?.scope || "church"}>
              <option value="church">Global (Igreja)</option>
              <option value="kids">Kids (Ministério Infantil)</option>
              <option value="cell">Célula</option>
            </select>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-lg-midnight flex items-center gap-2" style={{ fontFamily: "var(--lg-font-heading)" }}>
              <CalendarDays className="w-6 h-6 text-lg-primary" />
              Cultos & Eventos
            </h1>
            <p className="text-sm text-lg-text-muted mt-1">
              {callerRole === 'admin'
                ? "Cadastre eventos e cultos globais para toda a igreja"
                : "Cadastre eventos e cultos para a sua célula/equipe"}
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="btn-primary px-5 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Novo Evento
          </button>
        </div>

        {/* EVENT LIST */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.length === 0 ? (
            <div className="col-span-full card p-10 text-center flex flex-col items-center justify-center border border-dashed border-gray-300 bg-lg-mist">
              <CalendarSync className="w-12 h-12 text-gray-400 mb-3" />
              <h3 className="font-bold text-gray-700 text-lg">Nenhum evento agendado</h3>
              <p className="text-sm text-gray-500 max-w-sm mt-1 mb-4">
                Eventos e cultos criados aparecerão aqui e estarão disponíveis para o registro de presença dos membros no painel de líderes.
              </p>
              <button onClick={openCreateModal} className="btn-primary text-sm px-4 py-2">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Evento
              </button>
            </div>
          ) : (
            events.map((evt) => {
              const isRecurring = evt.recurrence_type !== "once";
              return (
                <div key={evt.id} className="card p-5 hover:shadow-lg transition-shadow relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-3">
                    <div className={`p-2.5 rounded-xl bg-lg-mist text-lg-primary`}>
                      {isRecurring ? <CalendarSync className="w-5 h-5" /> : <CalendarDays className="w-5 h-5" />}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${evt.scope === 'kids' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                        {evt.scope === 'church' ? 'Global' : evt.scope === 'kids' ? 'Kids' : 'Célula'}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg-midnight text-lg line-clamp-1 mb-1" style={{ fontFamily: "var(--lg-font-heading)" }}>
                    {evt.title}
                  </h3>
                  {evt.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{evt.description}</p>}

                  <div className="space-y-2 mt-4 pt-4 border-t border-[var(--glass-border)]">
                    {isRecurring ? (
                      <div className="flex items-center gap-2 text-sm text-lg-midnight bg-lg-mist border border-[var(--glass-border)] rounded-lg px-3 py-2">
                        <CalendarSync className="w-4 h-4 opacity-70 shrink-0 text-lg-primary" />
                        <span className="font-medium">
                          Repete {evt.recurrence_type === 'weekly'
                            ? `toda semana (${WEEKDAY_NAMES[evt.recurrence_day || "1"] || evt.recurrence_day})`
                            : `todo mês (Dia ${evt.recurrence_day})`}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-lg-midnight bg-lg-mist border border-[var(--glass-border)] rounded-lg px-3 py-2">
                        <Clock className="w-4 h-4 opacity-70 shrink-0 text-lg-primary" />
                        <span className="font-medium">
                          Evento Único: {new Date(evt.starts_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                    {evt.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 px-1">
                        <MapPin className="w-4 h-4 opacity-70 shrink-0" />
                        <span className="truncate">{evt.location}</span>
                      </div>
                    )}
                  </div>

                  {/* ACTION BUTTONS */}
                  {(callerRole === 'admin' || evt.scope === 'cell' || (callerRole === 'kids_team' && evt.scope === 'kids')) && (
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--glass-border)]">
                      <button
                        onClick={() => openEditModal(evt)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-lg-primary bg-lg-primary-light hover:bg-lg-primary hover:text-white transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => openNotifyModal(evt)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-lg-midnight bg-gray-50 border border-gray-200 hover:bg-lg-primary hover:text-white hover:border-[var(--lg-primary)] transition-colors"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        Notificar
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir este evento?")) {
                            startTransition(() => deleteEvent(evt.id));
                          }
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══ CREATE MODAL ═══ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex justify-center items-start pt-10 pb-20 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-[var(--glass-border)]">
            <div className="p-5 border-b border-[var(--glass-border)] flex items-center justify-between bg-lg-mist">
              <h3 className="font-bold text-lg-midnight flex items-center gap-2" style={{ fontFamily: "var(--lg-font-heading)" }}>
                <CalendarDays className="w-5 h-5 text-lg-primary" />
                Novo Evento / Culto
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-lg-text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form action={handleCreate} className="p-6">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">{formError}</p>
                </div>
              )}
              {renderEventForm(false)}
              <div className="mt-6 pt-5 border-t border-[var(--glass-border)] flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} disabled={isPending} className="px-5 py-2.5 rounded-xl text-sm font-medium text-lg-text-muted hover:bg-lg-mist transition-colors">Cancelar</button>
                <button type="submit" disabled={isPending} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-all hover:shadow-md disabled:opacity-50 flex items-center gap-2">
                  {isPending ? "Salvando..." : "Criar Evento"}
                  {!isPending && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ EDIT MODAL ═══ */}
      {editEvent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex justify-center items-start pt-10 pb-20 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-[var(--glass-border)]">
            <div className="p-5 border-b border-[var(--glass-border)] flex items-center justify-between bg-lg-mist">
              <h3 className="font-bold text-lg-midnight flex items-center gap-2" style={{ fontFamily: "var(--lg-font-heading)" }}>
                <Pencil className="w-5 h-5 text-lg-primary" />
                Editar Evento
              </h3>
              <button onClick={() => setEditEvent(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-lg-text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form action={handleUpdate} className="p-6">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">{formError}</p>
                </div>
              )}
              {renderEventForm(true, editEvent)}
              <div className="mt-6 pt-5 border-t border-[var(--glass-border)] flex justify-end gap-3">
                <button type="button" onClick={() => setEditEvent(null)} disabled={isPending} className="px-5 py-2.5 rounded-xl text-sm font-medium text-lg-text-muted hover:bg-lg-mist transition-colors">Cancelar</button>
                <button type="submit" disabled={isPending} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-all hover:shadow-md disabled:opacity-50 flex items-center gap-2">
                  {isPending ? "Salvando..." : "Salvar Alterações"}
                  {!isPending && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ NOTIFY MODAL ═══ */}
      {notifyEventData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex justify-center items-start pt-10 pb-20 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-[var(--glass-border)]">
            <div className="p-5 border-b border-[var(--glass-border)] flex items-center justify-between bg-lg-mist">
              <h3 className="font-bold text-lg-midnight flex items-center gap-2" style={{ fontFamily: "var(--lg-font-heading)" }}>
                <Bell className="w-5 h-5 text-lg-primary" />
                Notificar sobre: {notifyEventData.title}
              </h3>
              <button onClick={() => setNotifyEventData(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-lg-text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form action={handleNotify} className="p-6">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">{formError}</p>
                </div>
              )}

              <div className="space-y-5">
                {/* CANAIS */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-2">Canais de Envio <span className="text-red-500">*</span></label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setNotifyApp(!notifyApp)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${notifyApp ? 'border-[var(--lg-primary)] bg-lg-primary-light text-lg-primary shadow-sm' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                      <Smartphone className="w-4 h-4" />
                      App
                    </button>
                    <button type="button" onClick={() => setNotifyWhatsapp(!notifyWhatsapp)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${notifyWhatsapp ? 'border-[var(--lg-primary)] bg-lg-primary-light text-lg-primary shadow-sm' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </button>
                  </div>
                </div>

                {/* PERFIS / CARGOS */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-2">Enviar Para (Perfis)</label>
                  <div className="flex flex-wrap gap-2">
                    {churchRoles.map(role => (
                      <button key={role.id} type="button" onClick={() => toggleRole(role.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selectedRoles.includes(role.id) ? 'bg-lg-primary text-white border-[var(--lg-primary)] shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-gray-800'}`}>
                        {role.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5">Deixe vazio para enviar a todos</p>
                </div>

                {/* MENSAGEM */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-1.5">Mensagem <span className="text-red-500">*</span></label>
                  <textarea name="message" rows={4} required className="input resize-none" placeholder="Escreva sua mensagem de notificação..." />
                </div>

                {/* IMAGEM */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-1.5">Imagem (Opcional)</label>
                  <input ref={imageInputRef} type="file" name="image" accept="image/*" onChange={handleImageChange} className="hidden" />
                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-[var(--glass-border)]">
                      <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                      <button type="button" onClick={() => { setImagePreview(null); if (imageInputRef.current) imageInputRef.current.value = ''; }}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => imageInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 flex flex-col items-center gap-2 text-gray-400 hover:border-[var(--lg-primary)] hover:text-lg-primary transition-colors">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-xs font-medium">Clique para adicionar uma imagem</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-[var(--glass-border)] flex justify-end gap-3">
                <button type="button" onClick={() => setNotifyEventData(null)} disabled={isPending} className="px-5 py-2.5 rounded-xl text-sm font-medium text-lg-text-muted hover:bg-lg-mist transition-colors">Cancelar</button>
                <button type="submit" disabled={isPending || (!notifyApp && !notifyWhatsapp)} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-all hover:shadow-md disabled:opacity-50 flex items-center gap-2">
                  {isPending ? "Enviando..." : "Enviar Notificação"}
                  {!isPending && <Send className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Crop Modal */}
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          aspect={16 / 9}
          onCropComplete={(file) => {
            setCroppedImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setCropSrc(null);
          }}
          onCancel={() => setCropSrc(null)}
          outputFileName="event-image.webp"
        />
      )}
    </>
  );
}
