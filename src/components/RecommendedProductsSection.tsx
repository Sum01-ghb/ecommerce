/**
 * RecommendedProductsSection.tsx — Server component
 *
 * Fetches and renders "You Might Also Like" product cards.
 * Loaded inside a <Suspense> boundary so it never blocks PDP rendering.
 * Silently hides itself when no valid recommendations are found.
 */

import Card from "@/components/Card";
import { getRecommendedProducts } from "@/lib/actions/product";

interface RecommendedProductsSectionProps {
  productId: string;
}

export default async function RecommendedProductsSection({
  productId,
}: RecommendedProductsSectionProps) {
  const products = await getRecommendedProducts(productId);

  // Hide the section entirely if there's nothing to show
  if (products.length === 0) return null;

  return (
    <section
      aria-label="You might also like"
      className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-16 pb-16"
    >
      <h2 className="text-heading-3 font-medium text-dark-900 mb-6">
        You Might Also Like
      </h2>
      <ul
        role="list"
        className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4 lg:gap-x-6"
      >
        {products.map((product) => (
          <li key={product.id}>
            <Card
              id={product.id}
              name={product.name}
              category={`${product.genderLabel}'s ${product.category}`}
              colourCount={product.colourCount}
              price={product.price}
              originalPrice={product.originalPrice}
              imageSrc={product.imageSrc}
              badge={product.badge}
              discountLabel={product.discountLabel}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
