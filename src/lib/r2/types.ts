export type PresignedUpload = {
  objectKey: string;
  uploadUrl: string;
  expiresAt: Date;
};

export type PutObjectInput = {
  objectKey: string;
  body: Buffer;
  contentType: string;
};

export type ObjectStorageAdapter = {
  readonly name: string;
  createPresignedUpload(input: {
    objectKey: string;
    contentType: string;
    maxBytes: number;
  }): Promise<PresignedUpload>;
  putObject(input: PutObjectInput): Promise<void>;
  buildPublicUrl(objectKey: string): string;
  /** Browser-readable URL (public CDN or short-lived signed GET). */
  resolveReadableUrl(objectKey: string): Promise<string>;
  deleteObject(objectKey: string): Promise<void>;
};
