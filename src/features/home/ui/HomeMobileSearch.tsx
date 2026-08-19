"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { useCatalogNavigation } from "@/features/products/ui/shop/CatalogNavContext";
import {
  shouldCommitCatalogSearch,
  useDebouncedCatalogSearch,
} from "@/features/products/ui/shop/use-debounced-catalog-search";
import type { Locale } from "@/lib/i18n/config";
import { staticAssetUrl } from "@/lib/media/static-asset-url";

type HomeMobileSearchProps = {
  locale: Locale;
  searchLabel: string;
  placeholder: string;
  defaultQuery?: string;
};

/**
 * Home mobile search pill — white field + filter submit control.
 */
export function HomeMobileSearch({
  locale,
  searchLabel,
  placeholder,
  defaultQuery = "",
}: HomeMobileSearchProps) {
  const router = useRouter();
  const { isPending, startCatalogTransition } = useCatalogNavigation();
  const [query, setQuery] = useState(defaultQuery);
  const [isDirty, setIsDirty] = useState(false);
  const lastUrlQueryRef = useRef(defaultQuery);

  useEffect(() => {
    if (defaultQuery === lastUrlQueryRef.current) {
      return;
    }
    lastUrlQueryRef.current = defaultQuery;
    setQuery(defaultQuery);
    setIsDirty(false);
  }, [defaultQuery]);

  function commitSearch(nextQuery: string): void {
    const trimmed = nextQuery.trim();
    if (!shouldCommitCatalogSearch(trimmed, defaultQuery)) {
      setIsDirty(false);
      return;
    }
    lastUrlQueryRef.current = trimmed;
    setIsDirty(false);
    const params = new URLSearchParams();
    if (trimmed) {
      params.set("q", trimmed);
    }
    params.set("category", "all");
    startCatalogTransition(() => {
      router.push(`/${locale}/products?${params.toString()}`);
    });
  }

  useDebouncedCatalogSearch({
    draftQuery: query,
    committedQuery: defaultQuery,
    isDirty,
    onCommit: commitSearch,
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    commitSearch(query);
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-busy={isPending}
      className="relative z-0 mt-2 h-12 translate-y-5 rounded-[30px] bg-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)]"
    >
      <label htmlFor="storefront-mobile-search" className="sr-only">
        {searchLabel}
      </label>
      <Image
        src={staticAssetUrl("/assets/mobile/search-icon.webp")}
        alt=""
        width={17}
        height={17}
        className="pointer-events-none absolute top-1/2 left-[15px] h-[17px] w-[17px] -translate-y-1/2 object-contain brightness-0"
        aria-hidden
      />
      <input
        id="storefront-mobile-search"
        type="search"
        name="q"
        value={query}
        onChange={(event) => {
          setIsDirty(true);
          setQuery(event.target.value);
        }}
        placeholder={placeholder}
        enterKeyHint="search"
        autoComplete="off"
        className="h-full w-full rounded-[30px] bg-transparent pr-[58px] pl-[39px] text-base leading-6 text-black outline-none placeholder:text-[#abb7c2]"
      />
      <button
        type="submit"
        aria-label={searchLabel}
        className="absolute top-1/2 right-[7px] inline-flex size-10 -translate-y-1/2 items-center justify-center"
      >
        <Image
          src={staticAssetUrl("/assets/mobile/search-filter.webp")}
          alt=""
          width={40}
          height={40}
          className="size-10 object-contain"
          aria-hidden
        />
      </button>
    </form>
  );
}
