import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { activateWhatsAppForChurch } from "@/app/(dashboard)/dashboard/settings/whatsapp/actions";

const WEBHOOK_SECRET = process.env.ASAAS_WEBHOOK_SECRET || "";

/**
 * POST /api/asaas/webhook
 * Receives Asaas payment events and provisions WhatsApp on confirmation.
 */
export async function POST(req: NextRequest) {
  // 1. Validate webhook signature token (simple header check)
  const receivedToken = req.headers.get("asaas-access-token");
  if (WEBHOOK_SECRET && receivedToken !== WEBHOOK_SECRET) {
    console.warn("[Asaas Webhook] Unauthorized call — token mismatch");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { event, payment } = body as {
    event: string;
    payment?: { externalReference?: string; status?: string };
  };

  console.log(`[Asaas Webhook] Event received: ${event}`);

  // 2. Only act on confirmed payments
  if (event !== "PAYMENT_RECEIVED" && event !== "PAYMENT_CONFIRMED") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const churchId = payment?.externalReference;
  if (!churchId) {
    console.error("[Asaas Webhook] No externalReference (churchId) in payment.");
    return NextResponse.json({ error: "No church reference" }, { status: 400 });
  }

  // 3. Check if already active to avoid double-provisioning
  const supabase = await createClient();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("features")
    .eq("church_id", churchId)
    .single();

  if (sub?.features?.whatsapp_active === true) {
    console.log(`[Asaas Webhook] WhatsApp already active for church ${churchId}. Skipping.`);
    return NextResponse.json({ ok: true, skipped: "already_active" });
  }

  // 4. Provision Hello Paco instance
  try {
    await activateWhatsAppForChurch(churchId);
    console.log(`[Asaas Webhook] WhatsApp provisioned successfully for church ${churchId}`);
  } catch (err: any) {
    console.error(`[Asaas Webhook] Provisioning failed for ${churchId}:`, err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
