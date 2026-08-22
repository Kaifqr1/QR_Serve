import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  config: vi.fn(),
  uploadStream: vi.fn(),
}));

vi.mock("cloudinary", () => ({
  v2: {
    config: mocks.config,
    uploader: { upload_stream: mocks.uploadStream },
  },
}));

import { StorageConfigurationError, storagePut } from "./storage";

const originalCloudinaryUrl = process.env.CLOUDINARY_URL;
const originalCloudName = process.env.CLOUDINARY_CLOUD_NAME;
const originalApiKey = process.env.CLOUDINARY_API_KEY;
const originalApiSecret = process.env.CLOUDINARY_API_SECRET;

describe("Cloudinary storage", () => {
  beforeEach(() => {
    mocks.config.mockReset();
    mocks.uploadStream.mockReset();
    delete process.env.CLOUDINARY_URL;
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
  });

  afterEach(() => {
    if (originalCloudinaryUrl === undefined) delete process.env.CLOUDINARY_URL;
    else process.env.CLOUDINARY_URL = originalCloudinaryUrl;
    if (originalCloudName === undefined) delete process.env.CLOUDINARY_CLOUD_NAME;
    else process.env.CLOUDINARY_CLOUD_NAME = originalCloudName;
    if (originalApiKey === undefined) delete process.env.CLOUDINARY_API_KEY;
    else process.env.CLOUDINARY_API_KEY = originalApiKey;
    if (originalApiSecret === undefined) delete process.env.CLOUDINARY_API_SECRET;
    else process.env.CLOUDINARY_API_SECRET = originalApiSecret;
  });

  it("fails safely when Cloudinary credentials are not configured", async () => {
    await expect(storagePut("qrserve/1/menu-images/dish.jpg", Buffer.from([0xff, 0xd8, 0xff]), "image/jpeg"))
      .rejects.toBeInstanceOf(StorageConfigurationError);
  });

  it("uploads repeat filenames through the authenticated server SDK with distinct public IDs and public HTTPS URLs", async () => {
    process.env.CLOUDINARY_URL = "cloudinary://example-key:example-secret@qrserve";
    const publicIds: string[] = [];
    mocks.uploadStream.mockImplementation((options: Record<string, unknown>, callback: (error?: Error, result?: { secure_url?: string; public_id?: string }) => void) => {
      const publicId = String(options.public_id);
      publicIds.push(publicId);
      expect(options).toMatchObject({
        resource_type: "image",
        overwrite: false,
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      });
      return { end: (bytes: Buffer) => {
        expect(bytes).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
        callback(undefined, {
          public_id: publicId,
          secure_url: `https://res.cloudinary.com/qrserve/image/upload/v1/${publicId}.jpg`,
        });
      } };
    });

    const [first, second] = await Promise.all([
      storagePut("qrserve/1/menu-images/dish.jpg", Buffer.from([0xff, 0xd8, 0xff]), "image/jpeg"),
      storagePut("qrserve/1/menu-images/dish.jpg", Buffer.from([0xff, 0xd8, 0xff]), "image/jpeg"),
    ]);

    expect(publicIds).toHaveLength(2);
    expect(new Set(publicIds).size).toBe(2);
    expect(publicIds.every(publicId => /^qrserve\/1\/menu-images\/dish-[a-f0-9]{12}$/.test(publicId))).toBe(true);
    expect(first.url).toMatch(/^https:\/\/res\.cloudinary\.com\/qrserve\/image\/upload\/v1\/qrserve\/1\/menu-images\/dish-[a-f0-9]{12}\.jpg$/);
    expect(second.url).toMatch(/^https:\/\/res\.cloudinary\.com\/qrserve\/image\/upload\/v1\/qrserve\/1\/menu-images\/dish-[a-f0-9]{12}\.jpg$/);
    expect(mocks.config).toHaveBeenCalledWith({ cloud_name: "qrserve", api_key: "example-key", api_secret: "example-secret", secure: true });
  });
});
