"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { purchaseAddon, createInstance } from "@/lib/hellopaco/client";

const ASAAS_BASE = process.env.ASAAS_API_URL || "https://sandbox.asaas.com/api/v3";
const ASAAS_KEY = process.env.ASAAS_API_KEY || "";

function asaasHeaders() {
  return {
    "access_token": ASAAS_KEY,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
}

async function getOrCreateAsaasCustomer(churchId: string, churchName: string, email: string) {
  const supabase = await createClient();

  // Check if already has a customer
  const { data: church } = await supabase
    .from("churches")
    .select("asaas_customer_id")
    .eq("id", churchId)
    .single();

  if (church?.asaas_customer_id) return church.asaas_customer_id as string;

  // Create Asaas customer with minimal required fields
  const res = await fetch(`${ASAAS_BASE}/customers`, {
    method: "POST",
    headers: asaasHeaders(),
    body: JSON.stringify({
      name: churchName,
      email: email,
      groupName: "Igrejas Ligare",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Asaas] createCustomer failed: ${text}`);
  }

  const json = await res.json() as { id: string };
  const customerId = json.id;

  // Save customer id
  await supabase
    .from("churches")
    .update({ asaas_customer_id: customerId })
    .eq("id", churchId);

  return customerId;
}

/**
 * Creates an Asaas PIX charge for the WhatsApp add-on (R$ 79.90/month).
 * Returns: { pixKey, qrCodeImage, chargeId }
 */
export async function createWhatsAppCharge(churchId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: church } = await supabase
    .from("churches")
    .select("name")
    .eq("id", churchId)
    .single();

  const churchName = church?.name || "Igreja";
  const userEmail = user.email || "contato@ligare.com.br";

  const customerId = await getOrCreateAsaasCustomer(churchId, churchName, userEmail);

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 1); // due tomorrow

  const res = await fetch(`${ASAAS_BASE}/payments`, {
    method: "POST",
    headers: asaasHeaders(),
    body: JSON.stringify({
      customer: customerId,
      billingType: "PIX",
      value: 79.90,
      dueDate: dueDate.toISOString().split("T")[0],
      description: "Canal WhatsApp Oficial — Ligare",
      externalReference: churchId, // used in webhook to identify church
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Asaas] createPayment failed: ${text}`);
  }

  const payment = await res.json() as {
    id: string;
    invoiceUrl: string;
    status: string;
  };

  // Get PIX QR Code
  const pixRes = await fetch(`${ASAAS_BASE}/payments/${payment.id}/pixQrCode`, {
    method: "GET",
    headers: asaasHeaders(),
  });

  let pixPayload = null;
  if (pixRes.ok) {
    pixPayload = await pixRes.json() as { payload: string; encodedImage: string };
  }

  return {
    chargeId: payment.id,
    invoiceUrl: payment.invoiceUrl,
    pixKey: pixPayload?.payload || null,
    pixQrImage: pixPayload?.encodedImage || null,
  };
}

/**
 * Create a Credit Card charge session (returns payment link via Asaas).
 */
export async function createWhatsAppCreditCardLink(churchId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: church } = await supabase
    .from("churches")
    .select("name")
    .eq("id", churchId)
    .single();

  const churchName = church?.name || "Igreja";
  const userEmail = user.email || "contato@ligare.com.br";

  const customerId = await getOrCreateAsaasCustomer(churchId, churchName, userEmail);

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 1);

  const res = await fetch(`${ASAAS_BASE}/payments`, {
    method: "POST",
    headers: asaasHeaders(),
    body: JSON.stringify({
      customer: customerId,
      billingType: "UNDEFINED",
      value: 79.90,
      dueDate: dueDate.toISOString().split("T")[0],
      description: "Canal WhatsApp Oficial — Ligare",
      externalReference: churchId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Asaas] createCCPayment failed: ${text}`);
  }

  const payment = await res.json() as { id: string; invoiceUrl: string };

  return {
    chargeId: payment.id,
    invoiceUrl: payment.invoiceUrl,
  };
}

/**
 * Called by the Asaas Webhook after PAYMENT_RECEIVED.
 * Provisions Hello Paco instance and updates subscriptions.features.
 */
export async function activateWhatsAppForChurch(churchId: string) {
  const supabase = await createClient();

  const { data: church } = await supabase
    .from("churches")
    .select("name, subdomain")
    .eq("id", churchId)
    .single();

  if (!church) throw new Error("Igreja não encontrada para ativação do WhatsApp.");

  // Step 1: Purchase quota on Hello Paco
  await purchaseAddon(1);

  // Step 2: Create WAHA instance
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.ligare.com.br"}/api/whatsapp/waha-events`;
  const instance = await createInstance(church.name, churchId, webhookUrl);

  // Step 3: Persist instance_id in subscriptions.features
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("features")
    .eq("church_id", churchId)
    .single();

  const updatedFeatures = {
    ...(sub?.features || {}),
    whatsapp_active: true,
    hp_instance_id: instance.id,
    hp_session_name: instance.session_name,
    whatsapp_activated_at: new Date().toISOString(),
  };

  await supabase
    .from("subscriptions")
    .update({ features: updatedFeatures })
    .eq("church_id", churchId);

  revalidatePath("/dashboard/settings/whatsapp");
}
