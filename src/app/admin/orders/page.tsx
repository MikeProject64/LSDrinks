
import { getOrders } from "@/actions/payment-actions";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"
import Image from "next/image";

export default async function AdminOrdersPage() {
  const orders = await getOrders();

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID do Pedido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === "Pago" ? "default" : "secondary"}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {order.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value={order.id} className="border-none">
                            <AccordionTrigger className="text-sm p-2 hover:no-underline">Ver Itens</AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-2 p-2 bg-muted/50 rounded-md">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-2 text-left">
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.title}
                                            width={30}
                                            height={30}
                                            className="rounded-sm object-cover"
                                        />
                                        <div>
                                            <p className="text-xs font-semibold">{item.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.quantity} x R$ {item.price.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
