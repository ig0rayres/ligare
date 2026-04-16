import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function getChurchId(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("church_id").eq("id", user.id).single();
  return data?.church_id ?? null;
}

// PATCH /api/finance/categories/[id] — editar categoria
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const churchId = await getChurchId(supabase);
  const { id } = await params;
  if (!churchId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { error } = await supabase
    .from("financial_categories")
    .update({ name: body.name?.trim(), type: body.type, color: body.color })
    .eq("id", id)
    .eq("church_id", churchId);

  if (error) return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/finance/categories/[id] — desativar categoria (soft delete)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const churchId = await getChurchId(supabase);
  const { id } = await params;
  if (!churchId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { error } = await supabase
    .from("financial_categories")
    .update({ is_active: false })
    .eq("id", id)
    .eq("church_id", churchId);

  if (error) return NextResponse.json({ error: "Erro ao desativar" }, { status: 500 });
  return NextResponse.json({ success: true });
}
