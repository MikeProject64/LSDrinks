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
      title: "Payment Successful!",
      description: "Your order has been placed. Thank you for your purchase.",
    });

    clearCart();
    
    setTimeout(() => {
        router.push('/');
    }, 2000)
  };

  if (items.length === 0) {
    return <div className="text-center text-muted-foreground">Your cart is empty. Redirecting to home...</div>;
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
              <CardTitle className="font-headline">Shipping & Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="123 Drink St" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="New York" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input id="zip" placeholder="10001" required />
                </div>
              </div>
               <div className="space-y-2 pt-4">
                <Label htmlFor="card">Card Information (Simulated)</Label>
                <Input id="card" placeholder="**** **** **** 1234" required />
              </div>
            </CardContent>
          </Card>
          <Button type="submit" size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            Pay ${cartTotal.toFixed(2)}
          </Button>
        </form>
      </div>
    </div>
  );
}
