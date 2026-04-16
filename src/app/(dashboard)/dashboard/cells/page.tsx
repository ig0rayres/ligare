import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function CellsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Leaders now use the unified dashboard
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "leader" || profile?.role === "kids_team") {
    redirect("/dashboard");
  }

  // Admin: redirect to dashboard too (cells management is there for admins in a future phase)
  redirect("/dashboard");
}
