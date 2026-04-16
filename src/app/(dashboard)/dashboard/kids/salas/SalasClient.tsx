"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  DoorOpen,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Users,
  ImagePlus,
  Loader2,
  Upload,
  Pencil,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { compressFormDataImage } from "@/lib/image/compress";
import ImageCropper from "@/components/ui/ImageCropper";

interface Classroom {
  id: string;
  name: string;
  age_range: string | null;
  description: string | null;
  photo_url: string | null;
  is_active: boolean;
}

export default function SalasClient({
  classrooms,
  kidsCounts,
  error,
}: {
  classrooms: Classroom[] | null;
  kidsCounts: Record<string, number>;
  error: any;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [editRoom, setEditRoom] = useState<Classroom | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [editCroppedFile, setEditCroppedFile] = useState<File | null>(null);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState<"create" | "edit">("create");
  const formRef = useRef<HTMLFormElement>(null);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>, mode: "create" | "edit") {
    const file = e.target.files?.[0];
    if (file) {
      setCropMode(mode);
      setCropSrc(URL.createObjectURL(file));
    }
  }

  function handleCropDone(file: File) {
    if (cropMode === "create") {
      setCroppedFile(file);
      setPreview(URL.createObjectURL(file));
    } else {
      setEditCroppedFile(file);
      setEditPreview(URL.createObjectURL(file));
    }
    setCropSrc(null);
  }

  function openEditModal(room: Classroom) {
    setEditRoom(room);
    setEditPreview(room.photo_url);
    setEditCroppedFile(null);
    setEditFormError(null);
  }

  async function handleCreate(formData: FormData) {
    setFormError(null);
    if (croppedFile) {
      formData.set("photo", croppedFile);
    }
    startTransition(async () => {
      try {
        await compressFormDataImage(formData, "photo");
        const { createClassroom } = await import("../actions");
        await createClassroom(formData);
        toast.success("Sala criada com sucesso!");
        formRef.current?.reset();
        setPreview(null);
        setCroppedFile(null);
        router.refresh();
      } catch (e: any) {
        setFormError(e.message || "Erro ao criar sala");
        toast.error("Erro ao salvar sala");
      }
    });
  }

  async function handleUpdate(formData: FormData) {
    if (!editRoom) return;
    setEditFormError(null);
    if (editCroppedFile) {
      formData.set("photo", editCroppedFile);
    }
    startTransition(async () => {
      try {
        await compressFormDataImage(formData, "photo");
        const { updateClassroom } = await import("../actions");
        await updateClassroom(editRoom.id, formData);
        toast.success("Sala atualizada com sucesso!");
        setEditRoom(null);
        setEditCroppedFile(null);
        setEditPreview(null);
        router.refresh();
      } catch (e: any) {
        setEditFormError(e.message || "Erro ao atualizar sala");
        toast.error("Erro ao atualizar sala");
      }
    });
  }

  async function handleToggle(id: string, currentActive: boolean) {
    startTransition(async () => {
      try {
        const { toggleClassroomActive } = await import("../actions");
        await toggleClassroomActive(id, !currentActive);
        toast.success(currentActive ? "Sala desativada" : "Sala ativada");
        router.refresh();
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta sala?")) return;
    startTransition(async () => {
      try {
        const { deleteClassroom } = await import("../actions");
        await deleteClassroom(id);
        toast.success("Sala excluída permanentemente!");
        router.refresh();
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
          Salas & Turmas
        </h2>
        <p className="text-sm text-lg-text-muted mt-1">
          Gerencie as salas disponíveis para o ministério infantil.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ═══ CREATE FORM ═══ */}
        <div className="card p-5 h-max border border-[var(--glass-border)]">
          <h3 className="text-sm font-bold text-lg-midnight mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-lg-care" />
            Nova Sala
          </h3>

          <form ref={formRef} action={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-lg-text-muted mb-1">Foto da Sala</label>
              <label className="cursor-pointer block">
                <div className={`w-full aspect-square rounded-xl border-2 border-dashed border-[var(--glass-border)] flex items-center justify-center overflow-hidden hover:border-[var(--lg-care)] transition-colors ${preview ? "" : "bg-lg-off-white"}`}>
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-lg-text-muted">
                      <Upload className="w-5 h-5" />
                      <span className="text-xs">Clique para enviar</span>
                    </div>
                  )}
                </div>
                <input type="file" name="photo" accept="image/*" className="hidden"
                  onChange={(e) => handlePhotoSelect(e, "create")} />
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-lg-text-muted mb-1">Nome da Sala *</label>
              <input type="text" name="name" required placeholder="Ex: Berçário A"
                className="w-full px-4 py-2 bg-white/50 border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-care" />
            </div>
            <div>
              <label className="block text-xs font-medium text-lg-text-muted mb-1">Faixa Etária</label>
              <input type="text" name="age_range" placeholder="Ex: 0-2 anos"
                className="w-full px-4 py-2 bg-white/50 border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-care" />
            </div>
            <div>
              <label className="block text-xs font-medium text-lg-text-muted mb-1">Descrição</label>
              <textarea name="description" rows={2} placeholder="Observações..."
                className="w-full px-4 py-2 bg-white/50 border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-care resize-none" />
            </div>

            {formError && (
              <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{formError}</p>
            )}

            <button type="submit" disabled={isPending}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-medium flex justify-center items-center gap-2 text-white transition-all disabled:opacity-60"
              style={{ background: "var(--lg-care)" }}>
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</> : "Criar Sala"}
            </button>
          </form>
        </div>

        {/* ═══ CLASSROOM CARDS ═══ */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-lg-midnight flex items-center gap-2">
            <DoorOpen className="w-4 h-4 text-lg-care" />
            Salas Cadastradas ({classrooms?.length || 0})
          </h3>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
              Erro: {typeof error === "object" ? (error as any)?.message : String(error)}
            </p>
          )}

          {!classrooms || classrooms.length === 0 ? (
            <div className="card text-center p-8 bg-lg-off-white/50 border-dashed">
              <DoorOpen className="w-8 h-8 text-lg-text-muted mx-auto mb-3 opacity-50" />
              <p className="text-sm text-lg-text-muted">Nenhuma sala cadastrada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {classrooms.map((room) => (
                <div key={room.id} className={`card group hover:shadow-md transition-all overflow-hidden ${!room.is_active ? "opacity-60" : ""}`}>
                  {/* Square Photo */}
                  <div className="relative aspect-square bg-gradient-to-br from-lg-secondary-light to-lg-off-white flex items-center justify-center overflow-hidden">
                    {room.photo_url ? (
                      <img src={room.photo_url} alt={room.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-lg-text-muted opacity-40">
                        <ImagePlus className="w-10 h-10" />
                        <span className="text-xs">Sem foto</span>
                      </div>
                    )}
                    <div className={`absolute top-3 right-3 w-3 h-3 rounded-full border-2 border-white shadow-sm ${room.is_active ? "bg-lg-care" : "bg-gray-300"}`} />
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm text-lg-midnight">{room.name}</p>
                      {room.age_range && (
                        <span className="text-xs text-lg-text-muted bg-lg-off-white px-2 py-0.5 rounded-md">{room.age_range}</span>
                      )}
                    </div>
                    {room.description && <p className="text-xs text-lg-text-muted mb-3 line-clamp-2">{room.description}</p>}

                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-lg-off-white text-lg-text-muted border border-[var(--glass-border)]">
                        <Users className="w-3 h-3" />{kidsCounts[room.id] || 0} crianças
                      </span>
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${room.is_active ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
                        {room.is_active ? "Ativa" : "Inativa"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-[var(--glass-border)]">
                      <button onClick={() => openEditModal(room)} disabled={isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-lg-primary bg-lg-primary-light hover:bg-lg-primary hover:text-white disabled:opacity-50">
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button onClick={() => handleToggle(room.id, room.is_active)} disabled={isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:bg-lg-off-white text-lg-text-muted disabled:opacity-50">
                        {room.is_active ? <><ToggleRight className="w-4 h-4 text-lg-care" /> Desativar</> : <><ToggleLeft className="w-4 h-4" /> Ativar</>}
                      </button>
                      <button onClick={() => handleDelete(room.id)} disabled={isPending}
                        className="p-1.5 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 disabled:opacity-30" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ EDIT MODAL ═══ */}
      {editRoom && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex justify-center items-start pt-10 pb-20 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-[var(--glass-border)]">
            <div className="p-5 border-b border-[var(--glass-border)] flex items-center justify-between bg-lg-mist">
              <h3 className="font-bold text-lg-midnight flex items-center gap-2" style={{ fontFamily: "var(--lg-font-heading)" }}>
                <Pencil className="w-5 h-5 text-lg-primary" />
                Editar Sala
              </h3>
              <button onClick={() => setEditRoom(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-lg-text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form action={handleUpdate} className="p-5 space-y-4">
              {/* Photo */}
              <div>
                <label className="block text-xs font-medium text-lg-text-muted mb-1">Foto da Sala</label>
                <label className="cursor-pointer block">
                  <div className="w-full aspect-square rounded-xl border-2 border-dashed border-[var(--glass-border)] flex items-center justify-center overflow-hidden hover:border-[var(--lg-care)] transition-colors bg-lg-off-white">
                    {editPreview ? (
                      <img src={editPreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-lg-text-muted">
                        <Upload className="w-5 h-5" />
                        <span className="text-xs">Trocar foto</span>
                      </div>
                    )}
                  </div>
                  <input type="file" name="photo" accept="image/*" className="hidden"
                    onChange={(e) => handlePhotoSelect(e, "edit")} />
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-lg-text-muted mb-1">Nome da Sala *</label>
                <input type="text" name="name" required defaultValue={editRoom.name}
                  className="w-full px-4 py-2 bg-white/50 border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-care" />
              </div>
              <div>
                <label className="block text-xs font-medium text-lg-text-muted mb-1">Faixa Etária</label>
                <input type="text" name="age_range" defaultValue={editRoom.age_range || ""}
                  className="w-full px-4 py-2 bg-white/50 border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-care" />
              </div>
              <div>
                <label className="block text-xs font-medium text-lg-text-muted mb-1">Descrição</label>
                <textarea name="description" rows={2} defaultValue={editRoom.description || ""}
                  className="w-full px-4 py-2 bg-white/50 border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-care resize-none" />
              </div>

              {editFormError && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{editFormError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditRoom(null)} disabled={isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium flex justify-center items-center gap-2 text-white transition-all disabled:opacity-60"
                  style={{ background: "var(--lg-care)" }}>
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ CROP MODAL ═══ */}
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          aspect={1}
          onCropComplete={handleCropDone}
          onCancel={() => setCropSrc(null)}
          outputFileName="sala-photo.webp"
        />
      )}
    </div>
  );
}
