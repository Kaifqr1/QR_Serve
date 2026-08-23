import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Check, Copy, Download, ExternalLink, Palette, Printer, QrCode, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation, useRoute } from "wouter";

export type QrCardStyle = "editorial" | "midnight" | "garden";

export const QR_CARD_STYLES: Record<QrCardStyle, { name: string; description: string; eyebrow: string; accent: string; accentSoft: string; paper: string; ink: string; muted: string; border: string; qrFrame: string; flourish: string }> = {
  editorial: {
    name: "Warm editorial",
    description: "Polished dining rooms & cafés",
    eyebrow: "At your table",
    accent: "#e65938",
    accentSoft: "#f5c9b6",
    paper: "#f7efe4",
    ink: "#211a16",
    muted: "#6f6257",
    border: "#dbcdbd",
    qrFrame: "#ffffff",
    flourish: "radial-gradient(circle at 92% 8%, rgba(230,89,56,0.20), transparent 31%), linear-gradient(145deg, #fbf6ef 0%, #f1e1cf 100%)",
  },
  midnight: {
    name: "Midnight reserve",
    description: "Bars, lounges & late dining",
    eyebrow: "Tonight’s table",
    accent: "#d8aa65",
    accentSoft: "#3b302c",
    paper: "#191716",
    ink: "#fcf6ed",
    muted: "#d7c8b7",
    border: "#4d4238",
    qrFrame: "#ffffff",
    flourish: "radial-gradient(circle at 85% 4%, rgba(216,170,101,0.28), transparent 28%), linear-gradient(155deg, #131110 0%, #2e2420 100%)",
  },
  garden: {
    name: "Garden table",
    description: "Bistros, bakeries & daytime menus",
    eyebrow: "A fresh look inside",
    accent: "#2e6b57",
    accentSoft: "#bfdbcc",
    paper: "#eaf1e9",
    ink: "#183b31",
    muted: "#4b695e",
    border: "#bdd0c1",
    qrFrame: "#ffffff",
    flourish: "radial-gradient(circle at 10% 8%, rgba(46,107,87,0.17), transparent 26%), linear-gradient(145deg, #f8fbf6 0%, #dcebdd 100%)",
  },
};

export function restaurantMonogram(name?: string | null) {
  const words = (name ?? "Restaurant").trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map(word => word[0]?.toUpperCase()).join("") || "R";
}

export default function QRStudio() {
  const [, params] = useRoute("/app/qr/:id");
  const restaurantId = Number(params?.id);
  const restaurant = trpc.restaurant.get.useQuery({ id: restaurantId }, { enabled: Number.isFinite(restaurantId) });
  const [, setLocation] = useLocation();
  const [image, setImage] = useState("");
  const [copied, setCopied] = useState(false);
  const [style, setStyle] = useState<QrCardStyle>("editorial");
  const publicUrl = restaurant.data ? `${window.location.origin}/menu/${restaurant.data.slug}?source=qr` : "";
  const palette = QR_CARD_STYLES[style];

  const cardStyle = useMemo(() => ({
    "--qr-paper": palette.paper,
    "--qr-ink": palette.ink,
    "--qr-muted": palette.muted,
    "--qr-accent": palette.accent,
    "--qr-accent-soft": palette.accentSoft,
    "--qr-border": palette.border,
    "--qr-frame": palette.qrFrame,
    "--qr-flourish": palette.flourish,
  }) as React.CSSProperties, [palette]);

  useEffect(() => {
    if (!publicUrl) return;
    QRCode.toDataURL(publicUrl, {
      width: 800,
      margin: 4,
      errorCorrectionLevel: "H",
      color: { dark: "#171411", light: "#ffffff" },
    }).then(setImage).catch(() => toast.error("QR image could not be prepared."));
  }, [publicUrl]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Menu link copied.");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copy is unavailable here. Select the menu address below.");
    }
  };

  const download = () => {
    const anchor = document.createElement("a");
    anchor.href = image;
    anchor.download = `${restaurant.data?.slug ?? "qrserve-menu"}-qr.png`;
    anchor.click();
  };

  if (!Number.isFinite(restaurantId)) return <DashboardLayout><p>Restaurant not found.</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        <button onClick={() => setLocation(`/app/menu/${restaurantId}`)} className="text-sm text-[#766b5d] transition hover:text-[#201d19]">← Back to menu builder</button>
        <div className="mt-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow border-[#d9cabe] text-[#8b7560]">QR card designer</p>
            <h1 className="mt-3 max-w-2xl font-display text-4xl tracking-[-0.045em] text-[#201d19] sm:text-5xl">Make every scan feel like your restaurant.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#706459]">Choose a print-ready style, add your restaurant mark, and give guests a clear invitation to explore the menu.</p>
          </div>
          {restaurant.data && <a href={`/menu/${restaurant.data.slug}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center rounded-full border border-[#d7cfc3] px-4 text-sm font-medium text-[#201d19] transition hover:border-[#201d19]"><ExternalLink className="mr-2 h-4 w-4" />Open public menu</a>}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.68fr_1.32fr]">
          <aside className="rounded-[1.75rem] border border-[#dfd4c7] bg-[#fbf9f5] p-5 shadow-[0_12px_28px_rgba(72,52,35,0.05)] sm:p-6">
            <div className="flex items-center gap-2 text-[#201d19]"><Palette className="h-4 w-4 text-[#df583a]" /><h2 className="font-semibold">Choose a card style</h2></div>
            <p className="mt-2 text-sm leading-6 text-[#75695d]">Each style keeps a high-contrast QR zone and an easy-to-read guest invitation.</p>
            <div className="mt-5 grid gap-3">
              {(Object.entries(QR_CARD_STYLES) as [QrCardStyle, typeof QR_CARD_STYLES[QrCardStyle]][]).map(([key, option]) => (
                <button key={key} onClick={() => setStyle(key)} aria-pressed={style === key} className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${style === key ? "border-[#201d19] bg-[#f3ece3] shadow-[0_6px_16px_rgba(53,37,25,0.08)]" : "border-[#e4dbd1] bg-white hover:border-[#bcae9f]"}`}>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border" style={{ background: option.flourish, borderColor: option.border, color: option.ink }}><span className="h-4 w-4 rounded-sm border-2 border-current" /><span className="sr-only">{option.name} style</span></span>
                  <span className="min-w-0"><span className="block text-sm font-semibold text-[#29221d]">{option.name}</span><span className="mt-0.5 block text-xs text-[#7a6f64]">{option.description}</span></span>
                  {style === key && <Check className="ml-auto h-4 w-4 shrink-0 text-[#201d19]" />}
                </button>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-[#e3d9cf] bg-[#f4eee6] p-4">
              <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#2e6b57]" /><div><p className="text-sm font-semibold text-[#302720]">Made for real-world scanning</p><p className="mt-1 text-xs leading-5 text-[#776b5f]">The QR stays black on white with a generous white quiet zone. Print at 100% scale and keep it at least 25 mm wide.</p></div></div>
            </div>
          </aside>

          <section>
            <div className="mb-3 flex items-center justify-between px-1"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7d7064]">Live print preview</p><p className="inline-flex items-center gap-1.5 text-xs text-[#7b6f62]"><Sparkles className="h-3.5 w-3.5 text-[#df583a]" />Restaurant-branded</p></div>
            <article className="qr-print-card relative mx-auto min-h-[630px] max-w-[540px] overflow-hidden rounded-[2.25rem] border p-5 shadow-[0_20px_50px_rgba(74,47,26,0.18)] sm:p-8" style={cardStyle}>
              <div className="qr-print-flourish pointer-events-none absolute inset-0" />
              <div className="relative flex min-h-[570px] flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.17em]" style={{ color: "var(--qr-ink)", borderColor: "var(--qr-border)", backgroundColor: "color-mix(in srgb, var(--qr-paper) 80%, transparent)" }}><ScanLine className="h-3.5 w-3.5" />{palette.eyebrow}</div>
                  <div className="qr-print-mark grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border text-sm font-bold" style={{ color: "var(--qr-ink)", borderColor: "var(--qr-border)", background: "var(--qr-accent-soft)" }}>
                    {restaurant.data?.logoUrl ? <img src={restaurant.data.logoUrl} alt={`${restaurant.data.name} logo`} className="h-full w-full object-cover" /> : restaurantMonogram(restaurant.data?.name)}
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--qr-accent)" }}>Scan. Browse. Enjoy.</p>
                  <h2 className="mt-3 font-display text-4xl leading-[0.95] tracking-[-0.05em] sm:text-5xl" style={{ color: "var(--qr-ink)" }}>{restaurant.data?.name ?? "Your restaurant"}</h2>
                  <p className="mt-3 text-sm" style={{ color: "var(--qr-muted)" }}>{restaurant.data?.location ?? "Your table is ready"}</p>
                </div>

                <div className="my-auto pt-8">
                  <div className="qr-code-frame mx-auto max-w-[292px] rounded-[1.6rem] border p-3 shadow-[0_14px_30px_rgba(22,16,11,0.12)]" style={{ background: "var(--qr-frame)", borderColor: "rgba(23,20,17,0.10)" }}>
                    {image ? <img src={image} alt={`QR code for ${restaurant.data?.name ?? "restaurant"} public menu`} className="block h-auto w-full" /> : <div className="grid aspect-square place-items-center"><QrCode className="h-10 w-10 animate-pulse text-[#9c8d7b]" /></div>}
                  </div>
                  <p className="mt-5 text-center text-sm font-semibold" style={{ color: "var(--qr-ink)" }}>Point your camera to view our menu</p>
                  <p className="mt-1 text-center text-xs" style={{ color: "var(--qr-muted)" }}>No app. No waiting. Just the latest menu.</p>
                </div>

                <div className="mt-8 flex items-center justify-between border-t pt-4 text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--qr-muted)", borderColor: "var(--qr-border)" }}><span>Digital menu</span><span>Powered by QRServe</span></div>
              </div>
            </article>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button onClick={copy} disabled={!publicUrl} className="rounded-full bg-[#201d19] text-white hover:bg-[#3a342e]">{copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}{copied ? "Copied" : "Copy link"}</Button>
              <Button onClick={download} disabled={!image} variant="outline" className="rounded-full border-[#d7cfc3] bg-white"><Download className="mr-2 h-4 w-4" />Download QR file</Button>
              <Button onClick={() => window.print()} disabled={!image} variant="outline" className="rounded-full border-[#d7cfc3] bg-white"><Printer className="mr-2 h-4 w-4" />Print this card</Button>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
