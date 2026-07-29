"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Search } from "lucide-react";

import {
  HeaderSearchDropdown,
  type HeaderSearchSuggestion,
} from "@/components/layout/HeaderSearchDropdown";
import { useCatalogNavigation } from "@/features/products/ui/shop/CatalogNavContext";
import type { Locale } from "@/lib/i18n/config";

const SEARCH_DEBOUNCE_MS = 280;

type HeaderSearchProps = {
  locale: Locale;
  searchLabel: string;
  placeholder: string;
  loadingLabel: string;
  emptyLabel: string;
  seeAllLabel: string;
};

type SearchStatus = "loading" | "empty" | "results";

function buildCatalogSearchHref(locale: Locale, query: string): string {
  const params = new URLSearchParams();
  const trimmed = query.trim();
  if (trimmed) {
    params.set("q", trimmed);
  }
  params.set("category", "all");
  return `/${locale}/products?${params.toString()}`;
}

export function HeaderSearch({
  locale,
  searchLabel,
  placeholder,
  loadingLabel,
  emptyLabel,
  seeAllLabel,
}: HeaderSearchProps) {
  const router = useRouter();
  const inputId = useId();
  const listboxId = useId();
  const rootRef = useRef<HTMLFormElement>(null);
  const requestIdRef = useRef(0);
  const { isPending, startCatalogTransition } = useCatalogNavigation();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<SearchStatus | null>(null);
  const [items, setItems] = useState<HeaderSearchSuggestion[]>([]);

  const trimmedQuery = query.trim();
  const showDropdown = isOpen && trimmedQuery.length > 0 && status != null;

  useEffect(() => {
    if (!trimmedQuery) {
      return;
    }

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        setStatus("loading");
        try {
          const params = new URLSearchParams({
            q: trimmedQuery,
            locale,
          });
          const response = await fetch(`/api/catalog/search?${params}`, {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          });
          if (requestId !== requestIdRef.current) {
            return;
          }
          if (!response.ok) {
            setItems([]);
            setStatus("empty");
            return;
          }
          const payload = (await response.json()) as {
            items?: HeaderSearchSuggestion[];
          };
          const nextItems = Array.isArray(payload.items) ? payload.items : [];
          setItems(nextItems);
          setStatus(nextItems.length > 0 ? "results" : "empty");
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          if (requestId !== requestIdRef.current) {
            return;
          }
          setItems([]);
          setStatus("empty");
        }
      })();
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [locale, trimmedQuery]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function navigateToCatalog(nextQuery: string): void {
    setIsOpen(false);
    startCatalogTransition(() => {
      router.push(buildCatalogSearchHref(locale, nextQuery));
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    navigateToCatalog(query);
  }

  function handleQueryChange(value: string): void {
    setQuery(value);
    setIsOpen(true);
    if (!value.trim()) {
      setStatus(null);
      setItems([]);
      return;
    }
    setStatus("loading");
  }

  return (
    <form
      ref={rootRef}
      onSubmit={handleSubmit}
      className="relative hidden h-12 w-[340px] shrink-0 items-center rounded-full bg-white lg:flex"
      role="search"
      aria-busy={isPending || status === "loading"}
    >
      <label htmlFor={inputId} className="sr-only">
        {searchLabel}
      </label>
      <input
        id={inputId}
        type="search"
        name="q"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        value={query}
        onChange={(event) => handleQueryChange(event.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={isPending}
        autoComplete="off"
        className="h-full w-full min-w-0 rounded-full bg-transparent pr-[7.5rem] pl-4 text-base text-product-ink outline-none placeholder:text-[rgba(105,105,105,0.56)] disabled:opacity-70"
      />
      <button
        type="submit"
        disabled={isPending}
        className="absolute top-1 right-1 z-10 inline-flex h-10 items-center gap-1.5 rounded-[20px] bg-brand py-2 pr-4 pl-3 text-[15px] font-semibold text-white transition hover:bg-brand-strong disabled:opacity-70"
      >
        <Search className="size-5 shrink-0" aria-hidden />
        <span>{searchLabel}</span>
      </button>

      {showDropdown && status != null ? (
        <div id={listboxId}>
          <HeaderSearchDropdown
            status={status}
            items={items}
            loadingLabel={loadingLabel}
            emptyLabel={emptyLabel}
            seeAllLabel={seeAllLabel}
            seeAllHref={buildCatalogSearchHref(locale, query)}
            onNavigate={() => setIsOpen(false)}
          />
        </div>
      ) : null}
    </form>
  );
}
