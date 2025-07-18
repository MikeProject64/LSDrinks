import AdminLayout from "@/components/AdminLayout";
import SettingsForm from "./SettingsForm";

export default function SettingsPage() {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Configurações da Loja</h1>
        </div>
        <p className="text-muted-foreground">
            Altere as informações gerais da sua loja.
        </p>
        <SettingsForm />
      </div>
    </AdminLayout>
  );
}
