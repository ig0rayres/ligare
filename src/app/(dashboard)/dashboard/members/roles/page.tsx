import { getChurchRoles } from "../actions";
import RolesClient from "./RolesClient";

export default async function RolesPage() {
  const { data: roles, error } = await getChurchRoles();
  
  return <RolesClient initialRoles={roles || []} error={error} />;
}
