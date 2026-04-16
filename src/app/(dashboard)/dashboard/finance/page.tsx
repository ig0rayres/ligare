import { getFinancialAccounts, getFinancialCategories, getFinancialTransactions, getRecentEvents } from "./actions";
import FinanceDashboard from "./components/FinanceDashboard";

export default async function FinancePage() {
  const [accounts, categories, transactions, events] = await Promise.all([
    getFinancialAccounts(),
    getFinancialCategories(),
    getFinancialTransactions(),
    getRecentEvents(),
  ]);

  return (
    <FinanceDashboard
      accounts={accounts}
      categories={categories}
      transactions={transactions}
      events={events}
    />
  );
}
