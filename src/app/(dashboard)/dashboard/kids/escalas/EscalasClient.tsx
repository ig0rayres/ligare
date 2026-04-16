"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Plus, CalendarClock, Trash2, Loader2, Users, DoorOpen, CheckCircle2, UserPlus, Download
} from "lucide-react";

interface Staff { id: string; profile_id: string; role: string; confirmed: boolean; classroom: { id: string; name: string } | null; profile: { id: string; full_name: string } }
interface Schedule { id: string; service_date: string; support_materials?: string[] | null; support_material_text?: string | null; notes: string | null; staff: Staff[]; event: { id: string; title: string; starts_at: string }; event_id: string }
interface Classroom { id: string; name: string }
interface Member { id: string; full_name: string; phone: string | null }
interface EventData { id: string; title: string; starts_at: string; recurrence_type: string; recurrence_day: string; scope: string }

export default function EscalasClient({ schedules, classrooms, members, events }: { schedules: Schedule[]; classrooms: Classroom[]; members: Member[]; events: EventData[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [staffRows, setStaffRows] = useState<Array<{ profile_id: string; role: string; classroom_id: string | null }>>([]);
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [supportFiles, setSupportFiles] = useState<File[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  function addStaff() {
    setStaffRows([...staffRows, { profile_id: "", role: "kids_leader", classroom_id: "" }]);
  }

  function removeStaff(i: number) {
    setStaffRows(staffRows.filter((_, idx) => idx !== i));
  }

  function updateStaff(i: number, field: string, value: string) {
    const updated = [...staffRows];
    (updated[i] as any)[field] = value;
    setStaffRows(updated);
  }

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (supportFiles.length > 5) {
      setFormError("Você pode enviar no máximo 5 arquivos de material.");
      return;
    }

    // validate size
    for (const file of supportFiles) {
      if (file.size > 20 * 1024 * 1024) {
        setFormError(`O arquivo ${file.name} excede o limite de 20MB.`);
        return;
      }
    }

    setFormError("Processando envio, por favor aguarde...");
    
    let formData = new FormData(form);
    
    // Process image compressions individually
    if (supportFiles.length > 0) {
      formData.delete("support_material_files");
      const { compressImage } = await import("@/lib/image/compress");
      
      for (const file of supportFiles) {
        if (file.type.startsWith("image/")) {
          const compressed = await compressImage(file);
          formData.append("support_material_files", compressed);
        } else {
          formData.append("support_material_files", file);
        }
      }
    }

    await handleCreate(formData);
  }

  async function handleCreate(formData: FormData) {
    setFormError(null);
    const validStaff = staffRows.filter((s) => s.profile_id);
    if (!validStaff.some((s) => s.role === "kids_leader")) {
      setFormError("Cada escala precisa de ao menos 1 Líder Kids.");
      return;
    }
    formData.set("staff", JSON.stringify(validStaff));
    
    // Validate with user before sending notifications
    const eventEl = document.querySelector('select[name="event_id"]') as HTMLSelectElement;
    const evtName = eventEl?.options[eventEl.selectedIndex]?.text || "este evento";
    
    const isConfirmed = window.confirm(
      `Revise a Escala:\n- Data: ${selectedDate.split("-").reverse().join("/")}\n- Evento: ${evtName}\n- Equipe: ${validStaff.length} voluntários com salas distribuídas.\n\nClique em OK para salvar e notificar a equipe via WhatsApp.`
    );
    
    if (!isConfirmed) return;

    startTransition(async () => {
      try {
        const { createSchedule } = await import("../actions");
        await createSchedule(formData);
        setShowModal(false);
        setStaffRows([]);
        setSupportFiles([]);
        router.refresh();
      } catch (e: any) {
        setFormError(e.message);
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta escala?")) return;
    startTransition(async () => {
      const { deleteSchedule } = await import("../actions");
      await deleteSchedule(id);
      router.refresh();
    });
  }

  const groupedByDateAndEvent = schedules.reduce<Record<string, Record<string, Schedule[]>>>((acc, s) => {
    if(!s.event || !s.service_date) return acc;
    if (!acc[s.service_date]) acc[s.service_date] = {};
    if (!acc[s.service_date][s.event.id]) acc[s.service_date][s.event.id] = [];
    acc[s.service_date][s.event.id].push(s);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDateAndEvent).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Filter events by selected date for the modal
  const applicableEvents = events.filter(evt => {
    const selDate = new Date(selectedDate + "T12:00:00"); // Avoid timezone shift
    if (evt.recurrence_type === "once") {
      return evt.starts_at.startsWith(selectedDate);
    }
    if (evt.recurrence_type === "weekly") {
      return evt.recurrence_day === selDate.getDay().toString();
    }
    if (evt.recurrence_type === "monthly") {
      return evt.recurrence_day === selDate.getDate().toString();
    }
    return false;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
            Escalas de Voluntários
          </h2>
          <p className="text-sm text-lg-text-muted">Organize quem serve em cada sala por culto.</p>
        </div>
        <button onClick={() => { setShowModal(true); setStaffRows([{ profile_id: "", role: "kids_leader", classroom_id: "" }]); }}
          className="btn px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 text-white bg-lg-care border-none hover:bg-opacity-90">
          <Plus className="w-4 h-4" /> Nova Escala
        </button>
      </div>

      {/* Schedule List by Date -> Event */}
      {sortedDates.length === 0 ? (
        <div className="card text-center p-12">
          <CalendarClock className="w-10 h-10 text-lg-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm text-lg-text-muted">Nenhuma escala criada.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((dateStr) => (
            <div key={dateStr} className="space-y-4">
              <h3 className="text-sm font-bold text-lg-midnight uppercase tracking-wider bg-lg-mist px-4 py-2 rounded-lg border border-[var(--glass-border)] inline-block">
                📅 {new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
              </h3>
              
              <div className="space-y-6">
                {Object.keys(groupedByDateAndEvent[dateStr]).map(eventId => {
                  const eventSchedules = groupedByDateAndEvent[dateStr][eventId];
                  const firstEvt = eventSchedules[0].event;
                  const eventTime = new Date(firstEvt.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

                  // Re-group staff by classroom to show in cards within the Event
                  const staffByClassroom: Record<string, { staff: Staff[], name: string, schedId: string }> = {};
                  eventSchedules.forEach(sched => {
                     (sched.staff || []).forEach(st => {
                        const classKey = st.classroom?.id || "geral";
                        if (!staffByClassroom[classKey]) {
                           staffByClassroom[classKey] = { staff: [], name: st.classroom?.name || "Apoio Geral", schedId: sched.id };
                        }
                        staffByClassroom[classKey].staff.push(st);
                     });
                  });

                  return (
                    <div key={eventId} className="pl-4 border-l-2 border-lg-care">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-lg-midnight flex items-center gap-2">
                          <CalendarClock className="w-4 h-4 text-lg-care" />
                          {firstEvt.title} <span className="font-normal text-xs text-lg-text-muted bg-white px-2 py-0.5 rounded shadow-sm border border-[var(--glass-border)] ml-2">às {eventTime}</span>
                        </h4>
                        <div className="flex items-center gap-2">
                            <a 
                              href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=Ministério+Kids+-+${encodeURIComponent(firstEvt.title)}&dates=${dateStr.replace(/-/g, '')}T${new Date(firstEvt.starts_at).toISOString().split('T')[1].replace(/[:.-]/g, '').slice(0,6)}Z/${dateStr.replace(/-/g, '')}T${new Date(new Date(firstEvt.starts_at).getTime() + 2*60*60*1000).toISOString().split('T')[1].replace(/[:.-]/g, '').slice(0,6)}Z&details=Equipe+Kids`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-xs flex items-center gap-1 text-blue-500 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md transition-colors"
                              title="Adicionar ao Google Calendar"
                            >
                              <CalendarClock className="w-3 h-3" /> GCal
                            </a>
                            <button onClick={() => handleDelete(eventSchedules[0].id)} disabled={isPending}
                              className="text-xs flex items-center gap-1 text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded-md transition-colors" title="Excluir Escala Inteira">
                              <Trash2 className="w-3 h-3" /> Excluir
                            </button>
                        </div>
                      </div>

                      <div className="mb-3 space-y-1">
                        {eventSchedules[0]?.notes && <p className="text-xs text-lg-text-muted italic">"{eventSchedules[0].notes}"</p>}
                        {eventSchedules[0]?.support_material_text && <p className="text-xs text-lg-midnight font-medium">📖 {eventSchedules[0].support_material_text}</p>}
                        {eventSchedules[0]?.support_materials && eventSchedules[0].support_materials.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {eventSchedules[0].support_materials.map((url, idx) => (
                              <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] bg-lg-care bg-opacity-10 text-lg-care px-2 py-1 rounded-md hover:bg-opacity-20 transition-colors">
                                <Download className="w-3 h-3" /> Material {idx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.keys(staffByClassroom).length === 0 ? (
                           <div className="col-span-full py-4 text-xs text-lg-text-muted text-center border border-dashed rounded-xl">Sem voluntários escalados.</div>
                        ) : Object.keys(staffByClassroom).map((classId) => (
                          <div key={classId} className="card p-4 group hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <DoorOpen className="w-4 h-4 text-lg-slate" />
                                <span className="font-semibold text-sm text-lg-midnight">{staffByClassroom[classId].name}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-1.5">
                              {staffByClassroom[classId].staff.map((s) => (
                                <div key={s.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-lg-off-white border border-[var(--glass-border)]">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${s.role === "kids_leader" ? "bg-lg-care" : "bg-lg-slate"}`}>
                                      {s.profile?.full_name?.charAt(0) || '?'}
                                    </div>
                                    <span className="text-xs text-lg-midnight font-medium">{s.profile?.full_name?.split(' ')[0]} {s.profile?.full_name?.split(' ')[1]?.[0] || ''}.</span>
                                  </div>
                                  <span className={`text-[10px] font-bold tracking-tight px-1.5 py-0.5 rounded ${s.role === "kids_leader" ? "text-green-700 bg-green-100" : "text-gray-600 bg-gray-200"}`}>
                                    {s.role === "kids_leader" ? "LDR" : "AUX"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-lg-midnight mb-4" style={{ fontFamily: "var(--lg-font-heading)" }}>
              <CalendarClock className="w-5 h-5 inline mr-2 text-lg-care" />
              Nova Escala
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-lg-text-muted mb-1">Data da Escala *</label>
                  <input type="date" name="service_date" required value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white/50 border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-care" />
                </div>
                <div>
                  <label className="flex items-center justify-between text-xs font-medium text-lg-text-muted mb-1">
                    <span>Evento *</span>
                    <button type="button" onClick={() => setShowCreateEvent(true)} className="text-lg-care hover:underline border-none bg-transparent p-0 text-[10px]">
                      Criar Evento Rápido
                    </button>
                  </label>
                  <select name="event_id" required
                    className="w-full px-4 py-2 bg-white/50 border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-care">
                    <option value="">Selecione o Evento...</option>
                    {applicableEvents.length === 0 && <option disabled>Nenhum evento neste dia!</option>}
                    {applicableEvents.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.title} ({new Date(evt.starts_at).toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'})})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-lg-text-muted mb-1">Notas Gerais (Opcional)</label>
                <input type="text" name="notes" placeholder="Ex: Lembre-se do dia do pijama..."
                  className="w-full px-4 py-2 bg-white/50 border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-care" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[var(--glass-border)] pt-4 mt-4">
                <div>
                  <label className="block text-xs font-medium text-lg-text-muted mb-1">
                    Material de Apoio / PDF (Opcional, Máx 5)
                  </label>
                  <input type="file" accept=".pdf,image/*" multiple
                    onChange={(e) => {
                      const newFiles = Array.from(e.target.files || []);
                      if (supportFiles.length + newFiles.length > 5) {
                        alert("Você só pode enviar até 5 arquivos no total.");
                        return;
                      }
                      setSupportFiles(prev => [...prev, ...newFiles]);
                      e.target.value = ""; // reset so they can select again
                    }}
                    className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-lg-care file:text-white hover:file:brightness-110 transition-all cursor-pointer text-lg-text-muted" />
                  
                  {supportFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {supportFiles.map((f, i) => (
                        <div key={i} className="flex flex-wrap items-center justify-between text-xs bg-lg-off-white px-2 py-1 rounded text-lg-midnight overflow-hidden text-ellipsis">
                          <span className="truncate max-w-[80%]">{f.name}</span>
                          <button type="button" onClick={() => setSupportFiles(supportFiles.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 p-0.5">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-lg-text-muted mt-1 block">Lim.: 20MB por arq. Imagens comprimidas auto.</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-lg-text-muted mb-1">Texto/Versículos (Opcional)</label>
                  <textarea name="support_material_text" rows={2} placeholder="Ex: Lucas 2:40..."
                    className="w-full px-4 py-2 bg-white/50 border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-care resize-none"></textarea>
                </div>
              </div>

              {/* Staff */}
              <div>
                <div className="flex items-center justify-between mb-2 mt-4 border-t border-[var(--glass-border)] pt-4">
                  <label className="text-xs font-medium text-lg-text-muted">Equipe do Evento</label>
                  <button type="button" onClick={addStaff} className="text-xs text-lg-care font-bold hover:bg-lg-off-white px-2 py-1 rounded bg-white flex items-center gap-1 transition-colors border border-[var(--glass-border)]">
                    <UserPlus className="w-3 h-3" /> Adicionar Voluntário
                  </button>
                </div>
                <div className="space-y-2">
                  {staffRows.map((s, i) => (
                    <div key={i} className="flex gap-2 items-center p-2 rounded-xl bg-lg-off-white border border-[var(--glass-border)] shadow-sm">
                      <select value={s.profile_id} onChange={(e) => updateStaff(i, "profile_id", e.target.value)}
                        className="flex-[2] px-3 py-1.5 bg-white border border-[var(--glass-border)] rounded-lg text-xs font-medium text-lg-midnight focus:border-lg-care">
                        <option value="">Selecione...</option>
                        {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                      </select>
                      <select value={s.role} onChange={(e) => updateStaff(i, "role", e.target.value)}
                        className="flex-1 px-2 py-1.5 bg-white border border-[var(--glass-border)] rounded-lg text-xs font-medium text-lg-midnight focus:border-lg-care">
                        <option value="kids_leader">Líder</option>
                        <option value="auxiliar">Auxiliar</option>
                      </select>
                      <select value={(s as any).classroom_id || ""} onChange={(e) => updateStaff(i, "classroom_id", e.target.value)}
                        className="flex-[1.5] px-2 py-1.5 bg-white border border-[var(--glass-border)] rounded-lg text-xs font-medium text-lg-midnight focus:border-lg-care">
                        <option value="">Apoio Geral</option>
                        {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <button type="button" onClick={() => removeStaff(i)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {staffRows.length === 0 && (
                    <div className="text-center py-6 border border-dashed border-[var(--glass-border)] rounded-xl bg-white/50">
                      <p className="text-xs text-lg-text-muted">Adicione voluntários e vincule as salas.</p>
                    </div>
                  )}
                </div>
              </div>

              {formError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setStaffRows([]); }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--glass-border)] hover:bg-lg-off-white">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-lg-care flex justify-center items-center gap-2 disabled:opacity-60 border-none hover:bg-opacity-90">
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</> : "Criar Escala"}
                </button>
              </div>
            </form>

            {/* Sub-modal: Quick Create Event */}
            {showCreateEvent && (
              <div className="absolute inset-0 bg-white z-10 p-6 flex flex-col h-full rounded-2xl animate-slide-up">
                <h3 className="text-lg font-bold text-lg-midnight mb-4" style={{ fontFamily: "var(--lg-font-heading)" }}>
                  <CalendarClock className="w-5 h-5 inline mr-2 text-lg-care" />
                  Criar Evento Kids Rápido
                </h3>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    startTransition(async () => {
                      try {
                        const formData = new FormData(e.currentTarget);
                        const date = formData.get("starts_at_date") as string;
                        const time = formData.get("starts_at_time") as string;
                        const localDate = new Date(`${date}T${time}:00`);
                        formData.set("starts_at", localDate.toISOString()); // Proper ISO for backend
                        
                        const rType = formData.get("recurrence_type") as string;
                        if (rType === "weekly") {
                          formData.set("recurrence_day", localDate.getDay().toString());
                        } else if (rType === "monthly") {
                          formData.set("recurrence_day", localDate.getDate().toString());
                        }

                        const { createEvent } = await import("../../events/actions");
                        await createEvent(formData);
                        setShowCreateEvent(false);
                      } catch (err: any) {
                        alert(err.message || "Erro ao criar evento");
                      }
                    });
                  }} 
                  className="space-y-4 flex-1 flex flex-col"
                >
                  <input type="hidden" name="scope" value="kids" />
                  
                  <div>
                    <label className="block text-xs font-medium text-lg-text-muted mb-1">Título do Culto *</label>
                    <input type="text" name="title" required placeholder="Culto Kids Dominical"
                      className="w-full px-4 py-2 bg-white border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-care" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-lg-text-muted mb-1">Data *</label>
                      <input type="date" name="starts_at_date" required defaultValue={selectedDate}
                        className="w-full px-4 py-2 bg-white border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-care" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-lg-text-muted mb-1">Horário *</label>
                      <input type="time" name="starts_at_time" required defaultValue="10:00"
                        className="w-full px-4 py-2 bg-white border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-care" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-lg-text-muted mb-1">Recorrência *</label>
                    <select name="recurrence_type" required defaultValue="once"
                      className="w-full px-4 py-2 bg-white border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-care">
                      <option value="once">Acontece apenas uma vez</option>
                      <option value="weekly">Semanalmente</option>
                      <option value="monthly">Mensalmente</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4 mt-auto">
                    <button type="button" onClick={() => setShowCreateEvent(false)}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--glass-border)] hover:bg-lg-off-white">
                      Voltar
                    </button>
                    <button type="submit" disabled={isPending}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-lg-care flex justify-center items-center gap-2 disabled:opacity-60 border-none hover:bg-opacity-90">
                      {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Concluir Evento"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
