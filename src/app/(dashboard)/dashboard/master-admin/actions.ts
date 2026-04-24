"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

/**
 * Magic Link Impersonation: Sets secure cookies to view as a tenant.
 * NO database modifications — purely cookie-based context switching.
 */
export async function impersonateTenant(churchId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("Não autorizado")
  }

  // SECURITY: Validate platform admin from the database
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_platform_admin) {
    throw new Error("Sem privilégios de Platform Admin.")
  }

  // Validate that the target church exists
  const { data: church } = await supabase
    .from("churches")
    .select("id, name")
    .eq("id", churchId)
    .single()

  if (!church) {
    throw new Error("Igreja não encontrada.")
  }

  const cookieStore = await cookies();
  
  // Set impersonation cookies — NO database changes
  cookieStore.set("lg_impersonating_church_id", churchId, { 
    path: "/", 
    secure: process.env.NODE_ENV === "production",
    httpOnly: false, // Client layout needs to read this for church context
    sameSite: "lax",
    maxAge: 60 * 60 * 8 // 8 hours max — auto-expires for safety
  })

  cookieStore.set("lg_is_impersonating", "true", { 
    path: "/", 
    secure: process.env.NODE_ENV === "production",
    httpOnly: false, // Client layout needs this for banner
    sameSite: "lax",
    maxAge: 60 * 60 * 8
  })

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

/**
 * Leave Impersonation: Clears cookies and returns to Master Admin.
 * NO database changes needed — just clear the context.
 */
export async function leaveImpersonate() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
    
  const cookieStore = await cookies();
  
  // Simply clear impersonation cookies — no DB revert needed
  cookieStore.delete("lg_impersonating_church_id")
  cookieStore.delete("lg_is_impersonating")
  
  revalidatePath("/", "layout")
  redirect("/dashboard/master-admin")
}
