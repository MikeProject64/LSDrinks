import ProductCard from '@/components/ProductCard';
import { products } from '@/lib/data';

export default function Home() {
  return (
    <section>
      <h1 className="text-4xl md:text-5xl font-bold font-headline mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-green-400">
        Our Drink Selection
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
