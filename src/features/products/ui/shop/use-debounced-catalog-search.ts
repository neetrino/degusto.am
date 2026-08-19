"use client";

import { useEffect, useRef } from "react";

/** Idle time after the last keystroke before catalog search commits. */
export const CATALOG_SEARCH_DEBOUNCE_MS = 2000;

/** True when the draft query should replace the URL search value. */
export function shouldCommitCatalogSearch(
  draftQuery: string,
  committedQuery: string,
): boolean {
  return draftQuery.trim() !== committedQuery.trim();
}

/** Clearing the field should drop the filter immediately. */
export function shouldCommitCatalogSearchImmediately(
  draftQuery: string,
  committedQuery: string,
): boolean {
  return (
    shouldCommitCatalogSearch(draftQuery, committedQuery) &&
    draftQuery.trim() === ""
  );
}

/** Only the field the user is editing may schedule a catalog request. */
export function shouldScheduleCatalogSearch(
  draftQuery: string,
  committedQuery: string,
  isDirty: boolean,
): boolean {
  return isDirty && shouldCommitCatalogSearch(draftQuery, committedQuery);
}

type DebouncedCatalogSearchOptions = {
  draftQuery: string;
  committedQuery: string;
  isDirty: boolean;
  onCommit: (nextQuery: string) => void;
};

/**
 * Commits only after the user edits this field. A cleared query applies
 * immediately; typed queries wait until typing stops.
 */
export function useDebouncedCatalogSearch({
  draftQuery,
  committedQuery,
  isDirty,
  onCommit,
}: DebouncedCatalogSearchOptions): void {
  const onCommitRef = useRef(onCommit);

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    if (!shouldScheduleCatalogSearch(draftQuery, committedQuery, isDirty)) {
      return;
    }

    if (shouldCommitCatalogSearchImmediately(draftQuery, committedQuery)) {
      onCommitRef.current(draftQuery);
      return;
    }

    const timer = window.setTimeout(() => {
      onCommitRef.current(draftQuery);
    }, CATALOG_SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [committedQuery, draftQuery, isDirty]);
}
