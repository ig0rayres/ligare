import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PlansClient from "./PlansClient";

export const metadata = {
  title: "Planos & Add-ons — Ligare Master",
  description: "Gerencie planos base, catálogo de módulos e regras de billing da plataforma.",
};

export default async function PlansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_platform_admin) redirect("/dashboard");

  const [plansRes, addonsRes, linksRes] = await Promise.all([
    supabase
      .from("platform_plans")
      .select("*")
      .order("sort_order"),
    supabase
      .from("platform_addons")
      .select("*")
      .order("sort_order"),
    supabase
      .from("plans_addons_link")
      .select("*"),
  ]);

  return (
    <PlansClient
      plans={plansRes.data || []}
      addons={addonsRes.data || []}
      links={linksRes.data || []}
    />
  );
}
