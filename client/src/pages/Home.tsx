import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { scrollReveal } from "@/lib/scrollReveal";
import {
  ArrowRight,
  Check,
  MapPin,
  QrCode,
  ScanLine,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";

const heroImage =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=88";

export const serviceSteps = [
  {
    number: "01",
    title: "Visit & understand",
    copy: "We review the menu, capture the details, and shape a guest-friendly digital version for your venue.",
    icon: MapPin,
  },
  {
    number: "02",
    title: "Build & publish",
    copy: "We organise dishes, prices, availability, and food photography into a polished mobile menu.",
    icon: UtensilsCrossed,
  },
  {
    number: "03",
    title: "Print & keep current",
    copy: "We prepare QR table cards and handle menu updates when your service changes.",
    icon: QrCode,
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const reducedMotion = useReducedMotion();
  const [heroImageFailed, setHeroImageFailed] = useState(false);
  const openServiceDesk = () =>
    setLocation(isAuthenticated ? "/app" : "/sign-in");
  const reveal = (delay = 0, offset = 24) =>
    scrollReveal(Boolean(reducedMotion), delay, offset);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#181716] text-[#f8f3ea]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-3"
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#ed5739] text-sm font-bold">
            Q
          </span>
          <span className="font-display text-2xl tracking-tight">QRServe</span>
        </button>
        <div className="hidden items-center gap-7 text-sm text-[#c9c1b5] md:flex">
          <a href="#how-it-works" className="transition hover:text-white">
            Our service
          </a>
          <a href="#built-for-service" className="transition hover:text-white">
            For local venues
          </a>
          <button
            onClick={() => setLocation("/demo")}
            className="transition hover:text-white"
          >
            View guest demo
          </button>
        </div>
        <Button
          onClick={openServiceDesk}
          className="rounded-full bg-[#f4ede3] px-5 text-[#201d19] hover:bg-white"
        >
          {isAuthenticated ? "Open service desk" : "Operator sign in"}
        </Button>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-10 lg:pb-28 lg:pt-20">
          <motion.div
            {...reveal()}
            className="relative z-10 flex flex-col justify-center"
          >
            <div className="eyebrow mb-6 w-fit border-[#554c43] text-[#d8ccbb]">
              <Sparkles className="mr-2 h-3.5 w-3.5 text-[#ed5739]" />
              Local setup. Real service.
            </div>
            <h1 className="font-display max-w-2xl text-5xl leading-[0.93] tracking-[-0.055em] sm:text-6xl lg:text-8xl">
              Your digital menu,
              <br />
              <em className="text-[#ed5739]">set up properly</em>
              <br />
              for every table.
            </h1>
            <p className="mt-7 max-w-md text-base leading-7 text-[#c9c1b5] sm:text-lg">
              QRServe is a hands-on local service for cafés and restaurants. We
              visit your venue, build the menu, print the QR cards, and keep
              everything current.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#how-it-works"
                className="group inline-flex h-13 items-center justify-center rounded-full bg-[#ed5739] px-7 text-base font-medium text-white transition hover:bg-[#d94830]"
              >
                See how the service works{" "}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <Button
                onClick={openServiceDesk}
                variant="outline"
                className="h-13 rounded-full border-[#554c43] bg-transparent px-7 text-sm text-[#f8f3ea] hover:border-[#f8f3ea] hover:bg-transparent"
              >
                Operator sign in
              </Button>
            </div>
            <div className="mt-12 flex flex-wrap items-center gap-6 text-sm text-[#b8afa4]">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#ed5739]" />
                Local venue setup
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#ed5739]" />
                Menus kept current
              </span>
              <button
                onClick={() => setLocation("/demo")}
                className="font-semibold text-[#f8f3ea] underline decoration-[#ed5739] decoration-2 underline-offset-4 transition hover:text-white"
              >
                Open the guest demo
              </button>
            </div>
          </motion.div>

          <motion.div
            {...reveal(0.12, 18)}
            className="relative min-h-[430px] overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#292520] shadow-[0_30px_90px_rgba(0,0,0,0.32)] sm:min-h-[540px]"
          >
            {!heroImageFailed ? (
              <img
                src={heroImage}
                alt="Warmly lit restaurant interior ready for a digital menu scan"
                onError={() => setHeroImageFailed(true)}
                className="absolute inset-0 h-full w-full object-cover opacity-90"
              />
            ) : (
              <div
                aria-hidden="true"
                className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_72%_28%,rgba(237,87,57,0.7),transparent_14%),radial-gradient(circle_at_28%_76%,rgba(141,74,40,0.42),transparent_30%),linear-gradient(145deg,#30241f_0%,#131110_66%,#211916_100%)]"
              >
                <div className="absolute right-[19%] top-[18%] h-48 w-48 rotate-12 rounded-[2rem] border border-[#f67557]/60 bg-[#481e17]/80 shadow-[0_0_70px_rgba(237,87,57,0.42)]">
                  <div className="absolute inset-6 grid grid-cols-5 gap-1.5 opacity-85">
                    {Array.from({ length: 25 }, (_, index) => (
                      <span
                        key={index}
                        className={`rounded-[2px] ${[0, 1, 5, 6, 18, 19, 23, 24, 12, 14, 16].includes(index) ? "bg-[#f5d8c7]" : "bg-[#a53728]"}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="absolute -right-16 bottom-0 h-64 w-72 rounded-t-[6rem] bg-[#0d0c0b]/70 blur-xl" />
              </div>
            )}
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(17,15,13,0.82)_0%,rgba(17,15,13,0.1)_48%,rgba(17,15,13,0.48)_100%)]" />
            <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#191613]/55 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#e6d9c7] backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ed5739] shadow-[0_0_12px_#ed5739]" />
              Built for local tables
            </div>
            <div className="absolute bottom-6 left-6 right-6 grid grid-cols-[auto_1fr] gap-4 rounded-2xl border border-white/15 bg-[#1d1a17]/75 p-4 backdrop-blur-md">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-[#ed5739] text-white shadow-[0_0_30px_rgba(237,87,57,0.28)]">
                <ScanLine className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#c9c1b5]">
                  From venue visit to table
                </p>
                <p className="mt-1 font-display text-2xl">
                  A better table begins with one simple scan.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        <section
          id="how-it-works"
          className="border-y border-[#322e29] bg-[#211f1c] py-20"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <motion.div {...reveal()} className="max-w-2xl">
              <p className="eyebrow text-[#d8ccbb]">
                A practical local service
              </p>
              <h2 className="mt-4 font-display text-4xl tracking-[-0.04em] sm:text-5xl">
                We handle the digital menu work, so you can focus on serving
                your guests.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#c9c1b5]">
                There is no complicated customer portal to learn. QRServe is the
                service behind your digital menu—from the first menu review to
                the printed code on the table.
              </p>
            </motion.div>
            <div className="mt-12 grid gap-px overflow-hidden rounded-[1.75rem] border border-[#443d36] bg-[#443d36] md:grid-cols-3">
              {serviceSteps.map((step, index) => (
                <motion.div
                  {...reveal(index * 0.08)}
                  key={step.number}
                  className="min-h-72 bg-[#211f1c] p-7 sm:p-9"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-display text-3xl text-[#ed5739]">
                      {step.number}
                    </span>
                    <step.icon className="h-5 w-5 text-[#c9c1b5]" />
                  </div>
                  <h3 className="mt-12 font-display text-3xl">{step.title}</h3>
                  <p className="mt-4 max-w-xs text-sm leading-6 text-[#bdb4a8]">
                    {step.copy}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="built-for-service"
          className="bg-[#f6f2eb] py-20 text-[#201d19]"
        >
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:px-10">
            <motion.div {...reveal()}>
              <p className="eyebrow border-[#d8d0c5] text-[#7c6a58]">
                For the venues around you
              </p>
              <h2 className="mt-4 font-display text-5xl leading-[0.96] tracking-[-0.05em]">
                A polished menu service for cafés, restaurants, bakeries, and
                bars.
              </h2>
            </motion.div>
            <div className="grid gap-5 sm:grid-cols-2">
              <motion.div
                {...reveal(0.04)}
                className="rounded-3xl bg-white p-7 shadow-[0_12px_38px_rgba(45,35,25,0.08)]"
              >
                <p className="text-sm font-semibold">Set up at your venue</p>
                <p className="mt-3 text-sm leading-6 text-[#6d655c]">
                  We work with your existing menu, venue style, and service flow
                  to make the guest experience feel considered.
                </p>
              </motion.div>
              <motion.div
                {...reveal(0.1)}
                className="rounded-3xl bg-[#e4d8c8] p-7"
              >
                <p className="text-sm font-semibold">One person to call</p>
                <p className="mt-3 text-sm leading-6 text-[#62574d]">
                  Need a price, dish, photo, or availability updated? Your QR
                  menu is managed from one local service desk.
                </p>
              </motion.div>
              <motion.div
                {...reveal(0.16)}
                className="rounded-3xl bg-[#201d19] p-7 text-[#f8f3ea] sm:col-span-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-5">
                  <div>
                    <p className="font-display text-3xl">
                      Built for your next venue visit.
                    </p>
                    <p className="mt-2 text-sm text-[#c9c1b5]">
                      Prepare the menu, create the table card, and deliver a
                      guest-ready scan.
                    </p>
                  </div>
                  <Button
                    onClick={openServiceDesk}
                    className="rounded-full bg-[#ed5739] text-white hover:bg-[#d94830]"
                  >
                    Open service desk <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#322e29] px-5 py-8 text-center text-xs text-[#a79e91]">
        QRServe · Local digital-menu setup and maintenance for cafés and
        restaurants.
      </footer>
    </div>
  );
}
