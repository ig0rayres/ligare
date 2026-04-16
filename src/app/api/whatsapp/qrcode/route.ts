import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getQrCode } from "@/lib/hellopaco/client";

/**
 * GET /api/whatsapp/qrcode
 * Internal proxy: fetches QR Code from Hello Paco and returns it to the church dashboard.
 * Protects the HELLO_PACO_BEARER_TOKEN from being exposed to the client.
 */
export async function GET(_req: NextRequest) {
  const supabase = await createClient();

  // 1. Auth guard
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // 2. Fetch the church's WhatsApp instance_id from subscriptions.features
  const { data: profile } = await supabase
    .from("profiles")
    .select("church_id")
    .eq("id", user.id)
    .single();

  if (!profile?.church_id) {
    return NextResponse.json({ error: "Igreja não encontrada" }, { status: 404 });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("features")
    .eq("church_id", profile.church_id)
    .single();

  const instanceId = subscription?.features?.hp_instance_id as string | undefined;

  if (!instanceId) {
    return NextResponse.json(
      { error: "Canal WhatsApp não provisionado para esta igreja." },
      { status: 404 }
    );
  }

  // 3. Proxy call to Hello Paco
  try {
    const qrData = await getQrCode(instanceId);
    return NextResponse.json({ success: true, data: qrData });
  } catch (err: any) {
    console.error("[/api/whatsapp/qrcode]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
