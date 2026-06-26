import { describe, it, expect } from "vitest";
import { parseAdditionLabels } from "./parse-addition-labels";

describe("parseAdditionLabels", () => {
  it("returns trimmed non-empty labels", () => {
    expect(parseAdditionLabels(" Cheese , Bacon , ")).toEqual(["Cheese", "Bacon"]);
  });

  it("returns empty array for undefined or blank input", () => {
    expect(parseAdditionLabels(undefined)).toEqual([]);
    expect(parseAdditionLabels("  ,  ")).toEqual([]);
  });

  it("caps label count at 32", () => {
    const labels = Array.from({ length: 40 }, (_, index) => `item-${index}`);
    expect(parseAdditionLabels(labels.join(","))).toHaveLength(32);
  });
});
