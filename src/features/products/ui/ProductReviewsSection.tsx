"use client";

import { motion, useReducedMotion } from "motion/react";

import {
  PRODUCT_EASE,
  productInfoItem,
  productInfoStagger,
} from "@/features/products/ui/ProductDetailMotion";
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

/** PDP reviews block — Motion reveal + Degusto summary/list. */
export function ProductReviewsSection({
  locale,
  productId,
  productSlug,
  reviewsView,
  isSignedIn,
  labels,
}: ProductReviewsSectionProps) {
  const reduceMotion = useReducedMotion();
  const { reviews, viewerReview } = reviewsView;

  const ratings = reviews.map((review) => review.rating);
  if (viewerReview && viewerReview.moderationStatus !== "APPROVED") {
    ratings.push(viewerReview.rating);
  }
  const aggregate = buildReviewAggregate(ratings);
  const isEmpty = aggregate.count === 0;
  const displayAverage = aggregate.count === 0 ? 5 : aggregate.average;

  return (
    <motion.section
      initial={reduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={reduceMotion ? undefined : productInfoStagger}
      className="flex w-full flex-col gap-8"
    >
      <motion.h2
        variants={reduceMotion ? undefined : productInfoItem}
        className="text-[1.815rem] font-bold leading-normal text-black"
      >
        {labels.reviews}
      </motion.h2>

      <div className="grid w-full grid-cols-1 items-center gap-8 md:grid-cols-[1fr_minmax(10rem,16rem)] md:gap-12">
        <motion.div
          variants={reduceMotion ? undefined : productInfoItem}
          className="flex flex-col items-center gap-2 text-center md:order-2 md:items-end md:text-right"
        >
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, scale: 0.85, y: 16 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 140, damping: 16, delay: 0.1 }}
            className="text-5xl font-bold tracking-tight text-black md:text-6xl"
          >
            {formatAverage(displayAverage)}
          </motion.p>
          <RatingStars average={displayAverage} tone="brand" />
          <p className="text-sm text-[#717182]">
            {labels.reviewCount.replace("{count}", String(aggregate.count))}
          </p>
        </motion.div>

        <motion.div
          variants={reduceMotion ? undefined : productInfoItem}
          className="md:order-1"
        >
          <RatingDistribution aggregate={aggregate} />
        </motion.div>
      </div>

      {reviews.length > 0 ? (
        <ul className="flex w-full flex-col gap-3">
          {reviews.map((review, index) => (
            <motion.li
              key={review.id}
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, y: 24, filter: "blur(8px)" }
              }
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.55,
                ease: PRODUCT_EASE,
                delay: index * 0.06,
              }}
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
            </motion.li>
          ))}
        </ul>
      ) : null}

      <motion.div variants={reduceMotion ? undefined : productInfoItem}>
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
      </motion.div>
    </motion.section>
  );
}
