import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TenantsClient from "./TenantsClient";

export const metadata = {
  title: "Tenants — Ligare Master",
  description: "Gestão de igrejas clientes da plataforma Ligare.",
};

export default async function TenantsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_platform_admin) redirect("/dashboard");

  const { data: tenants } = await supabase
    .from("churches")
    .select(`
      id, name, subdomain, email, phone, city, state, logo_url,
      created_at,
      subscriptions (
        plan, status, current_period_end, mrr
      )
    `)
    .order("created_at", { ascending: false });

  return <TenantsClient tenants={tenants || []} />;
}
