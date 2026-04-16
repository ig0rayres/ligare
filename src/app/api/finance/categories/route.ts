import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function getChurchId(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("church_id").eq("id", user.id).single();
  return data?.church_id ?? null;
}

// POST /api/finance/categories — criar nova categoria
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const churchId = await getChurchId(supabase);
  if (!churchId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

  const { data, error } = await supabase
    .from("financial_categories")
    .insert({ church_id: churchId, name: body.name.trim(), type: body.type, color: body.color })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 });
  return NextResponse.json({ data });
}
