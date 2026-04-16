import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function getChurchId(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("church_id").eq("id", user.id).single();
  return data?.church_id ?? null;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const churchId = await getChurchId(supabase);
  if (!churchId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const formData = await req.formData();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

  let qr_code_url: string | null = null;
  const qrFile = formData.get("qr_code") as File | null;
  if (qrFile && qrFile.size > 0) {
    const ext = qrFile.name.split(".").pop();
    const path = `${churchId}/qr-codes/${Date.now()}.${ext}`;
    const { error: uploadErr, data: uploadData } = await supabase.storage
      .from("church_assets")
      .upload(path, qrFile, { upsert: true });
    if (!uploadErr && uploadData) {
      const { data: { publicUrl } } = supabase.storage.from("church_assets").getPublicUrl(path);
      qr_code_url = publicUrl;
    }
  }

  const { data, error } = await supabase
    .from("financial_accounts")
    .insert({
      church_id: churchId,
      name,
      type: formData.get("type") || "checking",
      initial_balance: parseFloat(formData.get("initial_balance") as string) || 0,
      pix_key: (formData.get("pix_key") as string)?.trim() || null,
      qr_code_url,
      bank_code: (formData.get("bank_code") as string)?.trim() || null,
      bank_name: (formData.get("bank_name") as string)?.trim() || null,
      agency: (formData.get("agency") as string)?.trim() || null,
      account_number: (formData.get("account_number") as string)?.trim() || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 });
  return NextResponse.json({ data });
}
