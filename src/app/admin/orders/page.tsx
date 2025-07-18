
import { getAllOrders } from "@/actions/payment-actions";
import AdminLayout from "@/components/AdminLayout";
import OrderManager from "./OrderManager";

export default async function AdminOrdersPage() {
  const initialOrders = await getAllOrders();

  return (
    <AdminLayout>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Pedidos</h1>
      </div>
      <OrderManager initialOrders={initialOrders} />
    </AdminLayout>
  );
}
