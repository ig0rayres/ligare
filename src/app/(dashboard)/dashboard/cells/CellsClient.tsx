"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { User, Phone, Mail, UserPlus, Trash2, Edit2, Pencil, X, Loader2, AlertCircle, Baby, Heart, Check } from "lucide-react";
import { createCellMember, createCellKid, removeCellMember, removeCellKid, updateCellName } from "./actions";
import { toast } from "sonner";

interface CellMember {
  id: string;
  full_name: string;
  email?: string | null;
  whatsapp?: string | null;
  status: string;
  birth_date?: string | null;
  is_baptized?: boolean;
  avatar_url?: string | null;
  
  // Kids specific
  is_kid?: boolean;
  allergies?: string | null;
  medical_notes?: string | null;
}

export default function CellsClient({ 
  initialMembers, 
  callerRole, 
  cellTerm, 
  leaderId,
  initialCellName 
}: { 
  initialMembers: CellMember[]; 
  callerRole: string; 
  cellTerm: string;
  leaderId: string;
  initialCellName: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Editable cell name
  const [cellName, setCellName] = useState(initialCellName || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(cellName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

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
        toast.success("Nome da célula atualizado!");
      } catch (e: any) {
        toast.error(e.message || "Erro ao salvar nome");
        setCellName(initialCellName || "");
      }
    });
  }

  const isKidsTeam = callerRole === 'kids_team';

  const filtered = initialMembers.filter(m => 
    m.full_name.toLowerCase().includes(search.toLowerCase()) || 
    (m.email && m.email.toLowerCase().includes(search.toLowerCase())) ||
    (m.whatsapp && m.whatsapp.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleSubmit(formData: FormData) {
    setFormError(null);
    startTransition(async () => {
      try {
        if (isKidsTeam) {
          await createCellKid(formData);
          toast.success("Criança adicionada à sua equipe com sucesso!");
        } else {
          await createCellMember(formData);
          toast.success("Integrante adicionado à sua equipe com sucesso!");
        }
        setShowModal(false);
      } catch (e: any) {
        setFormError(e.message);
        toast.error("Erro ao salvar integrante");
      }
    });
  }

  async function handleRemove(id: string) {
    if (!confirm(`Tem certeza que deseja remover esta pessoa da sua ${cellTerm}? Ela voltará para a base geral da igreja.`)) return;
    
    startTransition(async () => {
      try {
        if (isKidsTeam) {
          await removeCellKid(id);
        } else {
          await removeCellMember(id);
        }
        toast.success(`Removido da sua ${cellTerm}!`);
      } catch (e: any) {
        toast.error(e.message || "Erro ao remover");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/50 p-4 rounded-xl border border-[var(--glass-border)]">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder={isKidsTeam ? "Buscar crianças pelo nome..." : "Buscar liderados por nome, email ou celular..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/80 border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary"
          />
          <User className="absolute left-3 top-2.5 w-4 h-4 text-lg-text-muted" />
        </div>
        
        <button 
          onClick={() => { setFormError(null); setShowModal(true); }}
          className="w-full sm:w-auto btn-primary px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
        >
          {isKidsTeam ? <Baby className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />} 
          Adicionar na {cellTerm}
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between bg-white/50">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-lg-primary shrink-0" />
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') { setIsEditingName(false); setNameDraft(cellName); }
                  }}
                  onBlur={handleSaveName}
                  maxLength={60}
                  className="text-lg font-bold text-lg-midnight bg-lg-off-white border border-[var(--lg-primary)] rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-lg-primary w-64"
                  style={{ fontFamily: "var(--lg-font-heading)" }}
                  placeholder={`Nome da sua ${cellTerm.toLowerCase()}...`}
                />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSaveName(); }}
                  className="p-1 rounded-lg bg-lg-primary text-white hover:opacity-90 transition-opacity"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setNameDraft(cellName); setIsEditingName(true); }}
                className="group/name flex items-center gap-2 hover:bg-lg-off-white rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors"
                title="Clique para renomear sua célula"
              >
                <h2 className="text-lg font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
                  {cellName || `Minha ${cellTerm}`}
                </h2>
                <Pencil className="w-3.5 h-3.5 text-lg-text-muted opacity-0 group-hover/name:opacity-100 transition-opacity" />
              </button>
            )}
            <span className="text-sm text-lg-text-muted font-medium ml-1">({initialMembers.length})</span>
          </div>
        </div>

        <div className="overflow-x-visible sm:overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--glass-border)] bg-lg-off-white/50">
                <th className="py-3 px-4 text-xs font-semibold text-lg-text-muted uppercase tracking-wider">Nome</th>
                <th className="py-3 px-4 text-xs font-semibold text-lg-text-muted uppercase tracking-wider">
                  {isKidsTeam ? "Detalhes Médicos" : "Contato"}
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-lg-text-muted uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-lg-text-muted">
                    Ninguém na sua {cellTerm.toLowerCase()} ainda. Adicione o primeiro!
                  </td>
                </tr>
              ) : filtered.map((member) => (
                <tr key={member.id} className="hover:bg-lg-off-white transition-colors group">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lg-primary to-lg-secondary flex items-center justify-center text-white font-bold text-xs ring-2 ring-white overflow-hidden shrink-0">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          member.full_name?.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-sm text-lg-midnight block">{member.full_name}</span>
                        {member.birth_date && (
                           <span className="text-[10px] text-lg-text-muted">
                             Nasc: {new Date(member.birth_date).toLocaleDateString("pt-BR")}
                           </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      {isKidsTeam ? (
                        <>
                           {member.allergies && (
                             <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded-sm inline-block w-fit">
                               ⚠️ {member.allergies}
                             </span>
                           )}
                           {member.medical_notes && (
                             <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-1 py-0.5 rounded-sm inline-block w-fit truncate max-w-[150px]">
                               {member.medical_notes}
                             </span>
                           )}
                           {!member.allergies && !member.medical_notes && (
                             <span className="text-xs text-lg-text-muted opacity-50">Sem restrições</span>
                           )}
                        </>
                      ) : (
                        <>
                          {member.email && (
                            <div className="flex items-center gap-1.5 text-xs text-lg-text-muted">
                              <Mail className="w-3 h-3" /> {member.email}
                            </div>
                          )}
                          {member.whatsapp && (
                            <div className="flex items-center gap-1.5 text-xs text-lg-text-muted">
                              <Phone className="w-3 h-3" /> {member.whatsapp}
                            </div>
                          )}
                          {!member.email && !member.whatsapp && <span className="text-xs text-lg-text-muted opacity-50">-</span>}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      member.status === 'active' || member.status === 'approved' ? 'bg-green-100 text-green-700 border border-green-200' : 
                      'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      {(member.status === 'active' || member.status === 'approved') ? 'Presente/Ativo' : member.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                     <button 
                        onClick={() => handleRemove(member.id)}
                        disabled={isPending}
                        className="text-lg-text-muted hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                        title="Desvincular da Minha Célula"
                     >
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:p-0 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animation-scale-up border border-[var(--glass-border)] relative">
            
            <div className="p-5 border-b border-[var(--glass-border)] flex items-center justify-between bg-lg-mist">
              <h3 className="font-bold text-lg-midnight flex items-center gap-2" style={{ fontFamily: "var(--lg-font-heading)" }}>
                {isKidsTeam ? <Baby className="w-5 h-5 text-lg-primary" /> : <UserPlus className="w-5 h-5 text-lg-primary" />}
                Adicionar {isKidsTeam ? "Criança" : "Liderado"}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-lg-text-muted transition-colors"
                disabled={isPending}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form ref={formRef} action={handleSubmit} className="p-6">
              {formError && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 leading-relaxed font-medium">{formError}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Generic Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-1.5">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    required
                    className="w-full px-4 py-2 bg-lg-off-white border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary"
                    placeholder="Nome completo..."
                  />
                </div>

                {isKidsTeam ? (
                  <>
                     <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-1.5">Alergias</label>
                      <input type="text" name="allergies" className="w-full px-4 py-2 bg-lg-off-white border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary" placeholder="Ex: Amendoim, Lactose..." />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-1.5">Observações Médicas</label>
                      <input type="text" name="medical_notes" className="w-full px-4 py-2 bg-lg-off-white border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary" placeholder="Condições, remédios..." />
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-1.5">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    name="birth_date"
                    className="w-full px-4 py-2 bg-lg-off-white border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary"
                  />
                </div>

                {!isKidsTeam && (
                  <label className="flex items-center gap-3 p-3 border border-[var(--glass-border)] rounded-xl cursor-pointer hover:bg-lg-mist transition-colors">
                    <input type="checkbox" name="is_baptized" value="true" className="w-4 h-4 rounded text-lg-primary focus:ring-lg-primary border-gray-300" />
                    <span className="text-sm font-medium text-lg-midnight">Já é batizado(a)?</span>
                  </label>
                )}
                
                <p className="text-xs text-lg-text-muted mt-2">
                  * O novo registro será amarrado diretamente à você como líder.
                </p>
              </div>

              <div className="mt-8 pt-5 border-t border-[var(--glass-border)] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-lg-text-muted hover:bg-lg-mist transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm"
                >
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
