import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WhatsAppSettingsClient from "./WhatsAppSettingsClient";
import { getServerSession } from "@/lib/session";

export const metadata = {
  title: "Canal WhatsApp — Ligare",
  description: "Conecte o número oficial da sua igreja e centralize a comunicação.",
};

export default async function WhatsAppSettingsPage() {
  const session = await getServerSession();

  if (!session) redirect("/login");

  // Only admins can manage billing/whatsapp
  const adminRoles = ["super_admin", "admin"];
  // If we are testing with a user that is a platform admin, they get access 
  // explicitly because impersonate overrides their profile role to "admin" or they bypass check.
  const role = session.isImpersonating ? "admin" : session.profile.role;

  if (!adminRoles.includes(role)) {
    return (
      <div className="max-w-md mx-auto p-8 text-center card border border-[var(--glass-border)]">
        <p className="text-sm text-lg-text-muted">
          Apenas administradores podem acessar as configurações de cobrança.
        </p>
      </div>
    );
  }

  const { data: church } = await session.supabase
    .from("churches")
    .select("id, name")
    .eq("id", session.churchId)
    .single();

  const { data: subscription } = await session.supabase
    .from("subscriptions")
    .select("features")
    .eq("church_id", session.churchId)
    .single();

  return (
    <WhatsAppSettingsClient
      churchId={session.churchId}
      churchName={church?.name || "Igreja"}
      features={subscription?.features || {}}
    />
  );
}
