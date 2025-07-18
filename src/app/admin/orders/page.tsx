
import { getAllOrders } from "@/actions/payment-actions";
import AdminLayout from "@/components/AdminLayout";
import OrderManager from "./OrderManager";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function OrderManagerSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Histórico de Pedidos</CardTitle>
                <CardDescription>Carregando pedidos...</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
        </Card>
    )
}

export default async function AdminOrdersPage() {
  // Fetch initial data on the server
  const initialOrders = await getAllOrders();

  return (
    <AdminLayout>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Pedidos</h1>
      </div>
      <Suspense fallback={<OrderManagerSkeleton />}>
        <OrderManager initialOrders={initialOrders} />
      </Suspense>
    </AdminLayout>
  );
}
