"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("church_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Perfil não encontrado");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const starts_at = formData.get("starts_at") as string; // The base date for the first occurrence
  const is_public = formData.get("is_public") === "true";
  const recurrence_type = formData.get("recurrence_type") as string; // 'once', 'weekly', 'monthly'
  const recurrence_day = formData.get("recurrence_day") as string; // e.g., '1', '2' for weekly (0=sun), or '15' for monthly
  
  const target_members_str = formData.get("target_members") as string;
  let target_members: string[] | null = null;
  if (target_members_str) {
    try {
      target_members = JSON.parse(target_members_str);
      if (Array.isArray(target_members) && target_members.length === 0) {
        target_members = null;
      }
    } catch(e) {}
  }

  const requestedScope = formData.get("scope") as string;
  let scope = "cell";
  
  if (profile.role === "admin" || profile.role === "manager" || profile.role === "super_admin") {
    scope = requestedScope && ["church", "cell", "kids"].includes(requestedScope) ? requestedScope : "church";
  } else if (profile.role === "kids_team") {
    scope = "kids";
  } else if (requestedScope === "kids") {
     // Allow if the user has kids_leader permissions (checked via RLS later, or just assume frontend sent it if they have access)
     scope = "kids";
  }

  if (!title || !starts_at) {
    throw new Error("Título e Data/Hora Inicial são obrigatórios");
  }

  const parsedStartsAt = new Date(starts_at).toISOString();

  const { error } = await supabase.from("events").insert({
    church_id: profile.church_id,
    created_by: user.id,
    title,
    description: description || null,
    starts_at: parsedStartsAt,
    is_public: scope === 'church' ? is_public : false,
    scope,
    recurrence_type: recurrence_type || "once",
    recurrence_day: recurrence_day || null,
    target_members: scope === 'cell' ? target_members : null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/events");
}

export async function updateEvent(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const starts_at = formData.get("starts_at") as string;
  const recurrence_type = formData.get("recurrence_type") as string;
  const recurrence_day = formData.get("recurrence_day") as string;

  const target_members_str = formData.get("target_members") as string;
  let target_members: string[] | null = null;
  if (target_members_str) {
    try {
      target_members = JSON.parse(target_members_str);
      if (Array.isArray(target_members) && target_members.length === 0) {
        target_members = null;
      }
    } catch(e) {}
  }

  if (!title || !starts_at) {
    throw new Error("Título e Data/Hora Inicial são obrigatórios");
  }

  const parsedStartsAt = new Date(starts_at).toISOString();

  const { error } = await supabase.from("events").update({
    title,
    description: description || null,
    starts_at: parsedStartsAt,
    recurrence_type: recurrence_type || "once",
    recurrence_day: recurrence_day || null,
    target_members: target_members,
  }).eq("id", id);
  // RLS will ensure they have the proper permissions.

  if (error) {
    throw new Error("Erro ao atualizar evento: " + error.message);
  }

  revalidatePath("/dashboard/events");
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error("Erro ao deletar evento: " + error.message);

  revalidatePath("/dashboard/events");
}

export async function notifyEvent(eventId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("church_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Perfil não encontrado");

  const message = formData.get("message") as string;
  const notifyApp = formData.get("notifyApp") === "true";
  const notifyWhatsapp = formData.get("notifyWhatsapp") === "true";
  const targetRolesRaw = formData.get("targetRoles") as string;
  const imageFile = formData.get("image") as File | null;

  // Parse target roles from comma-separated string
  const targetRoles = targetRolesRaw ? targetRolesRaw.split(",").filter(Boolean) : [];

  if (!message) {
    throw new Error("A mensagem é obrigatória");
  }
  if (!notifyApp && !notifyWhatsapp) {
    throw new Error("Selecione pelo menos um canal de notificação");
  }

  let imageUrl = null;

  // Se houver uma imagem preenchida, fazemos o upload
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop() || 'jpg';
    const filePath = `notifications/${profile.church_id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('event_assets')
      .upload(filePath, imageFile);
      
    if (uploadError) {
      throw new Error(`Erro ao subir imagem: ${uploadError.message}`);
    }
    
    const { data: urlData } = supabase.storage
      .from('event_assets')
      .getPublicUrl(filePath);
      
    imageUrl = urlData.publicUrl;
  }

  const { error } = await supabase.from("event_notifications").insert({
    church_id: profile.church_id,
    event_id: eventId,
    sender_id: user.id,
    message,
    image_url: imageUrl,
    notify_app: notifyApp,
    notify_whatsapp: notifyWhatsapp,
    target_roles: targetRoles,
  });

  if (error) {
    throw new Error("Erro ao salvar notificação: " + error.message);
  }

  // AQUI: Chamar rotina assíncrona ou de AI/WhatsApp (Stub)
  console.log(`[NOTIFY] Simulando envio WhatsApp: ${notifyWhatsapp}, App: ${notifyApp} - Event ${eventId}`);

  revalidatePath("/dashboard/events");
}
