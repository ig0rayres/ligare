import { getFinancialCategories } from "../actions";
import CategoryManager from "../components/CategoryManager";

export default async function CategoriesPage() {
  const categories = await getFinancialCategories();
  return <CategoryManager categories={categories} />;
}
