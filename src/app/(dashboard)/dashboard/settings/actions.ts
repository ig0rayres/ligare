"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateChurchSettings(
  churchId: string,
  data: { name: string; primary_color: string; secondary_color: string; cell_term?: string }
) {
  const supabase = await createClient();
  
  const { data: updated, error } = await supabase
    .from("churches")
    .update({
       name: data.name,
       primary_color: data.primary_color,
       secondary_color: data.secondary_color,
       cell_term: data.cell_term
    })
    .eq("id", churchId)
    .select()
    .single();

  if (error || !updated) {
    throw new Error(error?.message || "Sem permissão para atualizar esta igreja (RLS).");
  }
  revalidatePath("/", "layout"); // Revalidate entire app to apply new CSS variables
}

export async function uploadChurchLogo(churchId: string, formData: FormData) {
  const supabase = await createClient();
  const file = formData.get("file") as File;
  
  if (!file) throw new Error("Arquivo não encontrado");

  const fileExt = file.name.split('.').pop();
  const filePath = `${churchId}/logo_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("church_assets")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  const { data: { publicUrl } } = supabase.storage
    .from("church_assets")
    .getPublicUrl(filePath);

  const { data: updated, error: dbError } = await supabase
    .from("churches")
    .update({ logo_url: publicUrl })
    .eq("id", churchId)
    .select()
    .single();

  if (dbError || !updated) {
    throw new Error(dbError?.message || "Sem permissão para atualizar logo desta igreja (RLS).");
  }
  
  revalidatePath("/", "layout");
  return publicUrl;
}
