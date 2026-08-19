import { describe, expect, it } from "vitest";

import { googleMapsSearchUrl } from "@/lib/maps/google-maps-url";

describe("googleMapsSearchUrl", () => {
  it("encodes the address for a Google Maps search in Yerevan", () => {
    expect(googleMapsSearchUrl("Պարույր Սևակի 92")).toBe(
      "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent("Պարույր Սևակի 92, Yerevan, Armenia"),
    );
  });
});
