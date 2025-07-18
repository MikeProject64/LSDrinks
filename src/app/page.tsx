import { getActiveHighlights } from '@/actions/highlight-actions';
import { getCategories } from '@/actions/category-actions';
import { getItems } from '@/actions/item-actions';
import HomePageClient from './HomePageClient';

export default async function Home() {
  const [activeHighlights, categories, items] = await Promise.all([
    getActiveHighlights(),
    getCategories(),
    getItems()
  ]);

  return (
    <HomePageClient 
      highlights={activeHighlights}
      categories={categories}
      items={items}
    />
  );
}
