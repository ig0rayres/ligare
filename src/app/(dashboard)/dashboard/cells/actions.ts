"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCellMember(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const { data: profile } = await supabase.from("profiles").select("church_id, role, id").eq("id", user.id).single();
  if (!profile || profile.role !== 'leader') throw new Error("Unauthorized: Only leaders can create cell members here");

  const full_name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const whatsapp = formData.get("whatsapp") as string;
  const birth_date = formData.get("birth_date") as string;
  const is_baptized = formData.get("is_baptized") === "true";
  const avatarFile = formData.get("avatar") as File | null;

  if (!full_name) throw new Error("Nome é obrigatório");

  let avatar_url = null;
  if (avatarFile && avatarFile.size > 0) {
    const ext = avatarFile.name.split('.').pop();
    const filePath = `${profile.church_id}/${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile);
      
    if (!uploadError) {
      const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      avatar_url = publicData.publicUrl;
    }
  }

  const { error } = await supabase.from("church_members").insert([{
    church_id: profile.church_id,
    full_name,
    email: email || null,
    whatsapp: whatsapp || null,
    birth_date: birth_date || null,
    is_baptized,
    leader_id: profile.id, // Forçado
    avatar_url,
    status: 'active'
  }]);

  if (error) throw new Error("Falha ao criar membro: " + error.message);
  revalidatePath("/dashboard/cells");
}

export async function createCellKid(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const { data: profile } = await supabase.from("profiles").select("church_id, role, id").eq("id", user.id).single();
  if (!profile || profile.role !== 'kids_team') throw new Error("Unauthorized: Only kids team can create cell kids");

  const full_name = formData.get("full_name") as string;
  const birth_date = formData.get("birth_date") as string;
  const allergies = formData.get("allergies") as string;
  const medical_notes = formData.get("medical_notes") as string;
  const avatarFile = formData.get("avatar") as File | null;

  if (!full_name) throw new Error("Nome é obrigatório");

  let photo_url = null;
  if (avatarFile && avatarFile.size > 0) {
    const ext = avatarFile.name.split('.').pop();
    const filePath = `${profile.church_id}/kids_${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile);
      
    if (!uploadError) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      photo_url = data.publicUrl;
    }
  }

  const { error } = await supabase.from("kids").insert([{
    church_id: profile.church_id,
    full_name,
    birth_date: birth_date || null,
    allergies: allergies || null,
    medical_notes: medical_notes || null,
    leader_id: profile.id, // Forçado
    photo_url,
    is_active: true,
    status: 'approved'
  }]);


  if (error) throw new Error("Falha ao cadastrar criança: " + error.message);
  revalidatePath("/dashboard/cells");
}

export async function removeCellMember(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const { data: profile } = await supabase.from("profiles").select("role, id").eq("id", user.id).single();
  if (!profile || profile.role !== 'leader') throw new Error("Unauthorized");

  // Apenas desvincula da célula (ou pode excluir)
  // Como são gerados pelo líder, faz mais sentido apenas desvincular do líder, 
  // voltando para o hall geral (painel de Membros do admin).
  const { error } = await supabase.from("church_members").update({ leader_id: null }).eq("id", id).eq("leader_id", profile.id);
  if (error) throw new Error("Falha ao remover membro da equipe.");
  revalidatePath("/dashboard/cells");
}

export async function removeCellKid(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const { data: profile } = await supabase.from("profiles").select("role, id").eq("id", user.id).single();
  if (!profile || profile.role !== 'kids_team') throw new Error("Unauthorized");

  const { error } = await supabase.from("kids").update({ leader_id: null }).eq("id", id).eq("leader_id", profile.id);
  if (error) throw new Error("Falha ao remover criança da equipe.");
  revalidatePath("/dashboard/cells");
}

export async function updateCellName(newName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const { data: profile } = await supabase.from("profiles").select("role, id").eq("id", user.id).single();
  if (!profile || (profile.role !== 'leader' && profile.role !== 'kids_team')) throw new Error("Unauthorized");

  const trimmed = newName.trim();
  if (!trimmed || trimmed.length > 60) throw new Error("Nome inválido (máx 60 caracteres)");

  const { error } = await supabase.from("profiles").update({ cell_name: trimmed }).eq("id", profile.id);
  if (error) throw new Error("Falha ao salvar nome da célula: " + error.message);
  revalidatePath("/dashboard/cells");
}
