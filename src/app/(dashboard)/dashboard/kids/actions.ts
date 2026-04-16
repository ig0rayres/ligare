"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { WhatsAppService } from "@/lib/whatsapp/service";

// ========================
// HELPERS
// ========================

async function getProfileChurchId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("church_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Perfil não encontrado");
  return { supabase, user, churchId: profile.church_id };
}

async function uploadPhoto(supabase: any, file: File, folder: string): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const ext = file.name.split(".").pop();
  const fileName = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("kids")
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const { data } = supabase.storage.from("kids").getPublicUrl(fileName);
  return data.publicUrl;
}

// ========================
// CLASSROOMS (Salas)
// ========================

export async function getClassrooms() {
  try {
    const { supabase, churchId } = await getProfileChurchId();
    const { data, error } = await supabase
      .from("kids_classrooms")
      .select("*")
      .eq("church_id", churchId)
      .order("created_at", { ascending: true });
    return { data, error };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

export async function createClassroom(formData: FormData) {
  const { supabase, churchId } = await getProfileChurchId();

  const name = formData.get("name") as string;
  const age_range = formData.get("age_range") as string;
  const description = formData.get("description") as string;
  const photo = formData.get("photo") as File;

  if (!name?.trim()) throw new Error("Nome é obrigatório");

  const photo_url = await uploadPhoto(supabase, photo, "classrooms");

  const { error } = await supabase
    .from("kids_classrooms")
    .insert([{ church_id: churchId, name: name.trim(), age_range: age_range || null, description: description || null, photo_url }]);

  if (error) {
    if (error.code === "23505") throw new Error("Já existe uma sala com esse nome.");
    throw new Error("Erro ao criar sala");
  }

  revalidatePath("/dashboard/kids/salas");
}

export async function updateClassroom(id: string, formData: FormData) {
  const { supabase } = await getProfileChurchId();

  const name = formData.get("name") as string;
  const age_range = formData.get("age_range") as string;
  const description = formData.get("description") as string;
  const photo = formData.get("photo") as File;

  if (!name?.trim()) throw new Error("Nome é obrigatório");

  const updateData: any = {
    name: name.trim(),
    age_range: age_range || null,
    description: description || null,
    updated_at: new Date().toISOString(),
  };

  if (photo && photo.size > 0) {
    const photo_url = await uploadPhoto(supabase, photo, "classrooms");
    if (photo_url) updateData.photo_url = photo_url;
  }

  const { error } = await supabase
    .from("kids_classrooms")
    .update(updateData)
    .eq("id", id);

  if (error) {
    if (error.code === "23505") throw new Error("Já existe uma sala com esse nome.");
    throw new Error("Erro ao atualizar sala");
  }

  revalidatePath("/dashboard/kids/salas");
}

export async function toggleClassroomActive(id: string, is_active: boolean) {
  const { supabase } = await getProfileChurchId();
  const { error } = await supabase.from("kids_classrooms").update({ is_active, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error("Erro ao alterar status");
  revalidatePath("/dashboard/kids/salas");
}

export async function deleteClassroom(id: string) {
  const { supabase } = await getProfileChurchId();
  const { error } = await supabase.from("kids_classrooms").delete().eq("id", id);
  if (error) throw new Error("Erro ao excluir sala. Verifique se não há crianças vinculadas.");
  revalidatePath("/dashboard/kids/salas");
}

// ========================
// KIDS (Crianças)
// ========================

export async function getKids() {
  try {
    const { supabase, churchId } = await getProfileChurchId();
    const { data, error } = await supabase
      .from("kids")
      .select(`
        *,
        classroom:kids_classrooms(id, name),
        guardians:kids_guardians(id, guardian_id, relationship, is_primary, guardian:church_members(id, full_name, phone:whatsapp))
      `)
      .eq("church_id", churchId)
      .order("full_name", { ascending: true });
    return { data, error };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

export async function createKid(formData: FormData) {
  const { supabase, churchId } = await getProfileChurchId();

  const full_name = formData.get("full_name") as string;
  const birth_date = formData.get("birth_date") as string;
  const allergies = formData.get("allergies") as string;
  const medical_notes = formData.get("medical_notes") as string;
  const classroom_id = formData.get("classroom_id") as string;
  const image_rights_status = (formData.get("image_rights_status") as string) || "pending";
  const photo = formData.get("photo") as File;
  const guardians_json = formData.get("guardians") as string;

  if (!full_name?.trim()) throw new Error("Nome é obrigatório");

  const photo_url = await uploadPhoto(supabase, photo, "kids");
  
  // Generate a fixed, unique short QR code
  const qr_code = `KID-LIG-${crypto.randomUUID().split("-")[0].toUpperCase()}`;
  
  // Create token for digital signature if requested
  const image_rights_token = image_rights_status === "pending" ? crypto.randomUUID() : null;

  const { data, error } = await supabase
    .from("kids")
    .insert([{
      church_id: churchId,
      full_name: full_name.trim(),
      birth_date: birth_date || null,
      allergies: allergies || null,
      medical_notes: medical_notes || null,
      classroom_id: classroom_id || null,
      image_rights_status,
      image_rights_token,
      qr_code,
      photo_url,
      status: "approved",
    }])
    .select("id, full_name, qr_code, image_rights_token")

  if (error) {
    console.error("Supabase Insert Error in createKid:", error);
    throw new Error(`[SupaErr ${error.code}]: ${error.message} - Detalhes: ${error.details || ""}`);
  }

  if (!data || data.length === 0) {
    throw new Error(`[PGRST116]: Sucesso no banco, mas bloqueado na leitura por causa da RLS do '.select()'.`);
  }

  const kid = data[0];

  // Add guardians
  if (guardians_json && kid) {
    try {
      const guardians = JSON.parse(guardians_json) as Array<{ guardian_id: string; relationship: string; is_primary: boolean }>;
      if (guardians.length > 0) {
        await supabase.from("kids_guardians").insert(
          guardians.map((g) => ({ kid_id: kid.id, guardian_id: g.guardian_id, relationship: g.relationship, is_primary: g.is_primary }))
        );
        
        // Find the primary guardian to send WhatsApp message
        const primaryGuardian = guardians.find(g => g.is_primary) || guardians[0];
        if (primaryGuardian) {
          const { data: profile } = await supabase
            .from("church_members")
            .select("full_name, whatsapp")
            .eq("id", primaryGuardian.guardian_id)
            .single();
            
          if (profile && profile.whatsapp) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            const consentLink = image_rights_status === "pending" && kid.image_rights_token 
              ? `${appUrl}/public/consent/kids/${kid.id}/${kid.image_rights_token}`
              : undefined;

            await WhatsAppService.sendKidsWelcomeCard(
              churchId,
              profile.whatsapp,
              profile.full_name,
              kid.full_name,
              kid.qr_code,
              consentLink
            );
          }
        }
      }
    } catch {}
  }

  revalidatePath("/dashboard/kids/criancas");
}

export async function updateKidStatus(id: string, status: "approved" | "rejected") {
  const { supabase } = await getProfileChurchId();
  const { error } = await supabase.from("kids").update({ status }).eq("id", id);
  if (error) throw new Error("Erro ao atualizar status");
  revalidatePath("/dashboard/kids/criancas");
  revalidatePath("/dashboard/kids");
}

export async function deleteKid(id: string) {
  const { supabase } = await getProfileChurchId();
  // Delete guardians first (cascade should handle, but just in case)
  await supabase.from("kids_guardians").delete().eq("kid_id", id);
  const { error } = await supabase.from("kids").delete().eq("id", id);
  if (error) throw new Error("Erro ao excluir criança");
  revalidatePath("/dashboard/kids/criancas");
}

// ========================
// MEMBERS (for guardian selection)
// ========================

export async function getChurchMembers() {
  try {
    const { supabase, churchId } = await getProfileChurchId();
    const { data } = await supabase
      .from("church_members")
      .select("id, user_id, full_name, whatsapp, cpf")
      .eq("church_id", churchId)
      .eq("status", "active")
      .order("full_name");
      
    // Map name to full_name and phone is already phone mapped correctly
    return (data || []).map(m => ({ 
      id: m.id, 
      user_id: m.user_id,
      full_name: m.full_name, 
      phone: m.whatsapp,
      is_auth: false,
      cpf: m.cpf
    }));
  } catch {
    return [];
  }
}

export async function createQuickGuardian(formData: FormData) {
  const { supabase, churchId } = await getProfileChurchId();

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const cpf = (formData.get("cpf") as string)?.replace(/\D/g, ""); // Apenas números

  if (!name || !cpf) throw new Error("Nome e CPF são obrigatórios");

  const { data, error } = await supabase
    .from("church_members")
    .insert({
      church_id: churchId,
      full_name: name,
      whatsapp: phone || null,
      cpf: cpf,
      status: "active"
    })
    .select("id, full_name, whatsapp, cpf");

  if (error) {
    console.error("Supabase Insert Error in createQuickGuardian:", error);
    if (error.code === "23505" || error.message.includes("unique")) throw new Error("Já existe uma pessoa cadastrada com este CPF.");
    throw new Error(`[SupaErr ${error.code}]: ${error.message} - Detalhes: ${error.details || ""}`);
  }

  if (!data || data.length === 0) {
     throw new Error(`[PGRST116]: O insert funcionou, mas a linha não foi retornada (Falha no SELECT RLS Pós-Insert).`);
  }

  const inserted = data[0];
  revalidatePath("/dashboard/kids/criancas");
  return { id: inserted.id, full_name: inserted.full_name, phone: inserted.whatsapp, is_auth: false, cpf: inserted.cpf };
}

// ========================
// SCHEDULES (Escalas) — Linked to Events
// ========================

export async function getSchedules() {
  try {
    const { supabase, churchId } = await getProfileChurchId();
    const { data, error } = await supabase
      .from("kids_schedule")
      .select(`
        *,
        service_date,
        event:events(id, title, starts_at, recurrence_type, recurrence_day),
        staff:kids_schedule_staff(id, profile_id, role, confirmed, classroom:kids_classrooms(id, name), profile:profiles(id, full_name))
      `)
      .order("created_at", { ascending: false });

    return { data, error };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

export async function createSchedule(formData: FormData) {
  const { supabase, churchId } = await getProfileChurchId();

  const event_id = formData.get("event_id") as string;
  const service_date = formData.get("service_date") as string;
  const notes = formData.get("notes") as string;
  const staff_json = formData.get("staff") as string;
  const material_text = formData.get("support_material_text") as string;
  const material_files = formData.getAll("support_material_files") as File[];

  if (!event_id || !service_date) throw new Error("Data e Evento são obrigatórios");

  const support_material_urls: string[] = [];
  for (const file of material_files) {
    if (file && file.size > 0) {
      if (file.size > 20 * 1024 * 1024) throw new Error("Cada arquivo de material deve ter no máximo 20MB.");
      const url = await uploadPhoto(supabase, file, "schedules");
      if (url) support_material_urls.push(url);
    }
  }

  const { data: schedule, error } = await supabase
    .from("kids_schedule")
    .insert([{ 
      church_id: churchId, 
      event_id, 
      service_date, 
      notes: notes || null,
      support_material_text: material_text || null,
      support_materials: support_material_urls
    }])
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("Já existe uma escala salva para este evento nesta data. Exclua a aba existente para refazer.");
    throw new Error("Erro ao criar escala base");
  }

  // Add staff and send notifications
  if (staff_json && schedule) {
    const staff = JSON.parse(staff_json) as Array<{ profile_id: string; role: string; classroom_id: string | null }>;
    const validStaff = staff.filter((s) => s.profile_id && s.role);
    
    if (validStaff.length > 0) {
      const { error: staffError } = await supabase.from("kids_schedule_staff").insert(
        validStaff.map((s) => ({ schedule_id: schedule.id, profile_id: s.profile_id, role: s.role, classroom_id: s.classroom_id || null }))
      );
      
      if (staffError) {
        await supabase.from("kids_schedule").delete().eq("id", schedule.id);
        throw new Error("Erro ao adicionar equipe: " + staffError.message);
      }

      // Get event info for notifications
      const { data: eventData } = await supabase.from("events").select("title, starts_at").eq("id", event_id).single();

      // Notifications logic
      for (const s of validStaff) {
        if (!s.profile_id) continue;
        try {
          // Find classroom name dynamically
           let roomName = "Apoio Geral";
           if (s.classroom_id) {
               const { data: c } = await supabase.from("kids_classrooms").select("name").eq("id", s.classroom_id).single();
               if (c) roomName = c.name;
           }

          // In-app notification
          await supabase.from("notifications").insert({
            church_id: churchId,
            recipient_id: s.profile_id,
            title: "📋 Nova Escala Kids",
            body: `Você foi escalado(a) como ${s.role === 'kids_leader' ? 'Líder' : 'Auxiliar'} >> ${roomName} no evento ${eventData?.title || 'Kids'}.${support_material_urls.length > 0 ? '\n📚 Material de apoio anexado na escala!' : ''}`,
            type: "schedule",
            reference_id: schedule.id,
            reference_type: "schedule",
          });

          // Fetch user phone details to potentially send WPP integration
          const { data: profileRow } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("id", s.profile_id)
            .single();

          if (profileRow?.phone) {
            const { WhatsAppService } = await import("@/lib/whatsapp/service");
            await WhatsAppService.enqueueMessage({
              churchId,
              recipientPhone: profileRow.phone,
              recipientName: profileRow.full_name,
              triggerEvent: "generic_alert",
              payload: {
                template: "schedule_notification",
                variables: {
                  staff_name: profileRow.full_name,
                  event_name: eventData?.title || "Evento",
                  classroom: roomName,
                  role: s.role === 'kids_leader' ? 'Líder Kids' : 'Auxiliar',
                  support_material_url: support_material_urls.join(" | "),
                  support_material_text: material_text || "",
                }
              }
            });
          }
        } catch (e: any) {
          console.error("Erro ao notificar staff:", e);
        }
      }
    }
  }

  return { success: true, schedule };
}

export async function deleteSchedule(id: string) {
  const { supabase } = await getProfileChurchId();
  await supabase.from("kids_schedule_staff").delete().eq("schedule_id", id);
  const { error } = await supabase.from("kids_schedule").delete().eq("id", id);
  if (error) throw new Error("Erro ao excluir escala");
  revalidatePath("/dashboard/kids/escalas");
}

// ========================
// KIDS COUNT PER CLASSROOM
// ========================

export async function getKidsCountByClassroom() {
  try {
    const { supabase, churchId } = await getProfileChurchId();
    const { data: kids } = await supabase
      .from("kids")
      .select("classroom_id")
      .eq("church_id", churchId)
      .eq("status", "approved");

    const counts: Record<string, number> = {};
    (kids || []).forEach((k) => {
      if (k.classroom_id) {
        counts[k.classroom_id] = (counts[k.classroom_id] || 0) + 1;
      }
    });
    return counts;
  } catch {
    return {};
  }
}

// ========================
// REPORTS (Relatórios)
// ========================

export async function getKidsReport(startDate: string, endDate: string) {
  try {
    const { supabase, churchId } = await getProfileChurchId();

    // Total kids
    const { count: totalKids } = await supabase
      .from("kids")
      .select("*", { count: "exact", head: true })
      .eq("church_id", churchId)
      .eq("status", "approved");

    // Checkins in period
    const { data: checkins } = await supabase
      .from("kids_checkins")
      .select("kid_id, classroom, checkin_time")
      .eq("church_id", churchId)
      .gte("checkin_time", startDate)
      .lte("checkin_time", endDate + "T23:59:59");

    // Kids per classroom
    const { data: classrooms } = await supabase
      .from("kids_classrooms")
      .select("id, name")
      .eq("church_id", churchId)
      .eq("is_active", true);

    const { data: kidsByClassroom } = await supabase
      .from("kids")
      .select("classroom_id")
      .eq("church_id", churchId)
      .eq("status", "approved");

    const classroomCounts = (classrooms || []).map((c) => ({
      name: c.name,
      count: (kidsByClassroom || []).filter((k) => k.classroom_id === c.id).length,
    }));

    // Alerts in period
    const { count: totalAlerts } = await supabase
      .from("kids_alerts")
      .select("*", { count: "exact", head: true })
      .eq("church_id", churchId)
      .gte("sent_at", startDate)
      .lte("sent_at", endDate + "T23:59:59");

    return {
      totalKids: totalKids || 0,
      totalCheckins: checkins?.length || 0,
      totalAlerts: totalAlerts || 0,
      classroomCounts,
      checkins: checkins || [],
    };
  } catch (e: any) {
    return { totalKids: 0, totalCheckins: 0, totalAlerts: 0, classroomCounts: [], checkins: [] };
  }
}

// ========================
// EVENTS DETECTION (Auto-detect active event)
// ========================

export async function getActiveEvents() {
  try {
    const { supabase, churchId } = await getProfileChurchId();
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentDayOfWeek = now.getDay().toString(); // 0=sun, 6=sat
    const currentDayOfMonth = now.getDate().toString();

    // Fetch all church events (church + kids scope)
    const { data: events } = await supabase
      .from("events")
      .select("id, title, starts_at, recurrence_type, recurrence_day, scope")
      .eq("church_id", churchId)
      .in("scope", ["church", "kids"]);

    if (!events || events.length === 0) return [];

    // Filter events that match today
    const todayEvents = events.filter(evt => {
      if (evt.recurrence_type === "once") {
        const evtDate = new Date(evt.starts_at).toISOString().split("T")[0];
        return evtDate === today;
      }
      if (evt.recurrence_type === "weekly") {
        return evt.recurrence_day === currentDayOfWeek;
      }
      if (evt.recurrence_type === "monthly") {
        return evt.recurrence_day === currentDayOfMonth;
      }
      return false;
    });

    // Sort by time proximity (closest event first)
    todayEvents.sort((a, b) => {
      const aTime = new Date(a.starts_at);
      const bTime = new Date(b.starts_at);
      // Extract just hours/minutes for comparison
      const aMinutes = aTime.getUTCHours() * 60 + aTime.getUTCMinutes();
      const bMinutes = bTime.getUTCHours() * 60 + bTime.getUTCMinutes();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      return Math.abs(aMinutes - nowMinutes) - Math.abs(bMinutes - nowMinutes);
    });

    return todayEvents;
  } catch {
    return [];
  }
}

export async function getKidsEvents() {
  try {
    const { supabase, churchId } = await getProfileChurchId();
    const { data } = await supabase
      .from("events")
      .select("id, title, starts_at, recurrence_type, recurrence_day, scope")
      .eq("church_id", churchId)
      .in("scope", ["church", "kids"])
      .order("starts_at", { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}

// ========================
// CHECK-IN / CHECK-OUT ENGINE
// ========================

export async function verifyQRCode(qrCode: string) {
  try {
    const { supabase, churchId } = await getProfileChurchId();

    // 1. Try to find an ACTIVE check-in with this QR as a WRISTBAND (qr_code_used)
    const { data: activeCheckin } = await supabase
      .from("kids_checkins")
      .select(`
        id, kid_id, classroom, checkin_time, qr_code_used, event_id,
        kid:kids(id, full_name, qr_code, image_rights_status, photo_url,
          guardians:kids_guardians(id, relationship, is_primary, guardian:church_members(id, full_name, phone:whatsapp))
        )
      `)
      .eq("church_id", churchId)
      .eq("status", "checked_in")
      .eq("qr_code_used", qrCode)
      .single();

    if (activeCheckin) {
      return { 
        success: true, 
        action: "CHECKOUT", 
        checkin: activeCheckin,
        kid: activeCheckin.kid 
      };
    }

    // 2. Try to find if this QR is a FIXED ID of a Kid
    const { data: kidByQR } = await supabase
      .from("kids")
      .select(`
        id, full_name, qr_code, image_rights_status, photo_url,
        classroom:kids_classrooms(id, name),
        guardians:kids_guardians(id, relationship, is_primary, guardian:church_members(id, full_name, phone:whatsapp))
      `)
      .eq("church_id", churchId)
      .eq("qr_code", qrCode)
      .single();

    if (kidByQR) {
      const { data: kidActiveSession } = await supabase
        .from("kids_checkins")
        .select("id, kid_id, classroom, checkin_time, qr_code_used, event_id")
        .eq("church_id", churchId)
        .eq("kid_id", kidByQR.id)
        .eq("status", "checked_in")
        .maybeSingle();

      if (kidActiveSession) {
        return {
          success: true,
          action: "CHECKOUT",
          checkin: kidActiveSession,
          kid: kidByQR
        };
      } else {
        return {
          success: true,
          action: "CHECKIN",
          kid: kidByQR
        };
      }
    }

    // 3. Not found
    return { success: false, message: "QR Code desconhecido. Se for uma nova pulseira, busque a criança na interface para dar o check-in." };

  } catch (e: any) {
    return { success: false, message: "Erro de rede ao validar QR Code." };
  }
}

export async function registerCheckin(formData: FormData) {
  const { supabase, churchId, user } = await getProfileChurchId();

  const kid_id = formData.get("kid_id") as string;
  const classroom_id = formData.get("classroom_id") as string;
  const wristband_code = formData.get("wristband_code") as string;
  const event_id = formData.get("event_id") as string;
  
  if (!kid_id || !classroom_id) throw new Error("Criança e Sala são obrigatórios.");

  const { data: classroomData } = await supabase.from("kids_classrooms").select("name").eq("id", classroom_id).single();
  const classroomName = classroomData?.name || "Sala";

  const { error } = await supabase.from("kids_checkins").insert([{
    church_id: churchId,
    kid_id,
    classroom: classroomName,
    checked_in_by: user.id,
    qr_code_used: wristband_code || null,
    event_id: event_id || null,
    status: "checked_in",
  }]);

  if (error) throw new Error("Erro no banco de dados ao processar Check-in.");
  
  revalidatePath("/dashboard/kids/checkin");
  revalidatePath("/dashboard/kids");
  return { success: true };
}

export async function processCheckout(checkinId: string, guardianId: string | null) {
  const { supabase, churchId, user } = await getProfileChurchId();

  const { error } = await supabase
    .from("kids_checkins")
    .update({
      status: "checked_out",
      checkout_time: new Date().toISOString(),
      checked_out_by: user.id,
      guardian_id: guardianId || null,
      checkout_note: "Check-out via App"
    })
    .eq("id", checkinId)
    .eq("church_id", churchId);

  if (error) throw new Error("Erro ao validar Check-out no banco.");

  revalidatePath("/dashboard/kids/checkin");
  revalidatePath("/dashboard/kids");
  return { success: true };
}

// ========================
// NOTIFICATIONS
// ========================

export async function getUnreadNotifications() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", user.id)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(20);

    return data || [];
  } catch {
    return [];
  }
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);
  revalidatePath("/dashboard");
}
  // End of actions.ts
