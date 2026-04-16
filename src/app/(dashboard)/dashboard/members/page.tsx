import { getMembers, getChurchRoles } from "./actions";
import MembersClient from "./MembersClient";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function MembersPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role === 'leader' || profile?.role === 'member') {
    redirect("/dashboard");
  }

  const memResult = await getMembers();
  const members = memResult?.data || [];
  const rolesResult = await getChurchRoles();
  const roles = rolesResult?.data || [];

  const error = memResult?.error || rolesResult?.error;

  return (
    <div>
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 text-sm mb-4">
          Erro ao carregar dados: {String(error)}
        </div>
      )}
      <MembersClient members={members as any[]} roles={roles as any[]} callerRole={profile?.role} />
    </div>
  );
}
