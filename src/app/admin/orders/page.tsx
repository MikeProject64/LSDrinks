
import { getAllOrders } from "@/actions/payment-actions";
import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"
import Image from "next/image";
import { User, Phone, MapPin } from "lucide-react";

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  return (
    <AdminLayout>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Pedidos</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pedidos</CardTitle>
          <CardDescription>
            Visualize todos os pedidos feitos na sua loja.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nenhum pedido encontrado.
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {orders.map((order) => (
                 <AccordionItem value={order.id} key={order.id}>
                    <AccordionTrigger className="hover:no-underline">
                        <div className="w-full grid grid-cols-5 items-center text-sm font-normal">
                            <span className="font-mono font-semibold text-left">#{order.id}</span>
                            <span className="hidden sm:block text-left">{new Date(order.createdAt).toLocaleString("pt-BR")}</span>
                            <Badge variant={order.status === "Pago" ? "default" : "secondary"} className="w-fit justify-self-start sm:justify-self-center">
                                {order.status}
                            </Badge>
                            <span className="hidden sm:block text-center">{order.paymentMethod}</span>
                            <span className="font-medium text-right pr-4">R$ {order.totalAmount.toFixed(2)}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="p-4 bg-muted/50 rounded-md grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Customer Info */}
                            <div>
                                <h4 className="font-semibold mb-3">Dados do Cliente</h4>
                                {order.customer ? (
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <p className="flex items-center gap-2"><User className="w-4 h-4"/> {order.customer.name}</p>
                                        <p className="flex items-center gap-2"><Phone className="w-4 h-4"/> {order.customer.phone}</p>
                                        <p className="flex items-center gap-2"><MapPin className="w-4 h-4"/> {order.customer.address}</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Dados do cliente não disponíveis.</p>
                                )}
                            </div>
                            {/* Items */}
                            <div>
                                <h4 className="font-semibold mb-3">Itens do Pedido</h4>
                                <div className="space-y-3">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 text-left">
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.title}
                                            width={40}
                                            height={40}
                                            className="rounded-sm object-cover"
                                            sizes="40px"
                                        />
                                        <div>
                                            <p className="text-sm font-semibold">{item.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.quantity} x R$ {item.price.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                 </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
