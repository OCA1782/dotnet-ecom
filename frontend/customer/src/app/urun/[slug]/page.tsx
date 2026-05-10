import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import type { ProductDetail } from "@/types";
import { formatPrice } from "@/lib/utils";
import AddToCartButton from "./AddToCartButton";
import ReviewSection from "./ReviewSection";
import ProductImageGallery from "./ProductImageGallery";

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

  return {
    title: product.metaTitle ?? product.name,
    description: product.metaDescription ?? product.shortDescription ?? `${product.name} — ${price.toFixed(2)} ₺`,
    openGraph: {
      title: product.name,
      description: product.shortDescription ?? undefined,
      images: mainImage?.imageUrl ? [{ url: mainImage.imageUrl, alt: product.name }] : [],
      type: "website",
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
  const product = await getProduct(slug);

  if (!product) notFound();

  const displayPrice = product.discountPrice ?? product.price;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <ProductImageGallery images={product.images ?? []} productName={product.name} />
        </div>

        {/* Info */}
        <div className="space-y-6">
          {product.brandName && (
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{product.brandName}</p>
          )}
          <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-slate-900">{formatPrice(displayPrice)}</span>
            {product.discountPrice && (
              <span className="text-lg text-slate-400 line-through">{formatPrice(product.price)}</span>
            )}
          </div>

          {product.shortDescription && (
            <p className="text-sm text-slate-600 leading-relaxed">{product.shortDescription}</p>
          )}

          {/* Stock status */}
          {product.availableStock === 0 ? (
            <span className="inline-block text-sm text-red-600 font-medium">Stokta Yok</span>
          ) : (
            <span className="inline-block text-sm text-green-600 font-medium">Stokta Var</span>
          )}

          {/* Add to cart */}
          <AddToCartButton
            productId={product.id}
            variants={product.variants ?? []}
            availableStock={product.availableStock}
          />

          {/* Description */}
          {product.description && (
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-sm font-semibold text-slate-800 mb-3">Ürün Açıklaması</h2>
              <div
                className="text-sm text-slate-600 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <ReviewSection productId={product.id} />
    </div>
  );
}
