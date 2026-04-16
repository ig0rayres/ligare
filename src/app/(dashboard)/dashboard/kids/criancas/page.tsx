import { getKids, getClassrooms, getChurchMembers } from "../actions";
import CriancasClient from "./CriancasClient";

export default async function CriancasPage() {
  const { data: kids } = await getKids();
  const { data: classrooms } = await getClassrooms();
  const members = await getChurchMembers();

  return (
    <CriancasClient
      kids={kids || []}
      classrooms={classrooms || []}
      members={members}
    />
  );
}
