import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { scrollReveal } from "@/lib/scrollReveal";
import { ArrowRight, Check, QrCode, ScanLine, Sparkles, UtensilsCrossed } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocation } from "wouter";

const heroImage = "/manus-storage/qrserve-hero-ambient-qr_75e8c393.jpg";

const serviceSteps = [
  { number: "01", title: "Shape your menu", copy: "Add categories, dishes, prices and vibrant food photography from a single workspace.", icon: UtensilsCrossed },
  { number: "02", title: "Publish a table-ready link", copy: "Every restaurant receives a unique, responsive public menu destination.", icon: QrCode },
  { number: "03", title: "Make every scan count", copy: "Guests read the latest menu instantly while your workspace tracks menu views.", icon: ScanLine },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const reducedMotion = useReducedMotion();
  const enterWorkspace = () => isAuthenticated ? setLocation("/app") : startLogin();
  const reveal = (delay = 0, offset = 24) => scrollReveal(Boolean(reducedMotion), delay, offset);

  return <div className="min-h-screen overflow-x-hidden bg-[#181716] text-[#f8f3ea]">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
      <button onClick={() => setLocation("/")} className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#ed5739] text-sm font-bold">Q</span>
        <span className="font-display text-2xl tracking-tight">QRServe</span>
      </button>
      <div className="hidden items-center gap-7 text-sm text-[#c9c1b5] md:flex">
        <a href="#how-it-works" className="transition hover:text-white">How it works</a>
        <a href="#built-for-service" className="transition hover:text-white">For restaurants</a>
      </div>
      <Button onClick={enterWorkspace} className="rounded-full bg-[#f4ede3] px-5 text-[#201d19] hover:bg-white">{isAuthenticated ? "Open workspace" : "Sign in"}</Button>
    </header>

    <main>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-10 lg:pb-28 lg:pt-20">
        <motion.div {...reveal()} className="relative z-10 flex flex-col justify-center">
          <div className="eyebrow mb-6 w-fit border-[#554c43] text-[#d8ccbb]"><Sparkles className="mr-2 h-3.5 w-3.5 text-[#ed5739]" />Service, made searchable</div>
          <h1 className="font-display max-w-2xl text-5xl leading-[0.93] tracking-[-0.055em] sm:text-6xl lg:text-8xl">Your restaurant QR menu is<br/><em className="text-[#ed5739]">already at</em><br/>their table.</h1>
          <p className="mt-7 max-w-md text-base leading-7 text-[#c9c1b5] sm:text-lg">Use our digital menu generator to publish a live contactless dining QR code and serve every guest the latest version with a single scan.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button onClick={enterWorkspace} size="lg" className="group h-13 rounded-full bg-[#ed5739] px-7 text-base text-white hover:bg-[#d94830]">Build your menu <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Button>
            <a href="#how-it-works" className="inline-flex h-13 items-center justify-center rounded-full border border-[#554c43] px-7 text-sm font-medium text-[#f8f3ea] transition hover:border-[#f8f3ea]">See the system</a>
          </div>
          <div className="mt-12 flex items-center gap-6 text-sm text-[#b8afa4]">
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ed5739]" />Live menu updates</span>
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ed5739]" />No guest app</span>
          </div>
        </motion.div>

        <motion.div {...reveal(0.12, 18)} className="relative min-h-[430px] overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#292520] shadow-[0_30px_90px_rgba(0,0,0,0.32)] sm:min-h-[540px]">
          <img src={heroImage} alt="A glowing, sculptural QR-inspired menu tile in a warmly lit restaurant" className="absolute inset-0 h-full w-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(17,15,13,0.82)_0%,rgba(17,15,13,0.1)_48%,rgba(17,15,13,0.48)_100%)]" />
          <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#191613]/55 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#e6d9c7] backdrop-blur-md"><span className="h-1.5 w-1.5 rounded-full bg-[#ed5739] shadow-[0_0_12px_#ed5739]" />Made for the moment</div>
          <div className="absolute bottom-6 left-6 right-6 grid grid-cols-[auto_1fr] gap-4 rounded-2xl border border-white/15 bg-[#1d1a17]/75 p-4 backdrop-blur-md"><div className="grid h-14 w-14 place-items-center rounded-xl bg-[#ed5739] text-white shadow-[0_0_30px_rgba(237,87,57,0.28)]"><ScanLine className="h-7 w-7" /></div><div><p className="text-xs uppercase tracking-[0.2em] text-[#c9c1b5]">From scan to service</p><p className="mt-1 font-display text-2xl">A better table begins with one small gesture.</p></div></div>
        </motion.div>
      </section>

      <section id="how-it-works" className="border-y border-[#322e29] bg-[#211f1c] py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <motion.div {...reveal()} className="max-w-xl"><p className="eyebrow text-[#d8ccbb]">A clear three-step service flow</p><h2 className="mt-4 font-display text-4xl tracking-[-0.04em] sm:text-5xl">Digital menu generator software that keeps your restaurant QR menu current.</h2></motion.div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[1.75rem] border border-[#443d36] bg-[#443d36] md:grid-cols-3">
            {serviceSteps.map((step, index) => <motion.div {...reveal(index * 0.08)} key={step.number} className="min-h-72 bg-[#211f1c] p-7 sm:p-9"><div className="flex items-start justify-between"><span className="font-display text-3xl text-[#ed5739]">{step.number}</span><step.icon className="h-5 w-5 text-[#c9c1b5]" /></div><h3 className="mt-12 font-display text-3xl">{step.title}</h3><p className="mt-4 max-w-xs text-sm leading-6 text-[#bdb4a8]">{step.copy}</p></motion.div>)}
          </div>
        </div>
      </section>

      <section id="built-for-service" className="bg-[#f6f2eb] py-20 text-[#201d19]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:px-10">
          <motion.div {...reveal()}><p className="eyebrow border-[#d8d0c5] text-[#7c6a58]">Built for the rhythm of service</p><h2 className="mt-4 font-display text-5xl leading-[0.96] tracking-[-0.05em]">Contactless dining QR code tools, built for service.</h2></motion.div>
          <div className="grid gap-5 sm:grid-cols-2">
            <motion.div {...reveal(0.04)} className="rounded-3xl bg-white p-7 shadow-[0_12px_38px_rgba(45,35,25,0.08)]"><p className="text-sm font-semibold">A guest-first public menu</p><p className="mt-3 text-sm leading-6 text-[#6d655c]">Quick to load, mobile-first, and designed with sensible search and category filters.</p></motion.div>
            <motion.div {...reveal(0.1)} className="rounded-3xl bg-[#e4d8c8] p-7"><p className="text-sm font-semibold">One source of truth</p><p className="mt-3 text-sm leading-6 text-[#62574d]">Change availability or a price in the dashboard. The public menu reflects it straight away.</p></motion.div>
            <motion.div {...reveal(0.16)} className="rounded-3xl bg-[#201d19] p-7 text-[#f8f3ea] sm:col-span-2"><div className="flex flex-wrap items-center justify-between gap-5"><div><p className="font-display text-3xl">Your next menu, ready to serve.</p><p className="mt-2 text-sm text-[#c9c1b5]">Create the restaurant, build the menu, and use the QR studio.</p></div><Button onClick={enterWorkspace} className="rounded-full bg-[#ed5739] text-white hover:bg-[#d94830]">Get started <ArrowRight className="ml-2 h-4 w-4" /></Button></div></motion.div>
          </div>
        </div>
      </section>
    </main>
    <footer className="border-t border-[#322e29] px-5 py-8 text-center text-xs text-[#a79e91]">QRServe · A focused digital menu system for independent restaurants.</footer>
  </div>;
}
