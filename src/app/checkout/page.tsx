import CheckoutForm from './CheckoutForm';

export default function CheckoutPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-bold font-headline mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-green-400">
        Checkout
      </h1>
      <CheckoutForm />
    </div>
  );
}
