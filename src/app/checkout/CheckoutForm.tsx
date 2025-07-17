"use client";

import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function CheckoutForm() {
  const { items, cartTotal, clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Simulate payment processing
    toast({
      title: "Pagamento realizado com sucesso!",
      description: "Seu pedido foi realizado. Obrigado pela sua compra.",
    });

    clearCart();
    
    setTimeout(() => {
        router.push('/');
    }, 2000)
  };

  if (items.length === 0) {
    return <div className="text-center text-muted-foreground">Seu carrinho está vazio. Redirecionando para a página inicial...</div>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-12">
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={48}
                    height={48}
                    className="rounded-md"
                    data-ai-hint={item.dataAiHint}
                  />
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-between font-bold text-lg border-t pt-4">
            <p>Total</p>
            <p>${cartTotal.toFixed(2)}</p>
          </CardFooter>
        </Card>
      </div>
      <div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Entrega & Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" placeholder="João da Silva" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" placeholder="Rua das Bebidas, 123" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" placeholder="São Paulo" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">CEP</Label>
                  <Input id="zip" placeholder="01000-000" required />
                </div>
              </div>
               <div className="space-y-2 pt-4">
                <Label htmlFor="card">Informações do Cartão (Simulado)</Label>
                <Input id="card" placeholder="**** **** **** 1234" required />
              </div>
            </CardContent>
          </Card>
          <Button type="submit" size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            Pagar R${cartTotal.toFixed(2)}
          </Button>
        </form>
      </div>
    </div>
  );
}
