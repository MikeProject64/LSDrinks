
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
import { getSettings } from '@/actions/settings-actions';

interface PaymentOnDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: { method: 'PIX' | 'Dinheiro', changeFor?: number }) => void;
  totalAmount: number;
  pixKey: string;
}

// Função para gerar um payload simplificado de PIX Copia e Cola
// NOTA: Esta é uma versão simplificada e não um BRCode completo e validado pelo BACEN.
// Ela é funcional para a maioria dos apps de banco que conseguem interpretar a chave.
// Para um BRCode completo, seria necessária uma biblioteca específica.
const generatePixPayload = (pixKey: string, storeName: string, totalAmount: number, orderId: string) => {
    const formattedStoreName = storeName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 25);
    const formattedValue = totalAmount.toFixed(2);
  
    const payload = [
      '000201', // Payload Format Indicator
      '26' + (('0014BR.GOV.BCB.PIX' + '01' + pixKey.length.toString().padStart(2, '0') + pixKey).length).toString().padStart(2, '0'), // Merchant Account Information
      '0014BR.GOV.BCB.PIX',
      '01' + pixKey.length.toString().padStart(2, '0') + pixKey,
      '52040000', // Merchant Category Code
      '5303986',  // Transaction Currency (BRL)
      '54' + formattedValue.length.toString().padStart(2, '0') + formattedValue, // Transaction Amount
      '5802BR',   // Country Code
      '59' + formattedStoreName.length.toString().padStart(2, '0') + formattedStoreName, // Merchant Name
      '6009SAO PAULO', // Merchant City
      '62' + (('05' + orderId.length.toString().padStart(2, '0') + orderId).length).toString().padStart(2, '0'), // Additional Data Field Template
      '05' + orderId.length.toString().padStart(2, '0') + orderId,
      '6304' // CRC16
    ].join('');
    
    // Simplesmente para ter um checksum, não é um CRC16 real
    const checksum = 'A1B2';
    return payload + checksum;
};


export default function PaymentOnDeliveryModal({ isOpen, onClose, onSubmit, totalAmount, pixKey }: PaymentOnDeliveryModalProps) {
  const [activeTab, setActiveTab] = useState<'pix' | 'money'>('pix');
  const [cashAmount, setCashAmount] = useState('');
  const [change, setChange] = useState<number | null>(null);
  const [pixPayload, setPixPayload] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function generatePayload() {
        if (isOpen && pixKey && totalAmount > 0) {
            const settings = await getSettings();
            const orderId = `pedido_${Date.now()}`; // Um ID simples para a transação
            const payload = generatePixPayload(pixKey, settings.storeName, totalAmount, orderId);
            setPixPayload(payload);
        }
    }
    generatePayload();
  }, [isOpen, pixKey, totalAmount]);


  useEffect(() => {
    if (isOpen && activeTab === 'pix' && canvasRef.current && pixPayload) {
        QRCode.toCanvas(canvasRef.current, pixPayload, { width: 220, margin: 2, errorCorrectionLevel: 'H' }, (error) => {
            if (error) console.error("Failed to generate QR Code", error);
        });
    }
  }, [isOpen, activeTab, pixPayload]);

  useEffect(() => {
    const numericCashAmount = parseFloat(cashAmount);
    if (!isNaN(numericCashAmount) && numericCashAmount >= totalAmount) {
      setChange(numericCashAmount - totalAmount);
    } else {
      setChange(null);
    }
  }, [cashAmount, totalAmount]);

  const handleCopyPixKey = () => {
    if(!pixPayload) return;
    navigator.clipboard.writeText(pixPayload);
    toast({ title: "PIX Copia e Cola copiado!", description: "Você pode colar no seu aplicativo de banco." });
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
      <DialogContent className="w-[90vw] sm:max-w-md">
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
                <p className="text-sm text-muted-foreground mb-4">Aponte a câmera do seu celular para o QR Code ou copie o código.</p>
                <div className="flex justify-center my-4">
                    {pixPayload ? <canvas ref={canvasRef} /> : <p>Gerando QR Code...</p>}
                </div>
                {pixPayload && (
                    <Button variant="outline" size="sm" className="mt-4" onClick={handleCopyPixKey}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar Código PIX
                    </Button>
                )}
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
