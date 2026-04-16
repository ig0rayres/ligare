import { Suspense } from "react";
import { getKids, getClassrooms, getActiveEvents } from "../actions";
import CheckinClient from "./CheckinClient";

export default async function CheckinPage() {
  const [kidsRes, classroomsRes, activeEvents] = await Promise.all([
    getKids(),
    getClassrooms(),
    getActiveEvents(),
  ]);

  return (
    <Suspense fallback={<div className="p-8 text-center text-lg-text-muted text-sm">Carregando...</div>}>
      <CheckinClient 
        kids={kidsRes.data || []} 
        classrooms={classroomsRes.data || []} 
        activeEvents={activeEvents}
      />
    </Suspense>
  );
}
