"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getChurchRoles() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not logged in" };

  const { data: profile } = await supabase.from("profiles").select("church_id, role").eq("id", user.id).single();
  if (!profile) return { data: null, error: "Profile not found" };

  const { data: roles, error } = await supabase.from("church_roles").select("*").eq("church_id", profile.church_id).order("name", { ascending: true });
  return { data: roles, error };
}

export async function createChurchRole(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const name = formData.get("name") as string;
  const permissions_level = formData.get("permissions_level") as string;
  if (!name || !permissions_level) throw new Error("Missing fields");

  const { data: profile } = await supabase.from("profiles").select("church_id, role, is_platform_admin").eq("id", user.id).single();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin' && !profile.is_platform_admin)) throw new Error("Unauthorized");

  const { error } = await supabase.from("church_roles").insert([{ church_id: profile.church_id, name, permissions_level }]);
  if (error) {
    if (error.code === '23505') {
      throw new Error(`O encargo '${name}' já existe. Não é possível cadastrar encargos com nomes duplicados.`);
    }
    throw new Error("Failed to create role: " + error.message);
  }
  revalidatePath("/dashboard/members/roles");
}

export async function deleteChurchRole(roleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const { data: profile } = await supabase.from("profiles").select("church_id, role, is_platform_admin").eq("id", user.id).single();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin' && !profile.is_platform_admin)) throw new Error("Unauthorized");

  const { error } = await supabase.from("church_roles").delete().eq("id", roleId).eq("church_id", profile.church_id);
  if (error) throw new Error("Failed to delete role");
  revalidatePath("/dashboard/members/roles");
}

export async function getMembers() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not logged in" };

  const { data: profile } = await supabase.from("profiles").select("church_id").eq("id", user.id).single();
  if (!profile) return { data: null, error: "Profile not found" };

  const { data: authMembers, error: err1 } = await supabase
    .from("profiles")
    .select(`id, full_name, email, whatsapp, status, birth_date, is_baptized, avatar_url, church_roles(id, name), leader:profiles!leader_id(id, full_name, avatar_url)`)
    .eq("church_id", profile.church_id);

  const { data: nonAuthMembers, error: err2 } = await supabase
    .from("church_members")
    .select(`id, full_name, email, whatsapp, status, birth_date, is_baptized, avatar_url, church_roles(id, name), leader:profiles!leader_id(id, full_name, avatar_url)`)
    .eq("church_id", profile.church_id);

  if (err1 || err2) return { data: null, error: err1?.message || err2?.message };

  const combined = [
    ...(authMembers || []).map(m => ({ ...m, is_auth: true, role_name: (m.church_roles as any)?.name, church_role_id: (m.church_roles as any)?.id })),
    ...(nonAuthMembers || []).map(m => ({ ...m, is_auth: false, role_name: (m.church_roles as any)?.name, church_role_id: (m.church_roles as any)?.id }))
  ].sort((a, b) => a.full_name.localeCompare(b.full_name));

  return { data: combined, error: null };
}

export async function createMember(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const { data: profile } = await supabase.from("profiles").select("church_id, role, is_platform_admin").eq("id", user.id).single();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin' && !profile.is_platform_admin)) throw new Error("Unauthorized");

  const full_name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const whatsapp = formData.get("whatsapp") as string;
  const role_id = formData.get("role_id") as string;
  const leader_id = formData.get("leader_id") as string;
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
      
    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Erro ao fazer upload da imagem");
    }
    
    const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    avatar_url = publicData.publicUrl;
  }

  const { error } = await supabase.from("church_members").insert([{
    church_id: profile.church_id,
    full_name,
    email: email || null,
    whatsapp: whatsapp || null,
    birth_date: birth_date || null,
    is_baptized,
    role_id: role_id || null,
    leader_id: leader_id || null,
    avatar_url,
    status: 'active'
  }]);

  if (error) {
    console.error("Error creating member:", error);
    throw new Error("Falha ao criar membro");
  }
  revalidatePath("/dashboard/members");
}

export async function updateMemberStatus(id: string, is_auth: boolean, status: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");
  
  const table = is_auth ? "profiles" : "church_members";
  const { error } = await supabase.from(table).update({ status }).eq("id", id);
  if (error) throw new Error("Falha ao atualizar status");
  revalidatePath("/dashboard/members");
}

export async function updateMember(id: string, is_auth: boolean, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");
  
  const full_name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const whatsapp = formData.get("whatsapp") as string;
  const role_id = formData.get("role_id") as string;
  const leader_id = formData.get("leader_id") as string;
  const birth_date = formData.get("birth_date") as string;
  const is_baptized = formData.get("is_baptized") === "true";
  const avatarFile = formData.get("avatar") as File | null;
  const removeAvatar = formData.get("remove_avatar") === "true";

  let newAvatarUrl = undefined;
  
  if (removeAvatar) {
    newAvatarUrl = null;
  } else if (avatarFile && avatarFile.size > 0) {
    const { data: profileRow } = await supabase.from("profiles").select("church_id").eq("id", user.id).single();
    if (profileRow) {
      const ext = avatarFile.name.split('.').pop();
      const filePath = `${profileRow.church_id}/${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, avatarFile);
        
      if (!uploadError) {
        newAvatarUrl = supabase.storage.from("avatars").getPublicUrl(filePath).data.publicUrl;
      }
    }
  }

  const dataToUpdate: any = {
    full_name,
    email: email || null,
    whatsapp: whatsapp || null,
    birth_date: birth_date || null,
    is_baptized,
    leader_id: leader_id || null,
  };
  
  if (newAvatarUrl !== undefined) {
    dataToUpdate.avatar_url = newAvatarUrl;
  }
  
  if (is_auth) {
    dataToUpdate.church_role_id = role_id || null;
  } else {
    dataToUpdate.role_id = role_id || null;
  }

  const table = is_auth ? "profiles" : "church_members";
  const { error } = await supabase.from(table).update(dataToUpdate).eq("id", id);
  
  if (error) {
    console.error("Error updating member:", error);
    throw new Error("Falha ao atualizar membro");
  }
  revalidatePath("/dashboard/members");
}

export async function deleteMember(id: string, is_auth: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  if (is_auth) {
    throw new Error("Membros com conta não podem ser excluídos, apenas inativados.");
  } else {
    const { error } = await supabase.from("church_members").delete().eq("id", id);
    if (error) throw new Error("Falha ao excluir membro");
  }
  revalidatePath("/dashboard/members");
}
