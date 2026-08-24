import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { BarChart3, LayoutDashboard, LogOut, PanelLeft, QrCode, ShieldCheck, Store, UtensilsCrossed } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

type SidebarItem = {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  isActive: (location: string) => boolean;
};

export const baseMenuItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: "Service desk", path: "/app", isActive: location => location === "/app" },
  { icon: Store, label: "Client venues", path: "/app/restaurants", isActive: location => location === "/app/restaurants" },
  { icon: UtensilsCrossed, label: "Menu work", path: "/app/restaurants", isActive: location => location.startsWith("/app/menu/") },
  { icon: QrCode, label: "Table cards", path: "/app/restaurants", isActive: location => location.startsWith("/app/qr/") },
  { icon: BarChart3, label: "Service insights", path: "/app", isActive: () => false },
];

export function getSidebarActiveItem(items: SidebarItem[], location: string) {
  return items.find(item => item.isActive(location)) ?? items[0];
}

const SIDEBAR_WIDTH_KEY = "qrserve-sidebar-width";
const DEFAULT_WIDTH = 264;
const MIN_WIDTH = 210;
const MAX_WIDTH = 340;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => Number(localStorage.getItem(SIDEBAR_WIDTH_KEY)) || DEFAULT_WIDTH);
  const { loading, user } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString()), [sidebarWidth]);
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <div className="grid min-h-screen place-items-center bg-[#181716] px-5 text-[#f8f3ea]"><div className="max-w-sm text-center"><p className="eyebrow mb-4">QRServe service desk</p><h1 className="font-display text-4xl">Operator access only</h1><p className="mt-4 text-sm leading-6 text-[#c9c1b5]">Client venues, menu work, and table-card tools are protected.</p><Button onClick={() => setLocation("/sign-in")} className="mt-8 w-full rounded-full bg-[#ed5739] text-white hover:bg-[#d6472e]">Operator sign in</Button></div></div>;
  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent></SidebarProvider>;
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const menuItems = user?.role === "admin"
    ? [...baseMenuItems, { icon: ShieldCheck, label: "Owner activity", path: "/app/activity", isActive: (currentLocation: string) => currentLocation === "/app/activity" }]
    : baseMenuItems;
  const activeMenuItem = getSidebarActiveItem(menuItems, location);
  useEffect(() => { const move = (event: MouseEvent) => { if (!isResizing) return; const left = sidebarRef.current?.getBoundingClientRect().left ?? 0; const width = event.clientX - left; if (width >= MIN_WIDTH && width <= MAX_WIDTH) setSidebarWidth(width); }; const end = () => setIsResizing(false); if (isResizing) { document.addEventListener("mousemove", move); document.addEventListener("mouseup", end); document.body.style.cursor = "col-resize"; } return () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", end); document.body.style.cursor = ""; }; }, [isResizing, setSidebarWidth]);
  return <><div className="relative" ref={sidebarRef}><Sidebar collapsible="icon" className="border-r border-[#322f2b] bg-[#1d1b19] text-[#f5efe6]" disableTransition={isResizing}><SidebarHeader className="h-20 justify-center px-3"><div className="flex items-center gap-3"><button onClick={toggleSidebar} aria-label="Toggle navigation" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#c9c1b5] transition hover:bg-white/8 hover:text-white"><PanelLeft className="h-4 w-4" /></button>{!isCollapsed && <button onClick={() => setLocation("/app")} className="text-left"><span className="block font-display text-xl leading-none tracking-tight">QRServe</span><span className="mt-1 block text-[10px] uppercase tracking-[0.22em] text-[#b6a993]">local menu service</span></button>}</div></SidebarHeader><SidebarContent className="px-3 pt-4"><SidebarMenu className="gap-1">{menuItems.map(item => <SidebarMenuItem key={item.label}><SidebarMenuButton isActive={item.isActive(location)} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-11 rounded-xl text-[#c9c1b5] hover:bg-white/8 hover:text-white data-[active=true]:bg-[#f4ede3] data-[active=true]:text-[#201d19]"><item.icon className="h-4 w-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarContent><SidebarFooter className="p-3"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ed5739]"><Avatar className="h-9 w-9 border-0 bg-[#ed5739]"><AvatarFallback className="bg-[#ed5739] text-sm font-semibold text-white">{user?.name?.charAt(0).toUpperCase() ?? "O"}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-medium text-[#f5efe6]">{user?.name || "QRServe operator"}</p><p className="mt-0.5 truncate text-xs text-[#a79e91]">{user?.email || "Service desk"}</p></div></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={logout} className="text-destructive"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter></Sidebar><div className={`absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize transition hover:bg-[#ed5739]/50 ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => !isCollapsed && setIsResizing(true)} /></div><SidebarInset className="bg-[#f6f2eb]">{isMobile && <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#e4ddd2] bg-[#f6f2eb]/95 px-4 backdrop-blur"><div className="flex items-center gap-2"><SidebarTrigger className="rounded-xl" /><span className="font-display text-lg">{activeMenuItem.label}</span></div><span className="grid h-8 w-8 place-items-center rounded-full bg-[#ed5739] text-xs font-bold text-white">Q</span></header>}<main className="min-h-screen p-4 sm:p-6 lg:p-9">{children}</main></SidebarInset></>;
}
