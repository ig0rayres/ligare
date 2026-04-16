"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import { createCellMember as _createCellMember, createCellKid as _createCellKid, removeCellMember as _removeCellMember, removeCellKid as _removeCellKid, updateCellName as _updateCellName } from "./cells/actions";

export async function createCellMember(formData: FormData) { return _createCellMember(formData); }
export async function createCellKid(formData: FormData) { return _createCellKid(formData); }
export async function removeCellMember(id: string) { return _removeCellMember(id); }
export async function removeCellKid(id: string) { return _removeCellKid(id); }
export async function updateCellName(name: string) { return _updateCellName(name); }

interface AttendanceRecord {
  member_id?: string;
  kid_id?: string;
  visitor_name?: string;
  visitor_whatsapp?: string;
  status: 'present' | 'absent' | 'justified';
}

export async function registerAttendance(eventId: string, serviceDate: string, records: AttendanceRecord[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, church_id")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== 'leader' && profile.role !== 'kids_team')) {
    throw new Error("Unauthorized");
  }

  // Delete existing records for this leader + event + date to allow re-registration (upsert behavior)
  await supabase
    .from("event_attendance")
    .delete()
    .eq("leader_id", profile.id)
    .eq("event_id", eventId)
    .eq("service_date", serviceDate)
    .eq("source", "manual");

  // Insert new records
  const rows = records.map(r => ({
    church_id: profile.church_id,
    event_id: eventId,
    leader_id: profile.id,
    member_id: r.member_id || null,
    kid_id: r.kid_id || null,
    visitor_name: r.visitor_name || null,
    visitor_whatsapp: r.visitor_whatsapp || null,
    service_date: serviceDate,
    status: r.status,
    source: 'manual' as const,
    recorded_by: profile.id,
  }));

  if (rows.length > 0) {
    const { error } = await supabase.from("event_attendance").insert(rows);
    if (error) throw new Error("Falha ao registrar presença: " + error.message);
  }

  revalidatePath("/dashboard");
}

export async function getAvailableEventsForAttendance(churchId: string, leaderId: string) {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, starts_at, recurrence_type, recurrence_day, scope, created_by, target_members")
    .eq("church_id", churchId)
    .or(`scope.eq.church,and(scope.eq.cell,created_by.eq.${leaderId})`);

  if (!events) return [];

  // We use the current local date of the church (for simplicity, using server local proxy)
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const instances: { event_id: string, title: string, instance_date: string, target_members?: string[] | null }[] = [];

  for (const evt of events) {
    const startsAt = new Date(evt.starts_at);
    const startsAtStr = startsAt.toISOString().split('T')[0];
    
    if (evt.recurrence_type === 'once') {
      // If it's a single event, it must be today or in the past to register presence
      if (startsAtStr <= todayStr) {
        instances.push({
          event_id: evt.id,
          title: evt.title,
          instance_date: startsAtStr,
          target_members: evt.target_members
        });
      }
    } else if (evt.recurrence_type === 'weekly' && evt.recurrence_day) {
       const targetDay = parseInt(evt.recurrence_day); 
       let current = new Date(today);
       // Go backwards until we hit the target day of the week
       while (current.getDay() !== targetDay) {
         current.setDate(current.getDate() - 1);
       }
       
       // For recurring events, we add the most recent occurrence (which could be today or up to 6 days ago)
       // We ignore starts_at because users often set starts_at in the future for a recurring event
       // and get blocked from registering today's occurrence.
       instances.push({
         event_id: evt.id,
         title: evt.title,
         instance_date: current.toISOString().split('T')[0],
         target_members: evt.target_members
       });
       
    } else if (evt.recurrence_type === 'monthly' && evt.recurrence_day) {
       const targetDate = parseInt(evt.recurrence_day);
       let current = new Date(today);
       let found = false;
       for (let i = 0; i < 60; i++) { 
         if (current.getDate() === targetDate) {
           found = true;
           break;
         }
         current.setDate(current.getDate() - 1);
       }
       if (found) {
         instances.push({
           event_id: evt.id,
           title: evt.title,
           instance_date: current.toISOString().split('T')[0],
           target_members: evt.target_members
         });
       }
    }
  }

  // Sort by date descending
  instances.sort((a, b) => new Date(b.instance_date).getTime() - new Date(a.instance_date).getTime());

  return instances;
}

export async function getAttendanceReport(leaderId: string, churchId: string, weeks: number = 4) {
  const supabase = await createClient();

  // Get all attendance records for this leader in the last N weeks
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (weeks * 7));
  const startStr = startDate.toISOString().split('T')[0];

  const { data: records, error } = await supabase
    .from("event_attendance")
    .select("id, member_id, kid_id, visitor_name, service_date, status")
    .eq("leader_id", leaderId)
    .gte("service_date", startStr)
    .order("service_date", { ascending: true });

  if (error) {
    console.error("Error fetching attendance:", error);
    return { records: [], distinctDates: [] };
  }

  // Get distinct dates to know which meetings happened
  const distinctDates = [...new Set((records || []).map(r => r.service_date))].sort();

  return { records: records || [], distinctDates };
}

export async function getExistingAttendance(leaderId: string, eventId: string, serviceDate: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("event_attendance")
    .select("member_id, kid_id, visitor_name, visitor_whatsapp, status, source")
    .eq("leader_id", leaderId)
    .eq("event_id", eventId)
    .eq("service_date", serviceDate);

  return data || [];
}
