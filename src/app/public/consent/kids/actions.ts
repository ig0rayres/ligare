"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function signImageRightsConsent(kidId: string, token: string) {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    
    // Attempt to grab IP or fallback
    const forwardedFor = headersList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0] : "unknown-ip";

    // 1. Verify token
    const { data: kid, error: kidError } = await supabase
      .from("kids")
      .select("id, image_rights_status, full_name")
      .eq("id", kidId)
      .eq("image_rights_token", token)
      .single();

    if (kidError || !kid) {
      return { success: false, message: "Link inválido ou expirado." };
    }

    if (kid.image_rights_status === "approved_digital") {
      return { success: false, message: "Este termo já foi assinado digitalmente." };
    }

    // 2. Perform digital signature recording
    const { error: updateError } = await supabase
      .from("kids")
      .update({
        image_rights_status: "approved_digital",
        image_rights_signed_at: new Date().toISOString(),
        image_rights_ip: ip
      })
      .eq("id", kidId)
      .eq("image_rights_token", token);

    if (updateError) {
      return { success: false, message: "Ocorreu um erro ao registrar a assinatura." };
    }

    // Since this affects admin dashboards, revalidate the kids list area.
    revalidatePath("/dashboard/kids/criancas");
    revalidatePath("/dashboard/kids/checkin");

    return { success: true };
  } catch (error) {
    return { success: false, message: "Falha de comunicação no servidor." };
  }
}
