import { getSchedules, getClassrooms, getChurchMembers, getKidsEvents } from "../actions";
import EscalasClient from "./EscalasClient";

export default async function EscalasPage() {
  const [schedulesRes, classroomsRes, members, events] = await Promise.all([
    getSchedules(),
    getClassrooms(),
    getChurchMembers(),
    getKidsEvents(),
  ]);

  return (
    <EscalasClient
      schedules={schedulesRes.data || []}
      classrooms={classroomsRes.data || []}
      members={members.filter(m => m.user_id).map(m => ({ id: m.user_id, full_name: m.full_name, phone: m.phone })) as any}
      events={events}
    />
  );
}
