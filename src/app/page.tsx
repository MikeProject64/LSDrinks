import { getActiveHighlights } from '@/actions/highlight-actions';
import { getCategories } from '@/actions/category-actions';
import { getItems } from '@/actions/item-actions';
import HomePageClient from './HomePageClient';

export default async function Home() {
  const activeHighlights = await getActiveHighlights();
  const categories = await getCategories();
  const items = await getItems();

  return (
    <HomePageClient 
      highlights={activeHighlights}
      categories={categories}
      items={items}
    />
  );
}
