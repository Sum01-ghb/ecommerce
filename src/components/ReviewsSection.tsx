/**
 * ReviewsSection.tsx — Server component
 *
 * Renders the first 10 approved reviews for a product.
 * Consumed inside a <Suspense> boundary in the PDP so it never blocks
 * the main product content from rendering.
 *
 * Each review body that exceeds 160 characters is rendered inside a
 * <CollapsibleSection> so the list doesn't grow unwieldy.
 *
 * Accessibility:
 *   • Star rating uses aria-label for screen readers.
 *   • Review list is a <ul> with <li> items.
 *   • Relative dates use <time> with a machine-readable datetime.
 */

import { Star } from "lucide-react";
import { getProductReviews } from "@/lib/actions/product";
import type { ReviewItem } from "@/lib/actions/product";
import CollapsibleReviewText from "@/components/CollapsibleReviewText";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function StarRating({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
      role="img"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          aria-hidden="true"
          className={
            i < rating
              ? "fill-dark-900 text-dark-900"
              : "fill-none text-light-400 stroke-light-400"
          }
        />
      ))}
    </span>
  );
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now  = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60)         return "Just now";
  if (diff < 3600)       return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)      return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000)    return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000)   return `${Math.floor(diff / 2592000)}mo ago`;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// ─────────────────────────────────────────────────────────────────────────────
// Average rating summary
// ─────────────────────────────────────────────────────────────────────────────

function RatingSummary({ reviews }: { reviews: ReviewItem[] }) {
  if (reviews.length === 0) return null;

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const rounded = Math.round(avg * 10) / 10;

  return (
    <div className="flex items-center gap-3 mb-5 pb-5 border-b border-light-300">
      <span className="text-heading-3 font-medium text-dark-900">{rounded.toFixed(1)}</span>
      <div className="flex flex-col gap-0.5">
        <StarRating rating={Math.round(avg)} size={15} />
        <p className="text-footnote text-dark-500">
          Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single review card
// ─────────────────────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: ReviewItem }) {
  const isLong = review.content.length > 160;

  return (
    <li className="py-5 border-b border-light-300 last:border-0">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex flex-col gap-0.5">
          <StarRating rating={review.rating} />
          {review.title && (
            <p className="text-caption font-medium text-dark-900 mt-1">{review.title}</p>
          )}
        </div>
        <time
          dateTime={review.createdAt}
          className="text-footnote text-dark-500 whitespace-nowrap flex-shrink-0"
        >
          {formatRelativeDate(review.createdAt)}
        </time>
      </div>

      {isLong ? (
        <CollapsibleReviewText content={review.content} />
      ) : (
        <p className="text-caption text-dark-700 leading-relaxed">{review.content}</p>
      )}

      <p className="mt-2 text-footnote text-dark-500">{review.author}</p>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export — server component
// ─────────────────────────────────────────────────────────────────────────────

interface ReviewsSectionProps {
  productId: string;
}

export default async function ReviewsSection({ productId }: ReviewsSectionProps) {
  const reviews = await getProductReviews(productId);

  if (reviews.length === 0) {
    return (
      <section aria-label="Customer reviews" className="py-10">
        <h2 className="text-heading-3 font-medium text-dark-900 mb-4">Reviews</h2>
        <p className="text-caption text-dark-500">
          No reviews yet. Be the first to share your thoughts.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Customer reviews" className="py-10">
      <h2 className="text-heading-3 font-medium text-dark-900 mb-6">Reviews</h2>
      <RatingSummary reviews={reviews} />
      <ul role="list" aria-label={`${reviews.length} customer reviews`}>
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </ul>
    </section>
  );
}
