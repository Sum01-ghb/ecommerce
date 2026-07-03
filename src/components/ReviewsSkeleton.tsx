/**
 * ReviewsSkeleton.tsx — Server/client compatible
 * Suspense fallback for <ReviewsSection />.
 */
export default function ReviewsSkeleton() {
  return (
    <section aria-hidden="true" className="py-10 animate-pulse">
      <div className="h-6 w-28 bg-light-300 rounded-sm mb-6" />
      {/* Summary row */}
      <div className="flex items-center gap-3 mb-5 pb-5 border-b border-light-300">
        <div className="h-7 w-8 bg-light-300 rounded-sm" />
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-4 h-4 bg-light-300 rounded-sm" />
            ))}
          </div>
          <div className="h-3 w-28 bg-light-300 rounded-sm" />
        </div>
      </div>
      {/* Review rows */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="py-5 border-b border-light-300 space-y-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="w-3 h-3 bg-light-300 rounded-sm" />
            ))}
          </div>
          <div className="h-4 w-2/3 bg-light-300 rounded-sm" />
          <div className="h-3 w-full bg-light-300 rounded-sm" />
          <div className="h-3 w-4/5 bg-light-300 rounded-sm" />
          <div className="h-3 w-20 bg-light-300 rounded-sm" />
        </div>
      ))}
    </section>
  );
}
