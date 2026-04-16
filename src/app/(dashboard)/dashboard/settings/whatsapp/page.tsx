import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WhatsAppSettingsClient from "./WhatsAppSettingsClient";

export const metadata = {
  title: "Canal WhatsApp — Ligare",
  description: "Conecte o número oficial da sua igreja e centralize a comunicação.",
};

export default async function WhatsAppSettingsPage() {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("church_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.church_id) redirect("/dashboard");

  // Only admins can manage billing
  const adminRoles = ["super_admin", "admin"];
  if (!adminRoles.includes(profile.role)) {
    return (
      <div className="max-w-md mx-auto p-8 text-center card border border-[var(--glass-border)]">
        <p className="text-sm text-lg-text-muted">
          Apenas administradores podem acessar as configurações de cobrança.
        </p>
      </div>
    );
  }

  const { data: church } = await supabase
    .from("churches")
    .select("id, name")
    .eq("id", profile.church_id)
    .single();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("features")
    .eq("church_id", profile.church_id)
    .single();

  return (
    <WhatsAppSettingsClient
      churchId={profile.church_id}
      churchName={church?.name || "Igreja"}
      features={subscription?.features || {}}
    />
  );
}
