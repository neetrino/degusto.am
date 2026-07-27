import { describe, expect, it } from "vitest";

import { getDictionary } from "@/lib/i18n/get-dictionary";

describe("getDictionary", () => {
  it("merges namespace files into the storefront dictionary shape", () => {
    const dictionary = getDictionary("en");

    expect(dictionary.brand).toBe("Degusto");
    expect(dictionary.nav.home).toBe("Home");
    expect(dictionary.nav.kitchen).toBe("Kitchen");
    expect(dictionary.header.search).toBe("Search");
    expect(dictionary.home.title).toBe("Degusto Food Studio");
    expect(dictionary.home.featuredTitleLead).toBe("We have");
    expect(dictionary.home.categoriesTitle).toBe("Categories");
    expect(dictionary.contact.title).toBe("Contact");
    expect(dictionary.cartDrawer.title).toBe("Shopping Cart");
    expect(dictionary.checkout.title).toBe("Checkout");
  });

  it("loads Armenian and Russian namespaces", () => {
    expect(getDictionary("hy").nav.home).toBe("Գլխավոր");
    expect(getDictionary("ru").nav.home).toBe("Главная");
  });
});
