/**
 * Food search via Open Food Facts — free, no API key, CORS-enabled.
 * Free-tier caveat: rate-limited (~10 search req/min) and data quality varies by product.
 */
export interface FoodHit {
  id: string;
  name: string;
  brand: string;
  per100: { calories: number; protein: number; carbs: number; fat: number };
}

function num(v: unknown): number {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export async function searchFoods(query: string): Promise<FoodHit[]> {
  const u =
    'https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=20' +
    '&fields=code,product_name,brands,nutriments' +
    `&search_terms=${encodeURIComponent(query)}`;
  const res = await fetch(u);
  if (!res.ok) throw new Error(`Food search failed (${res.status})`);
  const j = (await res.json()) as { products?: any[] };
  const hits: FoodHit[] = (j.products ?? []).map((p: any) => ({
    id: String(p.code ?? Math.random()),
    name: (p.product_name as string) || '',
    brand: (p.brands as string) || '',
    per100: {
      calories: num(p.nutriments?.['energy-kcal_100g']),
      protein: num(p.nutriments?.proteins_100g),
      carbs: num(p.nutriments?.carbohydrates_100g),
      fat: num(p.nutriments?.fat_100g),
    },
  }));
  return hits.filter((h) => h.name && h.per100.calories > 0);
}

export function scalePer100(per100: FoodHit['per100'], grams: number) {
  const f = grams / 100;
  return {
    calories: Math.round(per100.calories * f),
    protein: Math.round(per100.protein * f * 10) / 10,
    carbs: Math.round(per100.carbs * f * 10) / 10,
    fat: Math.round(per100.fat * f * 10) / 10,
  };
}
