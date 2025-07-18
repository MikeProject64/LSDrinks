import { loadStripe } from '@stripe/stripe-js';
import { getPaymentSettings } from '@/actions/payment-actions';
import CheckoutClientPage from './CheckoutClientPage';

// Carrega a chave pública do Stripe no lado do servidor
async function getStripePromise() {
  const settings = await getPaymentSettings();
  if (!settings?.stripe?.publicKey) {
    // Retorna nulo em vez de lançar erro para não quebrar a página
    // O componente de cliente pode lidar com o estado de 'não configurado'
    console.error('A chave publicável do Stripe não foi configurada.');
    return null;
  }
  return loadStripe(settings.stripe.publicKey);
}

export default async function CheckoutPage() {
  const stripePromise = getStripePromise();

  return <CheckoutClientPage stripePromise={stripePromise} />;
}
