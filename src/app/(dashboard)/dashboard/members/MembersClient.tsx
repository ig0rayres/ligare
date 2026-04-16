"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { User, Phone, Mail, Shield, UserCheck, MoreVertical, Plus, Trash2, Edit2, X, Loader2, AlertCircle, CheckCircle2, Image as ImageIcon, Upload, Search, ChevronDown, Check } from "lucide-react";
import { createMember, updateMemberStatus, updateMember, deleteMember } from "./actions";
import { toast } from "sonner";
import { compressFormDataImage } from "@/lib/image/compress";
import ImageCropper from "@/components/ui/ImageCropper";

interface Role {
  id: string;
  name: string;
}

interface Member {
  id: string;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
  status: string;
  role_name: string | null;
  church_role_id: string | null;
  leader: { id: string; full_name: string } | null;
  birth_date?: string | null;
  is_baptized?: boolean;
  avatar_url?: string | null;
  is_auth: boolean;
}

export default function MembersClient({ members, roles, callerRole }: { members: Member[]; roles: Role[]; callerRole?: string }) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const [leaderSearch, setLeaderSearch] = useState("");
  const [isLeaderComboOpen, setIsLeaderComboOpen] = useState(false);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);
  const comboRef = useRef<HTMLDivElement>(null);

  const validLeaders = members.filter(m => 
    m.id !== editingMember?.id && 
    m.is_auth && 
    m.role_name && 
    m.status !== 'inactive'
  );

  const filteredLeaders = validLeaders.filter(l => 
    l.full_name.toLowerCase().includes(leaderSearch.toLowerCase())
  );

  function handleOpenModal(member: Member | null) {
    setEditingMember(member);
    setFormError(null);
    setAvatarPreview(member?.avatar_url || null);
    setRemoveAvatar(false);
    setSelectedLeaderId(member?.leader?.id || null);
    setLeaderSearch("");
    setShowModal(true);
  }

  // Close menus when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest('.action-menu-trigger') || target.closest('.action-menu-content')) {
        return;
      }
      if (comboRef.current && !comboRef.current.contains(target)) {
        setIsLeaderComboOpen(false);
      }
      setActiveMenu(null);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const filtered = members.filter(m => 
    m.full_name.toLowerCase().includes(search.toLowerCase()) || 
    m.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.whatsapp?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(formData: FormData) {
    setFormError(null);
    startTransition(async () => {
      try {
        if (croppedFile) {
          formData.set("avatar", croppedFile);
        }
        await compressFormDataImage(formData, "avatar");
        if (editingMember) {
          await updateMember(editingMember.id, editingMember.is_auth, formData);
          toast.success("Membro atualizado com sucesso!");
        } else {
          await createMember(formData);
          toast.success("Membro cadastrado com sucesso!");
        }
        setShowModal(false);
        setEditingMember(null);
        setAvatarPreview(null);
        setCroppedFile(null);
      } catch (e: any) {
        setFormError(e.message);
        toast.error("Erro ao salvar membro");
      }
    });
  }

  async function handleDelete(id: string, is_auth: boolean) {
    if (is_auth) {
      toast.warning("Membros com conta (app) não podem ser excluídos, apenas inativados.");
      return;
    }
    if (!confirm("Tem certeza que deseja excluir permanentemente este membro?")) return;
    
    startTransition(async () => {
      try {
        await deleteMember(id, is_auth);
        toast.success("Membro excluído permanentemente!");
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  async function handleStatusChange(id: string, is_auth: boolean, newStatus: string) {
    startTransition(async () => {
      try {
        await updateMemberStatus(id, is_auth, newStatus);
        toast.success(`Status atualizado para ${newStatus === 'active' ? 'Ativo' : 'Inativo'}!`);
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/50 p-4 rounded-xl border border-[var(--glass-border)]">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="Buscar por nome, email ou celular..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/80 border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary"
          />
          <User className="absolute left-3 top-2.5 w-4 h-4 text-lg-text-muted" />
        </div>
        
        {callerRole !== 'kids_team' && (
          <button 
            onClick={() => handleOpenModal(null)}
            className="w-full sm:w-auto btn-primary px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Novo Membro
          </button>
        )}
      </div>

      {/* List / Table */}
      <div className="card">
        <div className="overflow-x-visible sm:overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--glass-border)] bg-lg-off-white/50">
                <th className="py-3 px-4 text-xs font-semibold text-lg-text-muted uppercase tracking-wider">Membro</th>
                <th className="py-3 px-4 text-xs font-semibold text-lg-text-muted uppercase tracking-wider">Contato</th>
                <th className="py-3 px-4 text-xs font-semibold text-lg-text-muted uppercase tracking-wider">Encargo / Função</th>
                <th className="py-3 px-4 text-xs font-semibold text-lg-text-muted uppercase tracking-wider">Líder Direto</th>
                <th className="py-3 px-4 text-xs font-semibold text-lg-text-muted uppercase tracking-wider">Status</th>
                {callerRole !== 'kids_team' && (
                  <th className="py-3 px-4 text-right">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {filtered.map((member) => (
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
                        {member.is_auth && <span className="text-[10px] bg-lg-primary/10 text-lg-primary px-1.5 rounded-sm">Possui App</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
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
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {member.role_name ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-lg-care/10 text-lg-care border border-[var(--lg-care)]/20">
                        <Shield className="w-3 h-3" />
                        {member.role_name}
                      </span>
                    ) : (
                      <span className="text-xs text-lg-text-muted">Membro comum</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {member.leader ? (
                      <div className="flex items-center gap-1.5 text-xs text-lg-text-muted">
                        <UserCheck className="w-3.5 h-3.5" />
                        {member.leader.full_name}
                      </div>
                    ) : (
                      <span className="text-xs text-lg-text-muted opacity-50">- Sem vínculo -</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      member.status === 'active' ? 'bg-green-100 text-green-700 border border-green-200' : 
                      member.status === 'inactive' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      member.status === 'removed' ? 'bg-red-100 text-red-700 border border-red-200' :
                      'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      {member.status === 'active' ? 'Ativo' : 
                       member.status === 'inactive' ? 'Inativo' : 
                       member.status === 'removed' ? 'Removido' : 
                       member.status}
                    </span>
                  </td>
                  {callerRole !== 'kids_team' && (
                    <td className="py-3 px-4 text-right">
                      <div className="relative inline-block text-left relative-menu-container">
                         <button 
                            onClick={(e) => { 
                              e.preventDefault(); 
                              setActiveMenu(activeMenu === member.id ? null : member.id); 
                            }}
                            className="action-menu-trigger p-1.5 text-lg-text-muted hover:text-lg-primary rounded-md hover:bg-lg-primary/10 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 pointer-events-none" />
                         </button>
  
                         {activeMenu === member.id && (
                         <div className="action-menu-content absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                            <div className="py-1" role="menu" aria-orientation="vertical">
                              <button
                                onClick={() => { handleOpenModal(member); setActiveMenu(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" /> Editar
                              </button>
                              
                              {member.status === 'active' ? (
                                <button
                                  onClick={() => { handleStatusChange(member.id, member.is_auth, 'inactive'); setActiveMenu(null); }}
                                  className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                                >
                                  <AlertCircle className="w-4 h-4" /> Inativar
                                </button>
                              ) : (
                                <button
                                  onClick={() => { handleStatusChange(member.id, member.is_auth, 'active'); setActiveMenu(null); }}
                                  className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                >
                                  <CheckCircle2 className="w-4 h-4" /> Ativar
                                </button>
                              )}

                              {!member.is_auth && (
                                <button
                                  onClick={() => { handleDelete(member.id, member.is_auth); setActiveMenu(null); }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" /> Excluir permanentemente
                                </button>
                              )}
                           </div>
                         </div>
                       )}
                    </div>
                  </td>
                  )}
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-lg-text-muted text-sm">
                    Nenhum membro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 sm:p-6" onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setEditingMember(null); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[var(--glass-border)] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)] bg-gray-50/50 rounded-t-2xl">
              <h3 className="text-lg font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
                {editingMember ? "Editar Membro" : "Novo Membro"}
              </h3>
              <button type="button" onClick={() => { setShowModal(false); setEditingMember(null); }} className="p-2 -mr-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form ref={formRef} action={handleSubmit} className="px-6 py-5">
              
              {/* Avatar Upload Sector */}
              <div className="flex flex-col sm:flex-row gap-6 mb-6 items-center sm:items-start group">
                <div className="relative w-20 h-20 rounded-full bg-lg-off-white border-2 border-dashed border-[var(--glass-border)] flex items-center justify-center shrink-0 overflow-hidden hover:border-[var(--lg-primary)] transition-colors">
                  {avatarPreview ? (
                     <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                     <ImageIcon className="w-6 h-6 text-lg-text-muted" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center text-center sm:text-left">
                   <h4 className="text-sm font-semibold text-lg-midnight">Foto de Perfil</h4>
                   <p className="text-xs text-lg-text-muted mt-1">Opcional. Uma foto de rosto clara ajuda na listagem e na geração das credenciais PWA.</p>
                   <div className="flex items-center gap-3 mt-3 justify-center sm:justify-start">
                     <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs font-medium text-lg-primary hover:underline">Fazer upload</button>
                     {avatarPreview && (
                       <button type="button" onClick={() => { setAvatarPreview(null); setRemoveAvatar(true); if(fileInputRef.current) fileInputRef.current.value=''; }} className="text-xs font-medium text-red-500 hover:underline">Remover foto</button>
                     )}
                   </div>
                </div>
                <input type="file" name="avatar" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if(file) { setCropSrc(URL.createObjectURL(file)); }
                }} />
                <input type="hidden" name="remove_avatar" value={removeAvatar ? "true" : "false"} />
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nome Completo *</label>
                  <input 
                    type="text" 
                    name="full_name" 
                    required 
                    defaultValue={editingMember?.full_name || ""}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary" 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">E-mail</label>
                    <input 
                      type="email" 
                      name="email" 
                      defaultValue={editingMember?.email || ""}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary" 
                    />
                  </div>
                  {/* WhatsApp */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">WhatsApp</label>
                    <input 
                      type="text" 
                      name="whatsapp" 
                      placeholder="(DD) 90000-0000"
                      defaultValue={editingMember?.whatsapp || ""}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Birth Date */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Data de Nascimento</label>
                    <input 
                      type="date" 
                      name="birth_date" 
                      defaultValue={editingMember?.birth_date || ""}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary" 
                    />
                  </div>
                  {/* Baptized */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Batizado?</label>
                    <select 
                      name="is_baptized" 
                      defaultValue={editingMember?.is_baptized ? "true" : "false"}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary"
                    >
                      <option value="false">Não</option>
                      <option value="true">Sim</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Role */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Encargo / Função</label>
                    <select 
                      name="role_id" 
                      defaultValue={editingMember?.church_role_id || ""}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary"
                    >
                      <option value="">Membro comum (Sem role)</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Leader */}
                  <div className="relative" ref={comboRef}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Líder Direto</label>
                    <input type="hidden" name="leader_id" value={selectedLeaderId || ""} />
                    
                    <div 
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus-within:ring-2 focus-within:ring-lg-primary flex items-center justify-between cursor-pointer"
                      onClick={() => setIsLeaderComboOpen(!isLeaderComboOpen)}
                    >
                       <span className={`truncate ${!selectedLeaderId ? "text-gray-500" : "text-gray-900"}`}>
                         {selectedLeaderId ? validLeaders.find(l => l.id === selectedLeaderId)?.full_name || "- Sem vínculo -" : "- Sem vínculo -"}
                       </span>
                       <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>

                    {isLeaderComboOpen && (
                       <div className="absolute z-50 w-full mt-1 bg-white border border-[var(--glass-border)] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-60 animate-in fade-in zoom-in-95 duration-100">
                         <div className="p-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                            <Search className="w-4 h-4 text-gray-400 shrink-0" />
                            <input 
                              type="text" 
                              className="w-full text-sm outline-none bg-transparent" 
                              placeholder="Buscar líder..."
                              value={leaderSearch}
                              onChange={e => setLeaderSearch(e.target.value)}
                              autoFocus
                            />
                         </div>
                         <div className="overflow-y-auto flex-1 p-1">
                           <div 
                              className={`px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-gray-100 flex items-center justify-between transition-colors ${!selectedLeaderId ? "bg-lg-primary/10 text-lg-primary font-semibold" : "text-gray-700"}`}
                              onClick={() => { setSelectedLeaderId(null); setIsLeaderComboOpen(false); }}
                           >
                             - Sem vínculo -
                             {!selectedLeaderId && <Check className="w-4 h-4" />}
                           </div>
                           
                           {filteredLeaders.length === 0 ? (
                             <div className="px-3 py-6 text-xs text-center text-gray-500">Nenhum líder apto encontrado.</div>
                           ) : (
                             filteredLeaders.map(leader => (
                               <div 
                                  key={leader.id}
                                  className={`px-3 py-2 text-sm rounded-lg cursor-pointer flex items-center justify-between mt-1 transition-colors ${selectedLeaderId === leader.id ? "bg-lg-primary/10 text-lg-primary font-semibold" : "text-gray-700 hover:bg-gray-100"}`}
                                  onClick={() => { setSelectedLeaderId(leader.id); setIsLeaderComboOpen(false); }}
                               >
                                 <div className="flex items-center gap-2 truncate">
                                   <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 shrink-0 flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br from-lg-primary to-lg-secondary">
                                      {leader.avatar_url ? <img src={leader.avatar_url} className="w-full h-full object-cover" /> : leader.full_name.substring(0,2).toUpperCase()}
                                   </div>
                                   <span className="truncate">{leader.full_name}</span>
                                 </div>
                                 {selectedLeaderId === leader.id && <Check className="w-4 h-4 text-lg-primary shrink-0" />}
                               </div>
                             ))
                           )}
                         </div>
                       </div>
                    )}
                  </div>
                </div>
              </div>

              {formError && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-xs border border-red-200">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-5 border-t border-[var(--glass-border)]">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); setEditingMember(null); }}
                  className="w-full px-4 py-2 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full px-4 py-2 rounded-xl text-sm font-medium text-white flex justify-center items-center gap-2 shadow-md disabled:opacity-70 disabled:cursor-not-allowed transition-all" 
                  style={{ background: "var(--lg-primary)" }}
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                  {editingMember ? "Salvar Alterações" : "Cadastrar Membro"}
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
          aspect={1}
          onCropComplete={(file) => {
            setCroppedFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            setRemoveAvatar(false);
            setCropSrc(null);
          }}
          onCancel={() => setCropSrc(null)}
          outputFileName="avatar.webp"
        />
      )}
    </div>
  );
}
