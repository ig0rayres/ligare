import { redirect } from "next/navigation";
import ConfigClient from "./ConfigClient";
import { getServerSession } from "@/lib/session";

export default async function SettingsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  // TODO: Em projetos reais, checar se a role desse usuário na `church_members` é administrador da igreja.
  // Como simplificação via contexto Ligare, todo usuário logado associado vai poder ver configurações.

  const { data: church } = await session.supabase
    .from("churches")
    .select("id, name, logo_url, primary_color, secondary_color, cell_term")
    .eq("id", session.churchId)
    .single();

  if (!church) {
    return <p className="p-6 text-red-500">Igreja não encontrada no banco.</p>;
  }

  return <ConfigClient church={church} />;
}
