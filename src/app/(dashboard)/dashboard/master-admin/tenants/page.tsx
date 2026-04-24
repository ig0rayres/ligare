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

  const [churchesRes, subsRes] = await Promise.all([
    supabase
      .from("churches")
      .select("id, name, subdomain, email, phone, city, state, logo_url, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("church_id, plan, status, current_period_end, mrr")
  ]);

  const churches = churchesRes.data || [];
  const subs = subsRes.data || [];

  const tenants = churches.map((church) => {
    const churchSubs = subs.filter((s) => s.church_id === church.id);
    return {
      ...church,
      subscriptions: churchSubs
    };
  });

  return <TenantsClient tenants={tenants} />;
}
