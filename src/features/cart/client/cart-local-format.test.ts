import { describe, expect, it } from "vitest";

import {
  emptyCartShipping,
  recomputeCartLocalView,
} from "@/features/cart/client/cart-local-format";
import type { CartLocalItem } from "@/features/cart/client/cart-local-types";

describe("recomputeCartLocalView", () => {
  it("recalculates totals from unit amounts", () => {
    const items: CartLocalItem[] = [
      {
        id: "a",
        productId: "p1",
        title: "Cake",
        quantity: 2,
        imageUrl: null,
        unitAmount: 1500,
        unitPriceFormatted: "1.500 AMD",
        lineTotalFormatted: "1.500 AMD",
      },
    ];

    const view = recomputeCartLocalView(
      items,
      "hy",
      "AMD",
      emptyCartShipping("hy", "AMD"),
    );

    expect(view.itemCount).toBe(2);
    expect(view.subtotalFormatted).toBe("3000 AMD");
    expect(view.items[0]?.lineTotalFormatted).toBe("3000 AMD");
  });

  it("drops zero-quantity lines", () => {
    const items: CartLocalItem[] = [
      {
        id: "a",
        productId: "p1",
        title: "Cake",
        quantity: 0,
        imageUrl: null,
        unitAmount: 1500,
        unitPriceFormatted: "1.500 AMD",
        lineTotalFormatted: "1.500 AMD",
      },
    ];

    const view = recomputeCartLocalView(
      items,
      "hy",
      "AMD",
      emptyCartShipping("hy", "AMD"),
    );

    expect(view.itemCount).toBe(0);
    expect(view.items).toHaveLength(0);
  });
});
