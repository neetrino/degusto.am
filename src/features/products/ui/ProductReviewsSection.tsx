import {
  RatingDistribution,
  RatingStars,
} from "@/features/products/ui/ProductReviewRating";
import { ProductWriteReviewCta } from "@/features/products/ui/ProductWriteReviewCta";
import type { ProductReviewsView } from "@/features/reviews/application/queries";
import { buildReviewAggregate } from "@/features/reviews/domain/review-rules";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

type ProductReviewsSectionProps = {
  locale: Locale;
  productId: string;
  productSlug: string;
  reviewsView: ProductReviewsView;
  isSignedIn: boolean;
  labels: Dictionary["product"];
};

function formatAverage(average: number): string {
  return average.toFixed(1);
}

/** PDP reviews block — Degusto reference summary + list. */
export function ProductReviewsSection({
  locale,
  productId,
  productSlug,
  reviewsView,
  isSignedIn,
  labels,
}: ProductReviewsSectionProps) {
  const { reviews, viewerReview } = reviewsView;

  const ratings = reviews.map((review) => review.rating);
  if (viewerReview && viewerReview.moderationStatus !== "APPROVED") {
    ratings.push(viewerReview.rating);
  }
  const aggregate = buildReviewAggregate(ratings);
  const isEmpty = aggregate.count === 0;
  const displayAverage = aggregate.count === 0 ? 5 : aggregate.average;

  return (
    <section className="flex w-full flex-col gap-8">
      <h2 className="text-[1.815rem] font-bold leading-normal text-black">
        {labels.reviews}
      </h2>

      <div className="grid w-full grid-cols-1 items-center gap-8 md:grid-cols-[1fr_minmax(10rem,16rem)] md:gap-12">
        <RatingDistribution aggregate={aggregate} />

        <div className="flex flex-col items-start gap-2 md:items-end md:text-right">
          <p className="text-5xl font-bold tracking-tight text-black md:text-6xl">
            {formatAverage(displayAverage)}
          </p>
          <RatingStars average={displayAverage} tone="brand" />
          <p className="text-sm text-[#717182]">
            {labels.reviewCount.replace("{count}", String(aggregate.count))}
          </p>
        </div>
      </div>

      {reviews.length > 0 ? (
        <ul className="flex w-full flex-col gap-3">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="w-full rounded-[20px] border border-[#dedede] bg-white p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-product-ink">
                  {review.authorName}
                </p>
                <RatingStars average={review.rating} size="sm" tone="brand" />
              </div>
              {review.comment ? (
                <p className="mt-2 text-sm text-[#5F6B66]">{review.comment}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <ProductWriteReviewCta
        locale={locale}
        productId={productId}
        productSlug={productSlug}
        canSubmit={reviewsView.canSubmit}
        isSignedIn={isSignedIn}
        existingReviewId={reviewsView.existingReviewId}
        viewerReview={reviewsView.viewerReview}
        showEmptyPrompt={isEmpty}
        labels={{
          writeReview: labels.writeReview,
          writeReviewTitle: labels.writeReviewTitle,
          editReview: labels.editReview,
          editReviewTitle: labels.editReviewTitle,
          ratingLabel: labels.ratingLabel,
          yourReviewLabel: labels.yourReviewLabel,
          reviewPlaceholder: labels.reviewPlaceholder,
          submitReview: labels.submitReview,
          submittingReview: labels.submittingReview,
          saveReview: labels.saveReview,
          savingReview: labels.savingReview,
          cancelReview: labels.cancelReview,
          reviewPending: labels.reviewPending,
          emptyPrompt: labels.emptyPrompt,
          alreadyReviewed: labels.alreadyReviewed,
          reviewsUnlock: labels.reviewsUnlock,
          signIn: labels.signIn,
          signInToReview: labels.signInToReview,
        }}
      />
    </section>
  );
}
