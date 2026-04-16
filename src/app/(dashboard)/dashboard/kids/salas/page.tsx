import { getClassrooms, getKidsCountByClassroom } from "../actions";
import SalasClient from "./SalasClient";

export default async function SalasPage() {
  const { data: classrooms, error } = await getClassrooms();
  const kidsCounts = await getKidsCountByClassroom();

  return (
    <SalasClient
      classrooms={classrooms}
      kidsCounts={kidsCounts}
      error={error}
    />
  );
}
