/**
 * RecommendedSkeleton.tsx — Server/client compatible
 * Suspense fallback for <RecommendedProductsSection />.
 */
export default function RecommendedSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-16 pb-16 animate-pulse"
    >
      <div className="h-6 w-48 bg-light-300 rounded-sm mb-6" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4 lg:gap-x-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="aspect-square w-full bg-light-300 rounded-sm" />
            <div className="h-4 w-3/4 bg-light-300 rounded-sm" />
            <div className="h-3 w-1/2 bg-light-300 rounded-sm" />
            <div className="h-3 w-1/3 bg-light-300 rounded-sm" />
          </div>
        ))}
      </div>
    </section>
  );
}
