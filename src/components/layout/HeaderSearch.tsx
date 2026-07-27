"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

import type { Locale } from "@/lib/i18n/config";

type HeaderSearchProps = {
  locale: Locale;
  searchLabel: string;
  placeholder: string;
};

export function HeaderSearch({
  locale,
  searchLabel,
  placeholder,
}: HeaderSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed = query.trim();
    const params = new URLSearchParams();
    if (trimmed) {
      params.set("q", trimmed);
    }
    const suffix = params.size > 0 ? `?${params.toString()}` : "";
    router.push(`/${locale}/products${suffix}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative hidden h-12 w-[237px] shrink-0 items-center rounded-full bg-white lg:flex"
      role="search"
    >
      <label htmlFor="header-search" className="sr-only">
        {searchLabel}
      </label>
      <input
        id="header-search"
        type="search"
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="h-full w-full min-w-0 rounded-full bg-transparent pr-[7.5rem] pl-4 text-base text-product-ink outline-none placeholder:text-[rgba(105,105,105,0.56)]"
      />
      <button
        type="submit"
        className="absolute top-1 right-1 inline-flex h-10 items-center gap-1.5 rounded-[20px] bg-brand py-2 pr-4 pl-3 text-[15px] font-semibold text-white transition hover:bg-brand-strong"
      >
        <Search className="size-5 shrink-0" aria-hidden />
        <span>{searchLabel}</span>
      </button>
    </form>
  );
}
