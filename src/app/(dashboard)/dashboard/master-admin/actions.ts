"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export async function impersonateTenant(churchId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("Não autorizado")
  }

  // Validar se usuário possui flag master
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin, church_id")
    .eq("id", user.id)
    .single()

  if (!profile?.is_platform_admin) {
    throw new Error("Usuário não possui privilégios arquiteturais de Impersonation.")
  }

  const cookieStore = await cookies();
  
  // Guardamos o church_id nativo dele em cookie seainda não foi setado 
  // (para n perder original de um double-impersonation)
  const currentOriginal = cookieStore.get("lg_original_church_id")
  if (!currentOriginal) {
    cookieStore.set("lg_original_church_id", profile.church_id || "master", { 
        path: "/", 
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 60 * 60 * 24 // 1 day
    })
  }
  
  // Set in cookie that we are impersonating to show the warning banner across UX
  cookieStore.set("lg_is_impersonating", "true", { 
      path: "/", 
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,
      maxAge: 60 * 60 * 24 
  })

  // Hack Principal: Force Update RLS-Context ChurchID in profiles table
  await supabase
    .from("profiles")
    .update({ church_id: churchId })
    .eq("id", user.id)

  // Redirect into normal dashboard scope (now viewing as Tenant)
  redirect("/dashboard")
}

export async function leaveImpersonate() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
    
  const cookieStore = await cookies();
  const originalChurchId = cookieStore.get("lg_original_church_id")?.value
  
  if (originalChurchId && originalChurchId !== "master") {
      // Devolve para o Church_ID base do Master Admin
      await supabase
        .from("profiles")
        .update({ church_id: originalChurchId })
        .eq("id", user.id)
  }

  cookieStore.delete("lg_original_church_id")
  cookieStore.delete("lg_is_impersonating")
  
  redirect("/dashboard/master-admin")
}
