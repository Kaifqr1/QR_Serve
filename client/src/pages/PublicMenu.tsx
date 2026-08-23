import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { addToGuestOrder, guestOrderItemCount, guestOrderStorageKey, guestOrderTotal, setGuestOrderQuantity, type GuestOrderItem, type OrderableDish } from "@/lib/guestOrder";
import { trpc } from "@/lib/trpc";
import { Check, MapPin, Minus, Plus, Search, ShoppingBag, Trash2, UtensilsCrossed } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useRoute } from "wouter";

const fallbackImages = ["/manus-storage/qrserve-menu-paneer_b1f548a1.jpg", "/manus-storage/qrserve-menu-tandoori_782fd2d0.jpg", "/manus-storage/qrserve-menu-biryani_8df97ed3.jpg"];
const formatPrice = (price: number) => `₹${price.toFixed(2).replace(/\.00$/, "")}`;

export default function PublicMenu() {
  const [, params] = useRoute("/menu/:slug");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [order, setOrder] = useState<GuestOrderItem[]>([]);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderLoaded, setOrderLoaded] = useState(false);
  const scanRecorded = useRef(false);
  const menu = trpc.public.menu.useQuery({ slug: params?.slug ?? "" }, { enabled: Boolean(params?.slug), retry: false });
  const trackScan = trpc.public.trackScan.useMutation();
  const orderCount = guestOrderItemCount(order);
  const orderTotal = guestOrderTotal(order);

  useEffect(() => {
    if (!params?.slug) return;
    try {
      const stored = localStorage.getItem(guestOrderStorageKey(params.slug));
      const parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) setOrder(parsed.filter(item => item && typeof item.id === "number" && typeof item.quantity === "number"));
    } catch {
      localStorage.removeItem(guestOrderStorageKey(params.slug));
    } finally {
      setOrderLoaded(true);
    }
  }, [params?.slug]);

  useEffect(() => {
    if (!params?.slug || !orderLoaded) return;
    localStorage.setItem(guestOrderStorageKey(params.slug), JSON.stringify(order));
  }, [order, orderLoaded, params?.slug]);

  useEffect(() => {
    if (params?.slug && new URLSearchParams(window.location.search).get("source") === "qr" && !scanRecorded.current) {
      scanRecorded.current = true;
      trackScan.mutate({ slug: params.slug });
    }
  }, [params?.slug, trackScan]);

  const categories = useMemo(() => (menu.data?.categories ?? [])
    .filter(category => activeCategory === "all" || category.id === Number(activeCategory))
    .map(category => ({ ...category, items: category.items.filter(item => `${item.name} ${item.description ?? ""}`.toLowerCase().includes(search.toLowerCase())) }))
    .filter(category => category.items.length > 0), [menu.data, activeCategory, search]);

  const addDish = (dish: OrderableDish) => {
    setOrder(current => addToGuestOrder(current, dish));
    toast.success(`${dish.name} added to your order list.`);
  };

  const setQuantity = (dishId: number, quantity: number) => setOrder(current => setGuestOrderQuantity(current, dishId, quantity));

  if (menu.isLoading) return <div className="min-h-screen bg-[#f6f2eb] px-5 py-12"><div className="mx-auto max-w-5xl animate-pulse"><div className="h-10 w-48 rounded bg-[#e6dfd6]" /><div className="mt-8 h-12 rounded bg-[#e6dfd6]" /><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-64 rounded-3xl bg-[#e6dfd6]" />)}</div></div></div>;
  if (menu.error || !menu.data) return <div className="grid min-h-screen place-items-center bg-[#f6f2eb] p-6 text-center"><div><UtensilsCrossed className="mx-auto h-8 w-8 text-[#a48e75]" /><h1 className="mt-5 font-display text-4xl text-[#201d19]">Menu not found.</h1><p className="mt-3 text-sm leading-6 text-[#70675d]">This menu may have moved or is no longer being served.</p></div></div>;

  const { restaurant } = menu.data;
  return <div className="min-h-screen bg-[#f6f2eb] pb-24 text-[#201d19] sm:pb-0">
    <header className="border-b border-[#e5ddd2] bg-[#fbf9f5]"><div className="mx-auto flex max-w-6xl items-start justify-between gap-5 px-5 py-10 sm:px-8"><div><p className="eyebrow text-[#8b7560]">Digital menu</p><h1 className="mt-3 font-display text-5xl tracking-[-0.05em] sm:text-6xl">{restaurant.name}</h1><div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#756b60]"><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#ed5739]" />{restaurant.location}</span>{restaurant.description && <><span className="hidden h-1 w-1 rounded-full bg-[#c9bdae] sm:inline" /><span>{restaurant.description}</span></>}</div></div><OrderButton count={orderCount} onClick={() => setOrderOpen(true)} className="hidden sm:inline-flex" /></div></header>
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8"><div className="sticky top-0 z-20 -mx-5 border-b border-[#e5ddd2] bg-[#f6f2eb]/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8"><div className="flex flex-col gap-3 md:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#948a7e]" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search the menu" className="h-10 rounded-xl border-[#dcd3c8] bg-white pl-10" /></div><div className="flex gap-2 overflow-x-auto pb-1">{[{ id: "all", name: "All" }, ...menu.data.categories].map(category => <button key={category.id} onClick={() => setActiveCategory(String(category.id))} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${activeCategory === String(category.id) ? "bg-[#201d19] text-white" : "border border-[#dcd3c8] bg-white text-[#61574c] hover:border-[#201d19]"}`}>{category.name}</button>)}</div></div></div>
      {categories.length === 0 ? <div className="grid min-h-72 place-items-center text-center"><div><Search className="mx-auto h-6 w-6 text-[#a48e75]" /><h2 className="mt-4 font-display text-3xl">No dishes matched that search.</h2><button onClick={() => { setSearch(""); setActiveCategory("all"); }} className="mt-3 text-sm font-semibold underline underline-offset-4">Clear filters</button></div></div> : <div className="pt-8">{categories.map(category => <section key={category.id} className="mb-12 last:mb-0"><div className="mb-5 flex items-end justify-between border-b border-[#ded5ca] pb-4"><div><p className="eyebrow text-[#8b7560]">Menu</p><h2 className="mt-2 font-display text-4xl">{category.name}</h2></div>{category.description && <p className="hidden max-w-xs text-right text-sm leading-5 text-[#786d61] sm:block">{category.description}</p>}</div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{category.items.map((item, index) => {
        const orderItem = order.find(orderEntry => orderEntry.id === item.id);
        const dish: OrderableDish = { id: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl };
        return <article key={item.id} className="flex overflow-hidden rounded-3xl border border-[#e2dad0] bg-[#fbf9f5] shadow-[0_8px_25px_rgba(57,42,26,0.04)]"><div className="flex min-w-0 flex-1 flex-col"><img src={item.imageUrl || fallbackImages[index % fallbackImages.length]} alt={item.name} className="h-44 w-full object-cover" /><div className="flex flex-1 flex-col p-5"><div className="flex items-start justify-between gap-4"><h3 className="font-display text-2xl leading-none">{item.name}</h3><span className="shrink-0 font-display text-xl">{formatPrice(item.price)}</span></div>{item.description && <p className="mt-3 text-sm leading-6 text-[#746b60]">{item.description}</p>}<div className="mt-5 flex items-center justify-between gap-3">{orderItem ? <QuantityControl item={orderItem} onChange={setQuantity} /> : <button onClick={() => addDish(dish)} className="inline-flex h-10 items-center rounded-xl bg-[#201d19] px-4 text-sm font-semibold text-white transition hover:bg-[#3a342e] active:scale-[0.97]"><Plus className="mr-1.5 h-4 w-4" />Add to order</button>}<span className="text-xs font-medium text-[#8a7d70]">Selection only</span></div></div></div></article>;
      })}</div></section>)}</div>}
    </main>
    <button onClick={() => setOrderOpen(true)} className="fixed inset-x-4 bottom-4 z-30 flex h-14 items-center justify-between rounded-2xl bg-[#201d19] px-5 text-white shadow-[0_14px_30px_rgba(32,29,25,0.25)] sm:hidden"><span className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" />Your order {orderCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#ed5739] px-1 text-[11px] font-bold">{orderCount}</span>}</span><span className="text-sm font-semibold">{orderCount ? formatPrice(orderTotal) : "View"}</span></button>
    <OrderSheet open={orderOpen} onOpenChange={setOrderOpen} order={order} total={orderTotal} onQuantityChange={setQuantity} onClear={() => setOrder([])} />
    <footer className="mt-12 border-t border-[#e5ddd2] px-5 py-8 text-center text-xs text-[#8b8176]">Powered by QRServe</footer>
  </div>;
}

function OrderButton({ count, onClick, className = "" }: { count: number; onClick: () => void; className?: string }) {
  return <button onClick={onClick} className={`h-10 items-center gap-2 rounded-full border border-[#d8cec2] bg-white px-4 text-sm font-semibold text-[#312a23] transition hover:border-[#201d19] ${className}`}><ShoppingBag className="h-4 w-4" />Your order {count > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#ed5739] px-1 text-[11px] text-white">{count}</span>}</button>;
}

function QuantityControl({ item, onChange }: { item: GuestOrderItem; onChange: (dishId: number, quantity: number) => void }) {
  return <div className="inline-flex h-10 items-center rounded-xl border border-[#d6cbbf] bg-white p-1"><button aria-label={`Remove one ${item.name}`} onClick={() => onChange(item.id, item.quantity - 1)} className="grid h-8 w-8 place-items-center rounded-lg text-[#65594e] transition hover:bg-[#f1ebe3]"><Minus className="h-4 w-4" /></button><span className="min-w-8 text-center text-sm font-bold">{item.quantity}</span><button aria-label={`Add another ${item.name}`} onClick={() => onChange(item.id, item.quantity + 1)} className="grid h-8 w-8 place-items-center rounded-lg bg-[#201d19] text-white transition hover:bg-[#3a342e]"><Plus className="h-4 w-4" /></button></div>;
}

function OrderSheet({ open, onOpenChange, order, total, onQuantityChange, onClear }: { open: boolean; onOpenChange: (open: boolean) => void; order: GuestOrderItem[]; total: number; onQuantityChange: (dishId: number, quantity: number) => void; onClear: () => void }) {
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="right" className="w-full border-[#e2dad0] bg-[#fbf9f5] p-0 sm:max-w-md"><SheetHeader className="border-b border-[#e4dbd1] px-6 py-6 pr-12"><SheetTitle className="font-display text-3xl text-[#201d19]">Your order list</SheetTitle><SheetDescription className="leading-5 text-[#746b60]">Keep track of the dishes you want. This list stays on this device and does not send an order to the restaurant.</SheetDescription></SheetHeader>{order.length === 0 ? <div className="grid flex-1 place-items-center px-8 text-center"><div><ShoppingBag className="mx-auto h-9 w-9 text-[#b59b83]" /><h3 className="mt-4 font-display text-3xl text-[#201d19]">Nothing selected yet.</h3><p className="mt-2 text-sm leading-6 text-[#756a5e]">Add dishes as you browse the menu, then return here to review your list.</p></div></div> : <div className="flex-1 overflow-auto px-6 py-3">{order.map(item => <div key={item.id} className="flex items-center gap-3 border-b border-[#e6ddd3] py-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#efe8df] font-display text-lg text-[#665647]">{item.name.slice(0, 1)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#28211c]">{item.name}</p><p className="mt-0.5 text-sm text-[#756a5e]">{formatPrice(item.price)} each</p></div><QuantityControl item={item} onChange={onQuantityChange} /></div>)}</div>}<SheetFooter className="border-t border-[#e4dbd1] bg-[#f6f1e9] p-6"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-[#6b5f53]">Estimated total</span><span className="font-display text-3xl text-[#201d19]">{formatPrice(total)}</span></div>{order.length > 0 && <button onClick={onClear} className="mt-1 inline-flex items-center self-start text-sm font-semibold text-[#8a5543] transition hover:text-[#602f20]"><Trash2 className="mr-1.5 h-4 w-4" />Clear my list</button>}<p className="mt-2 flex gap-2 text-xs leading-5 text-[#806f5d]"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2e6b57]" />Your choices are saved privately in this browser.</p></SheetFooter></SheetContent></Sheet>;
}
