
'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy } from 'lucide-react';

interface PaymentOnDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: { method: 'PIX' | 'Dinheiro', changeFor?: number }) => void;
  totalAmount: number;
  pixKey: string;
}

export default function PaymentOnDeliveryModal({ isOpen, onClose, onSubmit, totalAmount, pixKey }: PaymentOnDeliveryModalProps) {
  const [activeTab, setActiveTab] = useState<'pix' | 'money'>('pix');
  const [cashAmount, setCashAmount] = useState('');
  const [change, setChange] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && activeTab === 'pix' && canvasRef.current && pixKey) {
        // Simple PIX Copy/Paste payload (not a full BRCode)
        const payload = `PIX Key: ${pixKey}`;
        QRCode.toCanvas(canvasRef.current, payload, { width: 220, margin: 2 }, (error) => {
            if (error) console.error("Failed to generate QR Code", error);
        });
    }
  }, [isOpen, activeTab, pixKey]);

  useEffect(() => {
    const numericCashAmount = parseFloat(cashAmount);
    if (!isNaN(numericCashAmount) && numericCashAmount >= totalAmount) {
      setChange(numericCashAmount - totalAmount);
    } else {
      setChange(null);
    }
  }, [cashAmount, totalAmount]);

  const handleCopyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    toast({ title: "Chave PIX copiada!", description: "Você pode colar no seu aplicativo de banco." });
  };

  const handleSubmit = () => {
    if (activeTab === 'money') {
      const numericCashAmount = parseFloat(cashAmount);
      if (isNaN(numericCashAmount) || numericCashAmount < totalAmount) {
        toast({
          variant: 'destructive',
          title: 'Valor inválido',
          description: `O valor em dinheiro deve ser igual ou maior que R$ ${totalAmount.toFixed(2)}.`,
        });
        return;
      }
      onSubmit({ method: 'Dinheiro', changeFor: numericCashAmount });
    } else {
      onSubmit({ method: 'PIX' });
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Reset state on close
      setCashAmount('');
      setChange(null);
      setActiveTab('pix');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pagamento na Entrega</DialogTitle>
          <DialogDescription>
            Como você gostaria de pagar quando o pedido chegar?
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="pix" onValueChange={(value) => setActiveTab(value as 'pix' | 'money')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pix">PIX</TabsTrigger>
                <TabsTrigger value="money">Dinheiro</TabsTrigger>
            </TabsList>
            <TabsContent value="pix" className="mt-4 text-center">
                <p className="text-sm text-muted-foreground mb-4">Aponte a câmera do seu celular para o QR Code ou copie a chave.</p>
                <div className="flex justify-center">
                    <canvas ref={canvasRef} />
                </div>
                <Button variant="outline" size="sm" className="mt-4" onClick={handleCopyPixKey}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Chave PIX
                </Button>
            </TabsContent>
            <TabsContent value="money" className="mt-4">
                 <div className="space-y-4">
                    <p className="text-sm text-center text-muted-foreground">Informe o valor que você dará em dinheiro para que possamos separar seu troco.</p>
                    <div className="space-y-1">
                        <Label htmlFor="cash">Valor em dinheiro (R$)</Label>
                        <Input
                            id="cash"
                            type="number"
                            placeholder={totalAmount.toFixed(2)}
                            value={cashAmount}
                            onChange={(e) => setCashAmount(e.target.value)}
                        />
                    </div>
                    {change !== null && (
                        <div className="text-center bg-muted p-3 rounded-md">
                            <p className="text-sm">Seu troco será de:</p>
                            <p className="text-lg font-bold">R$ {change.toFixed(2)}</p>
                        </div>
                    )}
                 </div>
            </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Cancelar</Button>
          <Button onClick={handleSubmit}>Finalizar Pedido</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
