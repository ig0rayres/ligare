import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side session helper.
 * Resolves the "effective" church_id considering impersonation state.
 * 
 * SECURITY: Only users with is_platform_admin=true can impersonate.
 * The impersonation is purely cookie-based — NO database changes.
 */
export async function getServerSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("church_id, role, is_platform_admin, full_name")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const cookieStore = await cookies();
  const impersonatingChurchId = cookieStore.get("lg_impersonating_church_id")?.value;
  const isImpersonatingCookie = cookieStore.get("lg_is_impersonating")?.value === "true";

  // Only allow impersonation if the user is a verified platform admin
  const isImpersonating = isImpersonatingCookie && !!impersonatingChurchId && profile.is_platform_admin;
  const effectiveChurchId = isImpersonating ? impersonatingChurchId! : profile.church_id;

  return {
    supabase,
    user,
    profile,
    churchId: effectiveChurchId,
    realChurchId: profile.church_id,
    isImpersonating,
    isPlatformAdmin: profile.is_platform_admin || false,
  };
}

/**
 * Guard: Throws if user is not a platform admin.
 * Use in server actions that require platform admin access.
 */
export async function requirePlatformAdmin() {
  const session = await getServerSession();
  if (!session) throw new Error("Não autenticado");
  if (!session.isPlatformAdmin) throw new Error("Sem privilégios de Platform Admin");
  return session;
}
