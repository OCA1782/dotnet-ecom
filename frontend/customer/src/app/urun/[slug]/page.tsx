import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { ProductDetail } from "@/types";
import { formatPrice } from "@/lib/utils";
import AddToCartButton from "./AddToCartButton";
import ReviewSection from "./ReviewSection";
import ProductImageGallery from "./ProductImageGallery";
import ProductTabs from "./ProductTabs";
import { getServerLang } from "@/lib/server-i18n";
import { t as translate } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";

async function getProduct(slug: string): Promise<ProductDetail | null> {
  try {
    return await api.get<ProductDetail>(`/api/products/${slug}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Ürün Bulunamadı" };

  const mainImage = product.images?.find((i) => i.isMain) ?? product.images?.[0];
  const price = product.discountPrice ?? product.price;

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const description = product.metaDescription ?? product.shortDescription ?? `${product.name} — ${price.toFixed(2)} ₺`;
  return {
    title: product.metaTitle ?? product.name,
    description,
    alternates: {
      canonical: `${SITE_URL}/urun/${product.slug}`,
    },
    openGraph: {
      title: product.name,
      description: product.shortDescription ?? undefined,
      images: mainImage?.imageUrl ? [{ url: mainImage.imageUrl, alt: product.name, width: 800, height: 800 }] : [],
      type: "website",
      url: `${SITE_URL}/urun/${product.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.shortDescription ?? undefined,
      images: mainImage?.imageUrl ? [mainImage.imageUrl] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, lang, settings] = await Promise.all([getProduct(slug), getServerLang(), getSettings()]);
  const t = (key: string) => translate(lang, key);

  if (!product) notFound();

  const displayPrice = product.discountPrice ?? product.price;
  const isSP = settings.CustomerTemplate === "spareparts";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Breadcrumb — spareparts template */}
      {isSP && (
        <nav className="text-[11px] text-gray-400 mb-5 flex items-center gap-1 flex-wrap">
          <Link href="/" className="hover:text-orange-500 transition-colors">Anasayfa</Link>
          {product.brandName && (
            <>
              <span>/</span>
              <Link href={`/urunler?markalar=${product.brandName}`} className="hover:text-orange-500 transition-colors uppercase font-semibold">{product.brandName}</Link>
            </>
          )}
          {product.categoryName && (
            <>
              <span>/</span>
              <span className="text-gray-500">{product.categoryName}</span>
            </>
          )}
          <span>/</span>
          <span className="text-gray-700 font-medium line-clamp-1 max-w-xs">{product.name}</span>
        </nav>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <ProductImageGallery images={product.images ?? []} productName={product.name} />
        </div>

        {/* Info */}
        <div className="space-y-6">
          {product.brandName && (
            <p className={`text-sm font-medium uppercase tracking-wide ${isSP ? "text-orange-500" : "text-slate-500"}`}>{product.brandName}</p>
          )}
          <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className={`text-3xl font-bold ${isSP ? "text-orange-600" : "text-slate-900"}`}>{formatPrice(displayPrice)}</span>
            {product.discountPrice && (
              <span className="text-lg text-slate-400 line-through">{formatPrice(product.price)}</span>
            )}
          </div>

          {product.shortDescription && (
            <p className="text-sm text-slate-600 leading-relaxed">{product.shortDescription}</p>
          )}

          {/* OEM / Chassis — spareparts */}
          {isSP && (product.oemPartNumber || product.chassis) && (
            <div className="flex flex-wrap gap-3">
              {product.oemPartNumber && (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-lg px-3 py-1.5">
                  <span className="text-[10px] font-extrabold text-orange-400 uppercase tracking-widest">OEM</span>
                  <span className="font-mono text-sm font-bold text-gray-800">{product.oemPartNumber}</span>
                  <Link href={`/urunler?oemNo=${encodeURIComponent(product.oemPartNumber)}`}
                    className="text-[10px] text-orange-500 hover:underline ml-1">uyumlu ürünler</Link>
                </div>
              )}
              {product.chassis && (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Şasi</span>
                  <span className="font-mono text-sm font-bold text-gray-800">{product.chassis}</span>
                </div>
              )}
            </div>
          )}

          {/* Stock status */}
          {product.availableStock === 0 ? (
            <span className="inline-block text-sm text-red-600 font-medium">{t("prod2.detail.out_of_stock")}</span>
          ) : (
            <span className="inline-block text-sm text-green-600 font-medium">{t("prod2.detail.in_stock")}</span>
          )}

          {/* Add to cart */}
          <AddToCartButton
            productId={product.id}
            variants={product.variants ?? []}
            availableStock={product.availableStock}
          />

          {/* Inline description — non-spareparts only */}
          {!isSP && product.description && (
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-sm font-semibold text-slate-800 mb-3">{t("prod2.detail.description")}</h2>
              <div
                className="text-sm text-slate-600 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Tabs — spareparts template */}
      {isSP ? (
        <ProductTabs product={product} reviewCount={0} />
      ) : (
        <ReviewSection productId={product.id} />
      )}
    </div>
  );
}
