import { getFinancialAccounts } from "../actions";
import AccountManager from "../components/AccountManager";

export default async function AccountsPage() {
  const accounts = await getFinancialAccounts();
  return <AccountManager accounts={accounts} />;
}
