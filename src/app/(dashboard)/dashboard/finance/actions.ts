"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getChurchId() {
  const supabase = await createClient();
  const { data: userResp } = await supabase.auth.getUser();
  if (!userResp.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("church_id")
    .eq("id", userResp.user.id)
    .single();
  return profile?.church_id ?? null;
}

export async function getFinancialAccounts() {
  const supabase = await createClient();
  const churchId = await getChurchId();
  if (!churchId) return [];
  const { data } = await supabase
    .from("financial_accounts")
    .select("*")
    .eq("church_id", churchId)
    .eq("is_active", true)
    .order("name");
  return data ?? [];
}

export async function getFinancialCategories(type?: "in" | "out") {
  const supabase = await createClient();
  const churchId = await getChurchId();
  if (!churchId) return [];
  let query = supabase
    .from("financial_categories")
    .select("*")
    .eq("church_id", churchId)
    .eq("is_active", true)
    .order("name");
  if (type) query = query.eq("type", type);
  const { data } = await query;
  return data ?? [];
}

export async function getRecentEvents() {
  const supabase = await createClient();
  const churchId = await getChurchId();
  if (!churchId) return [];

  // Para eventos recorrentes (weekly), calcula a última ocorrência passada.
  // recurrence_day: 0=domingo, 1=segunda, ..., 6=sábado (formato PostgreSQL dow)
  const { data, error } = await supabase.rpc("get_recent_event_occurrences", {
    p_church_id: churchId,
    p_limit: 20,
  });

  if (error) {
    // Fallback: query simples caso a função ainda não exista
    console.error("RPC error, fallback to simple query:", error.message);
    const { data: fallback } = await supabase
      .from("events")
      .select("id, title, starts_at")
      .eq("church_id", churchId)
      .order("starts_at", { ascending: false })
      .limit(20);
    return fallback ?? [];
  }

  return data ?? [];
}

export async function getFinancialTransactions(status?: "pending" | "verified" | "rejected") {
  const supabase = await createClient();
  const churchId = await getChurchId();
  if (!churchId) return [];
  let query = supabase
    .from("financial_transactions")
    .select(`
      *,
      account:financial_accounts(name),
      category:financial_categories(name, color),
      event:events(title),
      launcher:profiles!launched_by(name)
    `)
    .eq("church_id", churchId)
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data } = await query;
  return data ?? [];
}

export async function createFinancialTransaction(formData: FormData) {
  const supabase = await createClient();
  const { data: userResp } = await supabase.auth.getUser();
  if (!userResp.user) return { error: "Não autorizado" };

  const churchId = await getChurchId();
  if (!churchId) return { error: "Igreja não encontrada" };

  const amountStr = formData.get("amount") as string;
  const amount = parseFloat(amountStr?.replace(",", ".") || "0");
  if (amount <= 0) return { error: "Valor inválido" };

  const file = formData.get("proof_file") as File | null;
  if (!file || file.size === 0) {
    return { error: "O comprovante (documento/foto) é OBRIGATÓRIO" };
  }

  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${churchId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from("financial_receipts")
      .upload(fileName, file);
    if (uploadError) return { error: "Falha ao fazer upload do comprovante" };

    const eventId = formData.get("event_id") as string;
    const { error: insertError } = await supabase
      .from("financial_transactions")
      .insert({
        church_id: churchId,
        account_id: formData.get("account_id"),
        category_id: formData.get("category_id"),
        amount,
        type: formData.get("type"),
        payment_method: formData.get("payment_method"),
        description: formData.get("description"),
        proof_url: uploadData.path,
        transaction_date: formData.get("transaction_date") || new Date().toISOString().split("T")[0],
        event_id: eventId && eventId !== "" ? eventId : null,
        launched_by: userResp.user.id,
        status: "pending",
      });
    if (insertError) return { error: "Falha ao registrar transação no banco" };

    revalidatePath("/dashboard/finance");
    return { success: true };
  } catch {
    return { error: "Ocorreu um erro inesperado." };
  }
}

export async function approveTransaction(transactionId: string) {
  const supabase = await createClient();
  const { data: userResp } = await supabase.auth.getUser();
  if (!userResp.user) return { error: "Não autorizado" };
  const { error } = await supabase
    .from("financial_transactions")
    .update({ status: "verified", verified_by: userResp.user.id, verified_at: new Date().toISOString() })
    .eq("id", transactionId);
  if (error) return { error: "Falha ao aprovar" };
  revalidatePath("/dashboard/finance");
  return { success: true };
}

export async function rejectTransaction(transactionId: string) {
  const supabase = await createClient();
  const { data: userResp } = await supabase.auth.getUser();
  if (!userResp.user) return { error: "Não autorizado" };
  const { error } = await supabase
    .from("financial_transactions")
    .update({ status: "rejected", verified_by: userResp.user.id, verified_at: new Date().toISOString() })
    .eq("id", transactionId);
  if (error) return { error: "Falha ao rejeitar" };
  revalidatePath("/dashboard/finance");
  return { success: true };
}
