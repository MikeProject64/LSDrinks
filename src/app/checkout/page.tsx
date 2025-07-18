
// O carregamento do Stripe agora é tratado dinamicamente no componente do cliente.
// Esta página do servidor torna-se muito mais simples.
import CheckoutClientPage from './CheckoutClientPage';

export default function CheckoutPage() {
  return <CheckoutClientPage />;
}
