
import { getAdminItems } from "@/actions/item-actions";
import { getCategories } from "@/actions/category-actions";
import AdminLayout from "@/components/AdminLayout";
import ItemsListClient from "./ItemsListClient";

// A página agora é um Server Component que busca os dados iniciais.
export default async function ItemsListPage() {
  // Busca as categorias e os primeiros itens no servidor
  const [initialCategories, initialItemsResult] = await Promise.all([
    getCategories(),
    getAdminItems({ pageLimit: 15 })
  ]);

  return (
    <AdminLayout>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Itens do Cardápio</h1>
      </div>
      {/* Passa os dados iniciais para o componente de cliente */}
      <ItemsListClient
        initialItems={initialItemsResult.items}
        initialLastVisibleId={initialItemsResult.lastVisibleId}
        initialHasMore={initialItemsResult.hasMore}
        initialCategories={initialCategories}
      />
    </AdminLayout>
  );
}
