"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  Plus, Baby, Search, Trash2, Upload, Loader2, CheckCircle2, XCircle, AlertTriangle, Users, ChevronDown, QrCode, ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { compressFormDataImage } from "@/lib/image/compress";
import ImageCropper from "@/components/ui/ImageCropper";

interface Guardian { id: string; guardian_id: string; relationship: string; is_primary: boolean; guardian: { id: string; full_name: string; phone: string | null } }
interface Kid { id: string; full_name: string; birth_date: string | null; allergies: string | null; medical_notes: string | null; photo_url: string | null; qr_code?: string; image_rights_status?: string; status: string; is_active: boolean; classroom: { id: string; name: string } | null; guardians: Guardian[] }
interface Classroom { id: string; name: string }
interface Member { id: string; full_name: string; phone: string | null }

const relationships = ["Pai", "Mãe", "Avô", "Avó", "Tio(a)", "Padrinho/Madrinha", "Outro"];

export default function CriancasClient({ kids, classrooms, members }: { kids: Kid[]; classrooms: Classroom[]; members: Member[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localMembers, setLocalMembers] = useState<Member[]>(members);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [formError, setFormError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [qrModalKid, setQrModalKid] = useState<Kid | null>(null);
  const [guardianRows, setGuardianRows] = useState<Array<{ guardian_id: string; relationship: string; is_primary: boolean }>>([]);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const filtered = kids.filter((k) => {
    const matchSearch = k.full_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || k.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function addGuardianRow() {
    if (guardianRows.length >= 4) return;
    setGuardianRows([...guardianRows, { guardian_id: "", relationship: "Pai", is_primary: guardianRows.length === 0 }]);
  }

  function removeGuardianRow(index: number) {
    setGuardianRows(guardianRows.filter((_, i) => i !== index));
  }

  function updateGuardianRow(index: number, field: string, value: any) {
    const updated = [...guardianRows];
    (updated[index] as any)[field] = value;
    if (field === "is_primary") {
      updated.forEach((g, i) => { if (i !== index) g.is_primary = false; });
    }
    setGuardianRows(updated);
  }

  async function handleCreate(formData: FormData) {
    setFormError(null);
    formData.set("guardians", JSON.stringify(guardianRows.filter((g) => g.guardian_id)));
    if (croppedFile) {
      formData.set("photo", croppedFile);
    }
    startTransition(async () => {
      try {
        await compressFormDataImage(formData, "photo");
        const { createKid } = await import("../actions");
        await createKid(formData);
        toast.success("Criança cadastrada com sucesso!");
        setShowModal(false);
        setGuardianRows([]);
        setPreview(null);
        setCroppedFile(null);
        formRef.current?.reset();
        router.refresh();
      } catch (e: any) {
        setFormError(e.message);
        toast.error("Erro ao salvar criança");
      }
    });
  }

  async function handleQuickAdd(formData: FormData) {
    setQuickAddError(null);
    setIsQuickAdding(true);
    try {
      const { createQuickGuardian } = await import("../actions");
      const newGuardian = await createQuickGuardian(formData);
      
      // Update local members list
      const memberItem = { id: newGuardian.id, full_name: newGuardian.full_name, phone: newGuardian.phone };
      setLocalMembers((prev) => [...prev, memberItem].sort((a, b) => a.full_name.localeCompare(b.full_name)));
      
      // Select the new guardian in an empty row (or add one)
      let updatedRows = [...guardianRows];
      const emptyIndex = updatedRows.findIndex(g => !g.guardian_id);
      if (emptyIndex >= 0) {
        updatedRows[emptyIndex].guardian_id = newGuardian.id;
      } else if (updatedRows.length < 4) {
        updatedRows.push({ guardian_id: newGuardian.id, relationship: "Pai", is_primary: updatedRows.length === 0 });
      }
      setGuardianRows(updatedRows);
      
      setShowQuickAdd(false);
      toast.success("Responsável adicionado e selecionado!");
    } catch (e: any) {
      setQuickAddError(e.message);
      toast.error("Erro ao adicionar responsável rápido.");
    } finally {
      setIsQuickAdding(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta criança?")) return;
    startTransition(async () => {
      try {
        const { deleteKid } = await import("../actions");
        await deleteKid(id);
        toast.success("Criança excluída!");
        router.refresh();
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  async function handleStatusChange(id: string, status: "approved" | "rejected") {
    startTransition(async () => {
      try {
        const { updateKidStatus } = await import("../actions");
        await updateKidStatus(id, status);
        toast.success(status === 'approved' ? 'Criança aprovada!' : 'Criança rejeitada!');
        router.refresh();
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  const pendingCount = kids.filter((k) => k.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
            Crianças Cadastradas
          </h2>
          <p className="text-sm text-lg-text-muted">{kids.length} crianças no total</p>
        </div>
        <button onClick={() => { 
          setShowModal(true); 
          setGuardianRows([{ guardian_id: "", relationship: "Pai", is_primary: true }]); 
          setLocalMembers(members); // sync from props on open
        }}
          className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-md">
          <Plus className="w-4 h-4" /> Nova Criança
        </button>
      </div>

      {/* Pending notification */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">{pendingCount} cadastro(s) pendente(s) de aprovação</p>
            <p className="text-xs text-amber-600">Filtre por "Pendentes" para revisar.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lg-text-muted" />
          <input type="text" placeholder="Buscar criança..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 px-4 py-2 bg-white/50 border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-care" />
        </div>
        <div className="flex gap-2">
          {[
            { value: "all", label: "Todas" },
            { value: "approved", label: "Aprovadas" },
            { value: "pending", label: "Pendentes" },
          ].map((f) => (
            <button key={f.value} onClick={() => setFilterStatus(f.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${filterStatus === f.value ? "bg-lg-care text-white shadow-sm" : "bg-white/50 text-lg-text-muted border border-[var(--glass-border)] hover:bg-white"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kids List */}
      {filtered.length === 0 ? (
        <div className="card text-center p-12">
          <Baby className="w-10 h-10 text-lg-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm text-lg-text-muted">Nenhuma criança encontrada.</p>
        </div>
      ) : (
        <div className="card divide-y divide-[var(--lg-border-light)] overflow-hidden">
          {filtered.map((kid) => (
            <div key={kid.id} className="p-4 flex items-center justify-between hover:bg-lg-surface-raised transition-colors group">
              <div className="flex items-center gap-3">
                {kid.photo_url ? (
                  <img src={kid.photo_url} alt={kid.full_name} className="w-11 h-11 rounded-full object-cover" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-lg-secondary-light flex items-center justify-center text-sm font-bold text-lg-care">
                    {kid.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-lg-midnight">{kid.full_name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {kid.classroom && (
                      <span className="text-xs text-lg-text-muted bg-lg-off-white px-1.5 py-0.5 rounded">{kid.classroom.name}</span>
                    )}
                    {kid.birth_date && (
                      <span className="text-xs text-lg-text-muted">
                        {new Date(kid.birth_date).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                    {kid.allergies && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        <AlertTriangle className="w-2.5 h-2.5" />{kid.allergies}
                      </span>
                    )}
                  </div>
                  {kid.guardians?.length > 0 && (
                    <p className="text-xs text-lg-text-muted mt-0.5">
                      <Users className="w-3 h-3 inline mr-1" />
                      {kid.guardians.map((g) => `${g.guardian?.full_name} (${g.relationship})`).join(", ")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {kid.status === "pending" && (
                  <>
                    <button onClick={() => handleStatusChange(kid.id, "approved")} disabled={isPending}
                      className="btn px-3 py-1.5 text-xs rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                    </button>
                    <button onClick={() => handleStatusChange(kid.id, "rejected")} disabled={isPending}
                      className="btn px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Rejeitar
                    </button>
                  </>
                )}
                {kid.status === "approved" && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">Aprovada</span>
                )}
                {kid.status === "rejected" && (
                  <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">Rejeitada</span>
                )}
                
                {kid.status === "approved" && (
                  <button onClick={() => {
                      if (kid.image_rights_status === "approved_physical") {
                         alert("Impressão de Termo Físico de Imagem - (Implementação de View Futura)");
                      } else {
                         alert("A criança optou pelo envio de Assinatura Eletrônica ou Recusou a imagem.");
                      }
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${kid.image_rights_status === 'approved_physical' ? 'text-lg-care hover:bg-lg-care/10' : 'text-lg-text-muted opacity-50 cursor-not-allowed'}`} title="Imprimir Termo Físico de Direitos">
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                )}

                {kid.status === "approved" && kid.qr_code && (
                  <button onClick={() => setQrModalKid(kid)}
                    className="p-1.5 text-lg-text-muted hover:text-lg-primary transition-colors hover:bg-lg-primary/10 rounded-lg" title="Ver Crachá QR">
                    <QrCode className="w-4 h-4" />
                  </button>
                )}

                <button onClick={() => handleDelete(kid.id)} disabled={isPending}
                  className="p-1.5 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Nova Criança */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center sm:p-6" onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setPreview(null); setGuardianRows([]); } }}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] overflow-y-auto animate-slide-up border border-[var(--glass-border)]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--glass-border)] sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <h3 className="text-base font-bold text-lg-midnight flex items-center gap-2" style={{ fontFamily: "var(--lg-font-heading)" }}>
                <div className="w-7 h-7 rounded-lg bg-lg-secondary-light flex items-center justify-center">
                  <Baby className="w-4 h-4 text-lg-care" />
                </div>
                Nova Criança
              </h3>
              <button type="button" onClick={() => { setShowModal(false); setPreview(null); setGuardianRows([]); }}
                className="w-7 h-7 rounded-lg hover:bg-lg-off-white flex items-center justify-center text-lg-text-muted transition-colors">✕</button>
            </div>

            <form ref={formRef} action={handleCreate} className="px-4 sm:px-6 py-4 sm:py-5">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-5">
                {/* Left Column: Photo + Saúde */}
                <div className="md:col-span-2 space-y-4">
                  {/* Photo */}
                  <label className="cursor-pointer block group">
                    <div className={`w-full h-32 md:h-auto md:aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-[var(--lg-care)] group-hover:shadow-md ${preview ? "border-[var(--lg-care)] p-0" : "border-gray-200 bg-lg-off-white"}`}>
                      {preview ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-lg-text-muted">
                          <Upload className="w-6 h-6 opacity-40" />
                          <span className="text-xs">Enviar foto</span>
                        </div>
                      )}
                    </div>
                    <input type="file" name="photo" accept="image/*" className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setCropSrc(URL.createObjectURL(f));
                    }} />
                  </label>

                  {/* Saúde */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> Saúde
                    </p>
                    <input type="text" name="allergies" placeholder="Alergias"
                      className="w-full px-3 py-2 bg-lg-off-white border border-[var(--glass-border)] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-colors" />
                    <textarea name="medical_notes" rows={2} placeholder="Observações médicas..."
                      className="w-full px-3 py-2 bg-lg-off-white border border-[var(--glass-border)] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-colors resize-none" />
                  </div>
                </div>

                {/* Right Column: Dados + Responsáveis */}
                <div className="md:col-span-3 space-y-4">
                  {/* Dados Pessoais */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-lg-primary uppercase tracking-wider">Dados Pessoais</p>
                    <input type="text" name="full_name" required placeholder="Nome Completo *"
                      className="w-full px-3 py-2 bg-lg-off-white border border-[var(--glass-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary focus:bg-white transition-colors" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" name="birth_date"
                        className="w-full px-3 py-2 bg-lg-off-white border border-[var(--glass-border)] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-lg-primary focus:bg-white transition-colors" />
                      <select name="classroom_id"
                        className="w-full px-3 py-2 bg-lg-off-white border border-[var(--glass-border)] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-lg-primary focus:bg-white transition-colors">
                        <option value="">Sala...</option>
                        {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Responsáveis */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-lg-primary uppercase tracking-wider flex items-center gap-1">
                        <Users className="w-2.5 h-2.5" /> Responsáveis
                        <span className="font-normal normal-case text-lg-text-muted ml-0.5">(máx 4)</span>
                      </p>
                      {guardianRows.length < 4 && (
                        <button type="button" onClick={addGuardianRow}
                          className="text-[10px] text-lg-primary font-medium flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-lg-primary/10 transition-colors">
                          <Plus className="w-2.5 h-2.5" /> Novo
                        </button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {guardianRows.map((g, i) => (
                        <div key={i} className="flex flex-wrap sm:flex-nowrap gap-1.5 items-center p-2 rounded-lg bg-lg-off-white border border-[var(--glass-border)]">
                          <span className="w-5 h-5 rounded-full bg-lg-primary/10 flex items-center justify-center text-[9px] font-bold text-lg-primary shrink-0">{i + 1}</span>
                          <select value={g.guardian_id} onChange={(e) => updateGuardianRow(i, "guardian_id", e.target.value)}
                            className="flex-1 min-w-[40%] px-2 py-1.5 bg-white border border-[var(--glass-border)] rounded text-[11px] focus:ring-1 focus:ring-lg-primary focus:outline-none">
                             <option value="">Membro...</option>
                            {localMembers.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                          </select>
                          <select value={g.relationship} onChange={(e) => updateGuardianRow(i, "relationship", e.target.value)}
                            className="w-24 px-2 py-1.5 bg-white border border-[var(--glass-border)] rounded text-[11px] focus:ring-1 focus:ring-lg-primary focus:outline-none">
                            {relationships.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <button type="button" onClick={() => removeGuardianRow(i)}
                            className="w-5 h-5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center shrink-0">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {guardianRows.length === 0 && (
                        <button type="button" onClick={addGuardianRow}
                          className="w-full py-2.5 rounded-lg border-2 border-dashed border-[var(--glass-border)] text-[11px] text-lg-text-muted hover:border-lg-primary hover:text-lg-primary transition-colors flex items-center justify-center gap-1">
                          <Plus className="w-3 h-3" /> Adicionar responsável
                        </button>
                      )}
                    </div>
                    
                    {/* Quick Add Form Context */}
                    <div className="flex justify-end pt-1">
                      <button type="button" onClick={() => setShowQuickAdd(!showQuickAdd)}
                        className="text-[10px] text-lg-primary hover:underline font-medium flex items-center gap-1">
                        {!showQuickAdd ? "+ Cadastrar novo visitante como responsável" : "- Ocultar cadastro de visitante"}
                      </button>
                    </div>

                    {showQuickAdd && (
                      <div className="p-3 bg-lg-surface rounded-xl border border-lg-border mt-2 space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-lg-primary" />
                        <h4 className="text-[11px] font-bold text-lg-primary uppercase tracking-wider flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Cadastro Rápido (Visitante)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="sm:col-span-2">
                            <input type="text" id="qa_name" required placeholder="Nome Completo *"
                              className="w-full px-2 py-1.5 bg-white border border-[var(--glass-border)] rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-lg-primary" />
                          </div>
                          <div>
                            <input type="text" id="qa_cpf" required placeholder="CPF (Somente números) *" maxLength={14}
                              className="w-full px-2 py-1.5 bg-white border border-[var(--glass-border)] rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-lg-primary" />
                          </div>
                          <div>
                            <input type="text" id="qa_phone" placeholder="WhatsApp (Opcional)"
                              className="w-full px-2 py-1.5 bg-white border border-[var(--glass-border)] rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-lg-primary" />
                          </div>
                          {quickAddError && (
                            <div className="sm:col-span-2 text-xs text-red-500 bg-red-50 p-1.5 rounded border border-red-100">{quickAddError}</div>
                          )}
                          <div className="sm:col-span-2 flex justify-end">
                            <button type="button" disabled={isQuickAdding} onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const fd = new FormData();
                                fd.append("name", (document.getElementById("qa_name") as HTMLInputElement)?.value || "");
                                fd.append("cpf", (document.getElementById("qa_cpf") as HTMLInputElement)?.value || "");
                                fd.append("phone", (document.getElementById("qa_phone") as HTMLInputElement)?.value || "");
                                await handleQuickAdd(fd);
                            }}
                              className="btn-primary px-3 py-1.5 text-[11px] flex items-center gap-1 disabled:opacity-50">
                              {isQuickAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Adicionar e Selecionar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-dashed border-[var(--glass-border)]">
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-lg-primary uppercase tracking-wider gap-1">Autorização de Imagem (Direitos)</label>
                  <select name="image_rights_status" defaultValue="pending" className="w-full px-3 py-3 bg-lg-off-white border border-[var(--glass-border)] rounded-xl text-sm focus:ring-2 focus:ring-lg-primary transition-colors text-lg-midnight cursor-pointer">
                    <option value="pending">📱 Gerar termo digital seguro via WhatsApp (Recomendado)</option>
                    <option value="approved_physical">📝 O responsável preencheu e assinou termo físico hoje</option>
                    <option value="denied">🚫 O responsável NÃO AUTORIZA captação de foto/vídeo</option>
                  </select>
                  <p className="text-[10px] text-lg-text-muted mt-1 leading-tight">A Ligare arquivará o documento formal de permissão ou recusa, protegendo juridicamente a igreja contra processos de exposição infantil.</p>
                </div>
              </div>

              {formError && <p className="mt-3 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{formError}</p>}

              {/* Footer Actions */}
              <div className="flex gap-3 mt-5 pt-4 border-t border-[var(--glass-border)]">
                <button type="button" onClick={() => { setShowModal(false); setPreview(null); setGuardianRows([]); }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--glass-border)] hover:bg-lg-off-white transition-colors text-lg-text-muted">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending}
                  className="btn-primary flex-1 px-4 py-2.5 rounded-xl text-sm font-medium flex justify-center items-center gap-2 disabled:opacity-60 shadow-md">
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><CheckCircle2 className="w-4 h-4" /> Cadastrar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Visualizar Crachá */}
      {qrModalKid && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setQrModalKid(null); }}>
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up relative">
              <button type="button" onClick={() => setQrModalKid(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/50 backdrop-blur border border-white flex items-center justify-center text-lg-midnight hover:bg-white transition-colors z-10">✕</button>
              
              <div className="pt-10 pb-6 px-6 bg-gradient-to-br from-[var(--lg-primary)] to-[var(--lg-midnight)] flex flex-col items-center justify-center text-center">
                 {qrModalKid.photo_url ? (
                   <img src={qrModalKid.photo_url} className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg mb-3" alt="Foto" />
                 ) : (
                   <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-2xl font-bold text-[var(--lg-primary)] border-4 border-white shadow-lg mb-3">
                     {qrModalKid.full_name.substring(0, 2).toUpperCase()}
                   </div>
                 )}
                 <h3 className="text-xl font-bold text-white font-heading">{qrModalKid.full_name}</h3>
                 <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mt-1">LIGARE KIDS</p>
                 
                 {qrModalKid.image_rights_status === "denied" && (
                   <div className="mt-3 bg-red-500/20 text-red-200 border border-red-500/50 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1.5">
                     <ShieldAlert className="w-3.5 h-3.5" /> NÃO FOTOGRAFAR
                   </div>
                 )}
                 {qrModalKid.image_rights_status === "pending" && (
                   <div className="mt-3 bg-amber-500/20 text-amber-200 border border-amber-500/50 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1.5">
                     <AlertTriangle className="w-3.5 h-3.5" /> AUTORIZAÇÃO PENDENTE
                   </div>
                 )}
              </div>
              
              <div className="p-8 flex flex-col items-center bg-white relative">
                 <div className="absolute -top-6 w-full flex justify-center">
                   <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center -translate-y-1/2">
                   {/* Hole illusion */}
                   <div className="w-8 h-8 rounded-full bg-gray-100 shadow-inner"></div>
                   </div>
                 </div>

                 <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-gray-200 shadow-sm mt-3">
                   <QRCodeSVG 
                     value={qrModalKid.qr_code || ""} 
                     size={200}
                     level="M"
                     includeMargin={false}
                     fgColor="#1E293B" // lg-midnight
                   />
                 </div>
                 
                 <p className="text-center font-mono text-xs text-lg-text-muted mt-5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 w-full">
                   {qrModalKid.qr_code}
                 </p>
              </div>
           </div>
        </div>
      )}

      {/* Image Crop Modal */}
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          aspect={1}
          onCropComplete={(file) => {
            setCroppedFile(file);
            setPreview(URL.createObjectURL(file));
            setCropSrc(null);
          }}
          onCancel={() => setCropSrc(null)}
          outputFileName="kid-photo.webp"
        />
      )}
    </div>
  );
}
