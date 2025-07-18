import { getActiveHighlights } from '@/actions/highlight-actions';
import { getCategories } from '@/actions/category-actions';
import { getItemsPaginated } from '@/actions/item-actions';
import HomePageClient from './HomePageClient';

export const revalidate = 60; // Revalidate at most every 60 seconds

export default async function Home() {
  const [activeHighlights, categories, initialItemsResult] = await Promise.all([
    getActiveHighlights(),
    getCategories(),
    getItemsPaginated({ pageLimit: 12 })
  ]);

  return (
    <HomePageClient 
      highlights={activeHighlights}
      categories={categories}
      initialItems={initialItemsResult.items}
      initialLastVisibleId={initialItemsResult.lastVisibleId}
      initialHasMore={initialItemsResult.hasMore}
    />
  );
}
