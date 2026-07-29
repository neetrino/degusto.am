import { describe, expect, it } from "vitest";

import { isR2Configured } from "@/lib/r2/is-configured";
import {
  isR2ApiEndpointUrl,
  isR2PublicBaseUrlUsable,
} from "@/lib/r2/public-base-url";
import { createStubObjectStorageAdapter } from "@/lib/r2/stub-adapter";

describe("createStubObjectStorageAdapter", () => {
  it("builds relative public URLs when base is empty", () => {
    const storage = createStubObjectStorageAdapter("");
    expect(storage.buildPublicUrl("uploads/products/a.jpg")).toBe(
      "/uploads/products/a.jpg",
    );
  });

  it("builds absolute public URLs when base is set", () => {
    const storage = createStubObjectStorageAdapter(
      "https://cdn.example.com/",
    );
    expect(storage.buildPublicUrl("uploads/products/a.jpg")).toBe(
      "https://cdn.example.com/uploads/products/a.jpg",
    );
  });
});

describe("isR2Configured", () => {
  it("requires every credential field", () => {
    expect(
      isR2Configured({
        accountId: "a",
        accessKeyId: "b",
        secretAccessKey: "c",
        bucketName: "d",
        publicBaseUrl: "https://cdn.example.com",
      }),
    ).toBe(true);

    expect(
      isR2Configured({
        accountId: "a",
        accessKeyId: "b",
        secretAccessKey: "c",
        bucketName: "d",
      }),
    ).toBe(false);
  });
});

describe("R2 public base URL", () => {
  it("detects S3 API hosts as unusable public bases", () => {
    expect(
      isR2ApiEndpointUrl("https://abc.r2.cloudflarestorage.com"),
    ).toBe(true);
    expect(
      isR2PublicBaseUrlUsable("https://abc.r2.cloudflarestorage.com"),
    ).toBe(false);
    expect(isR2PublicBaseUrlUsable("https://pub-abc.r2.dev")).toBe(true);
  });
});
