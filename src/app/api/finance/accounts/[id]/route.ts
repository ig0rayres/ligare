import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function getChurchId(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("church_id").eq("id", user.id).single();
  return data?.church_id ?? null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const churchId = await getChurchId(supabase);
  const { id } = await params;
  if (!churchId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const formData = await req.formData();

  let qr_code_url: string | undefined = undefined;
  const qrFile = formData.get("qr_code") as File | null;
  if (qrFile && qrFile.size > 0) {
    const ext = qrFile.name.split(".").pop();
    const path = `${churchId}/qr-codes/${id}.${ext}`;
    const { error: uploadErr, data: uploadData } = await supabase.storage
      .from("church_assets")
      .upload(path, qrFile, { upsert: true });
    if (!uploadErr && uploadData) {
      const { data: { publicUrl } } = supabase.storage.from("church_assets").getPublicUrl(path);
      qr_code_url = publicUrl;
    }
  }

  const updatePayload: Record<string, any> = {
    name: (formData.get("name") as string)?.trim(),
    type: formData.get("type"),
    initial_balance: parseFloat(formData.get("initial_balance") as string) || 0,
    pix_key: (formData.get("pix_key") as string)?.trim() || null,
    bank_code: (formData.get("bank_code") as string)?.trim() || null,
    bank_name: (formData.get("bank_name") as string)?.trim() || null,
    agency: (formData.get("agency") as string)?.trim() || null,
    account_number: (formData.get("account_number") as string)?.trim() || null,
  };
  if (qr_code_url !== undefined) updatePayload.qr_code_url = qr_code_url;

  const { error } = await supabase
    .from("financial_accounts")
    .update(updatePayload)
    .eq("id", id)
    .eq("church_id", churchId);

  if (error) return NextResponse.json({ error: "Erro ao atualizar conta" }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const churchId = await getChurchId(supabase);
  const { id } = await params;
  if (!churchId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { error } = await supabase
    .from("financial_accounts")
    .update({ is_active: false })
    .eq("id", id)
    .eq("church_id", churchId);

  if (error) return NextResponse.json({ error: "Erro ao desativar conta" }, { status: 500 });
  return NextResponse.json({ success: true });
}
