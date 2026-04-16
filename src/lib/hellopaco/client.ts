const BASE_URL = process.env.HELLO_PACO_API_URL || "https://ww2.hellopaco.com.br";
const BEARER_TOKEN = process.env.HELLO_PACO_BEARER_TOKEN || "";
const WHATSAPP_CATALOG_ID = "15b415cc-4e77-4bf7-8798-d4443505c83b";

function headers() {
  return {
    "Authorization": `Bearer ${BEARER_TOKEN}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
}

export interface HelloPacoInstance {
  id: string;
  name: string;
  session_name: string;
  connection_status: "QRCODE" | "CONNECTED" | "DISCONNECTED";
  base64?: string;
}

/** Step 1 – Purchase 1 WhatsApp quota slot for the partner (Ligare) */
export async function purchaseAddon(quantity = 1) {
  const res = await fetch(`${BASE_URL}/api/v1/addons/purchase`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ catalogItemId: WHATSAPP_CATALOG_ID, quantity }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[HelloPaco] purchaseAddon failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<{ success: boolean; data: Record<string, unknown> }>;
}

/** Step 2 – Allocate an WAHA instance using the purchased slot */
export async function createInstance(churchName: string, churchId: string, webhookUrl?: string) {
  const body: Record<string, string> = {
    name: churchName,
    external_device_id: churchId,
  };
  if (webhookUrl) body.custom_webhook_url = webhookUrl;

  const res = await fetch(`${BASE_URL}/api/v1/instances`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[HelloPaco] createInstance failed (${res.status}): ${text}`);
  }

  const json = await res.json() as { success: boolean; data: { id: string; session_name: string } };
  if (!json.success) throw new Error("[HelloPaco] createInstance: API returned success=false");
  return json.data;
}

/** Step 3 – Fetch QR Code (base64) for the given instance */
export async function getQrCode(instanceId: string): Promise<HelloPacoInstance> {
  const res = await fetch(`${BASE_URL}/api/v1/instances/${instanceId}/qrcode`, {
    method: "GET",
    headers: headers(),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[HelloPaco] getQrCode failed (${res.status}): ${text}`);
  }

  const json = await res.json() as { success: boolean; data: HelloPacoInstance };
  return json.data;
}

/** List all instances (for admin monitoring) */
export async function listInstances() {
  const res = await fetch(`${BASE_URL}/api/v1/instances`, {
    method: "GET",
    headers: headers(),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[HelloPaco] listInstances failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<{ success: boolean; data: HelloPacoInstance[] }>;
}
