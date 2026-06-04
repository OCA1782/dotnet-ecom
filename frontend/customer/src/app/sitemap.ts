import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const API_BASE =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5124";

const STATIC_PAGES: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/",               priority: 1.0, freq: "daily"   },
  { path: "/urunler",        priority: 0.9, freq: "daily"   },
  { path: "/hakkimizda",     priority: 0.5, freq: "monthly" },
  { path: "/iletisim",       priority: 0.5, freq: "monthly" },
  { path: "/sss",            priority: 0.4, freq: "monthly" },
  { path: "/kargo-takibi",   priority: 0.4, freq: "monthly" },
  { path: "/iade-degisim",   priority: 0.4, freq: "monthly" },
  { path: "/siparis-sorgula",priority: 0.3, freq: "monthly" },
  { path: "/gizlilik",       priority: 0.2, freq: "yearly"  },
  { path: "/kvkk",           priority: 0.2, freq: "yearly"  },
];

interface ProductItem { slug: string; updatedAt?: string }
interface CategoryItem { slug: string; subCategories?: CategoryItem[] }

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

function flattenCategories(cats: CategoryItem[]): CategoryItem[] {
  return cats.flatMap((c) => [c, ...flattenCategories(c.subCategories ?? [])]);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map(({ path, priority, freq }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: freq,
    priority,
  }));

  // Products — fetch up to 1000; add more pages if needed
  const productsData = await fetchJson<{ items: ProductItem[] }>(
    `${API_BASE}/api/products?page=1&pageSize=1000&isActive=true`
  );
  const productEntries: MetadataRoute.Sitemap = (productsData?.items ?? []).map((p) => ({
    url: `${SITE_URL}/urun/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Categories
  const categories = await fetchJson<CategoryItem[]>(`${API_BASE}/api/categories`);
  const categoryEntries: MetadataRoute.Sitemap = flattenCategories(categories ?? []).map((c) => ({
    url: `${SITE_URL}/urunler?kategori=${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticEntries, ...productEntries, ...categoryEntries];
}
