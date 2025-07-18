
import AdminLayout from "@/components/AdminLayout";
import PaymentForms from "./PaymentForms";

export default function PaymentPage() {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Configurações de Pagamento</h1>
        </div>
        <PaymentForms />
      </div>
    </AdminLayout>
  );
} 
