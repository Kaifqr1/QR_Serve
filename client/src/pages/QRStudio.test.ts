import { describe, expect, it } from "vitest";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import QRCode from "qrcode";
import { QR_CARD_STYLES, QR_CODE_OPTIONS, restaurantMonogram } from "./QRStudio";

describe("QR Studio print card design system", () => {
  it("offers distinct branded print-card styles", () => {
    expect(Object.keys(QR_CARD_STYLES)).toEqual(["editorial", "midnight", "garden"]);
    expect(new Set(Object.values(QR_CARD_STYLES).map(style => style.accent)).size).toBe(3);
  });

  it("uses a compact restaurant monogram only when a logo image is unavailable", () => {
    expect(restaurantMonogram("Bandra Bhandara")).toBe("BB");
    expect(restaurantMonogram("XYZ")).toBe("X");
    expect(restaurantMonogram(" ")).toBe("R");
  });

  it("generates a scanner-readable, high-contrast QR code that keeps the guest menu destination", async () => {
    const destination = "https://qr-serve-three.vercel.app/menu/bandra-bhandara-sydkd6?source=qr";
    const dataUrl = await QRCode.toDataURL(destination, QR_CODE_OPTIONS);
    const png = PNG.sync.read(Buffer.from(dataUrl.split(",")[1], "base64"));
    const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);

    expect(QR_CODE_OPTIONS.margin).toBeGreaterThanOrEqual(4);
    expect(QR_CODE_OPTIONS.color).toEqual({ dark: "#171411", light: "#ffffff" });
    expect(decoded?.data).toBe(destination);
  });
});
