type CloudinaryCredentials = {
  cloud_name: string;
  api_key: string;
  api_secret: string;
  secure: true;
};

type CloudinarySdk = {
  config: (credentials: CloudinaryCredentials) => void;
  uploader: {
    upload_stream: (options: Record<string, unknown>, callback: (error?: Error, result?: { secure_url?: string; public_id?: string }) => void) => { end: (bytes: Buffer) => void };
  };
};

let cloudinarySdk: Promise<CloudinarySdk> | undefined;
let rememberedCloudinaryUrl: string | undefined;
let configuredCloudinarySdk: Promise<CloudinarySdk> | undefined;

async function loadCloudinary(): Promise<CloudinarySdk> {
  if (!cloudinarySdk) {
    const inheritedUrl = process.env.CLOUDINARY_URL;
    delete process.env.CLOUDINARY_URL;
    cloudinarySdk = import("cloudinary")
      .then(module => module.v2 as unknown as CloudinarySdk)
      .finally(() => {
        if (inheritedUrl === undefined) delete process.env.CLOUDINARY_URL;
        else process.env.CLOUDINARY_URL = inheritedUrl;
      });
  }
  return cloudinarySdk;
}

async function configureCloudinary(): Promise<CloudinarySdk> {
  if (!configuredCloudinarySdk) {
    const inheritedUrl = process.env.CLOUDINARY_URL ?? rememberedCloudinaryUrl;
    if (inheritedUrl !== undefined) rememberedCloudinaryUrl = inheritedUrl;
    const credentials = cloudinaryCredentials(inheritedUrl);
    configuredCloudinarySdk = (async () => {
      delete process.env.CLOUDINARY_URL;
      try {
        const cloudinary = await loadCloudinary();
        cloudinary.config(credentials);
        return cloudinary;
      } finally {
        if (inheritedUrl === undefined) delete process.env.CLOUDINARY_URL;
        else process.env.CLOUDINARY_URL = inheritedUrl;
      }
    })();
  }
  return configuredCloudinarySdk;
}

export class StorageConfigurationError extends Error {
  constructor() {
    super("Cloudinary image storage is not configured.");
    this.name = "StorageConfigurationError";
  }
}

function cloudinaryCredentials(rawConfiguredUrl = process.env.CLOUDINARY_URL): CloudinaryCredentials {
  const configuredUrl = rawConfiguredUrl?.trim().replace(/^CLOUDINARY_URL\s*=\s*/i, "");
  if (configuredUrl) {
    try {
      const endpoint = new URL(configuredUrl);
      if (endpoint.protocol === "cloudinary:" && endpoint.hostname && endpoint.username && endpoint.password) {
        return {
          cloud_name: endpoint.hostname,
          api_key: decodeURIComponent(endpoint.username),
          api_secret: decodeURIComponent(endpoint.password),
          secure: true,
        };
      }
    } catch {
      // Fall through to the safe configuration error below.
    }
    throw new StorageConfigurationError();
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) throw new StorageConfigurationError();
  return { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true };
}

function normalisePublicId(relativeKey: string): string {
  const clean = relativeKey.replace(/^\/+/, "").replace(/\.[a-z0-9]+$/i, "");
  if (!clean || !/^[-a-zA-Z0-9_/.]+$/.test(clean)) throw new Error("Invalid image storage key.");
  return clean;
}

function createUniquePublicId(relativeKey: string): string {
  return `${normalisePublicId(relativeKey)}-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export async function storagePut(
  relativeKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const publicId = createUniquePublicId(relativeKey);
  const cloudinary = await configureCloudinary();
  const bytes = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        public_id: publicId,
        overwrite: false,
        unique_filename: false,
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        tags: ["qrserve", "menu-image"],
        context: { content_type: contentType },
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result?.secure_url || !result.public_id) {
          reject(new Error("Cloudinary did not return an image URL."));
          return;
        }
        resolve({ key: result.public_id, url: result.secure_url });
      },
    );
    stream.end(bytes);
  });
}
