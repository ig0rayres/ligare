import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EventsClient from "./EventsClient";

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("church_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // Fetch events based on role
  let query = supabase
    .from("events")
    .select("id, title, description, location, starts_at, scope, recurrence_type, recurrence_day, target_members")
    .eq("church_id", profile.church_id)
    .order("starts_at", { ascending: false });

  if (profile.role === "admin" || profile.role === "manager" || profile.role === "super_admin") {
    // Admin sees all events inside their church
  } else if (profile.role === "kids_team") {
    // Kids team sees everything from church + all kids + their own cell
    query = query.or(`scope.eq.church,scope.eq.kids,and(scope.eq.cell,created_by.eq.${user.id})`);
  } else {
    // Leaders ONLY see scope=church OR their own created scope=cell
    query = query.or(`scope.eq.church,and(scope.eq.cell,created_by.eq.${user.id})`);
  }

  const { data: events, error } = await query;
  if (error) {
    console.error("Error fetching events:", error);
  }

  // Fetch church_roles dynamically from DB
  const { data: churchRoles } = await supabase
    .from("church_roles")
    .select("id, name, permissions_level")
    .eq("church_id", profile.church_id)
    .order("name");

  // Fetch cell members for the current user to target events
  let cellMembers: { id: string, name: string }[] = [];
  
  if (profile.role === 'leader' || profile.role === 'kids_team') {
    // A leader or kids_team can target members of their cell
    const [kidsRes, membersRes] = await Promise.all([
      supabase.from("kids").select("id, full_name").eq("leader_id", user.id),
      supabase.from("church_members").select("id, full_name").eq("leader_id", user.id)
    ]);
    
    const kids = (kidsRes.data || []).map(k => ({ id: k.id, name: k.full_name }));
    const adults = (membersRes.data || []).map(m => ({ id: m.id, name: m.full_name }));
    
    cellMembers = [...adults, ...kids].sort((a, b) => a.name.localeCompare(b.name));
  }

  const isAdminLike = profile.role === 'admin' || profile.role === 'manager' || profile.role === 'super_admin';
  
  return (
    <EventsClient 
      events={events || []} 
      callerRole={isAdminLike ? 'admin' : profile.role === 'kids_team' ? 'kids_team' : 'leader'} 
      churchRoles={churchRoles || []}
      cellMembers={cellMembers}
    />
  );
}
