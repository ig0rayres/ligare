import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ConfigClient from "./ConfigClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("church_id, is_platform_admin")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.church_id) {
    redirect("/dashboard");
  }

  // TODO: Em projetos reais, checar se a role desse usuário na `church_members` é administrador da igreja.
  // Como simplificação via contexto Ligare, todo usuário logado associado vai poder ver configurações.

  const { data: church } = await supabase
    .from("churches")
    .select("id, name, logo_url, primary_color, secondary_color, cell_term")
    .eq("id", profile.church_id)
    .single();

  if (!church) {
    return <p className="p-6 text-red-500">Igreja não encontrada no banco.</p>;
  }

  return <ConfigClient church={church} />;
}
