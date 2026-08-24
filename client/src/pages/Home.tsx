import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { scrollReveal } from "@/lib/scrollReveal";
import {
  ArrowRight,
  Check,
  Mail,
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

const setupEnquiryUrl =
  "mailto:Kaif.qr1@gmail.com?subject=QRServe%20venue%20setup%20enquiry&body=Hello%20QRServe%2C%0A%0AI%20would%20like%20to%20discuss%20a%20digital%20menu%20and%20QR%20table-card%20setup%20for%20my%20venue.%0A%0AVenue%20name%3A%0ALocation%3A%0AType%20of%20venue%3A%0A";

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

export const faqItems = [
  {
    question: "What does QRServe set up at my venue?",
    answer:
      "We turn your existing menu into a guest-friendly digital menu, organise dishes and prices, prepare your QR table cards, and help make sure the final scan feels right for your venue.",
  },
  {
    question: "Can I update prices, dishes, or availability later?",
    answer:
      "Yes. Send the change to your QRServe contact and we will keep the live menu current—whether it is a new dish, a revised price, a better food photo, or an item that is temporarily unavailable.",
  },
  {
    question: "Do my guests need to download an app?",
    answer:
      "No. Guests scan the table QR code with their phone camera and open the menu directly in their browser. There is nothing to install and no guest account is required.",
  },
  {
    question: "Will you also create the QR cards for my tables?",
    answer:
      "Yes. QRServe prepares a clean table-card design linked to your live menu, ready to print and place at your tables, counter, or takeaway window.",
  },
  {
    question: "Can you work from my current paper or PDF menu?",
    answer:
      "Absolutely. Bring your current menu, price list, or PDF. We organise it into a clearer mobile experience and can help identify the information or photography that will make it easier for guests to choose.",
  },
  {
    question: "How do I get started?",
    answer:
      "Start with a venue visit or menu review. We will understand your current setup, prepare the digital menu and QR cards, then make the final guest experience ready to scan.",
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
          <a href="#questions" className="transition hover:text-white">
            Questions
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
              QRServe is a hands-on local restaurant QR menu service for cafés
              and restaurants. We visit your venue, build the digital menu,
              print the QR cards, and keep everything current.
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
                  <a
                    href={setupEnquiryUrl}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-[#ed5739] px-5 text-sm font-semibold text-white transition hover:bg-[#d94830] active:scale-[0.97]"
                  >
                    Plan setup by email <Mail className="ml-2 h-4 w-4" />
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="questions" className="bg-[#e9ded0] py-20 text-[#201d19] sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.76fr_1.24fr] lg:px-10">
            <motion.div {...reveal()} className="lg:pr-12">
              <p className="eyebrow border-[#cbbbaa] text-[#7c6a58]">
                Clear answers, before we begin
              </p>
              <h2 className="mt-4 font-display text-5xl leading-[0.96] tracking-[-0.05em] sm:text-6xl">
                The practical details, handled.
              </h2>
              <p className="mt-6 max-w-md text-base leading-7 text-[#62574d]">
                QRServe is a local service, so you should always know what is
                included, how updates work, and what your guests will experience
                after they scan.
              </p>
              <button
                onClick={() => setLocation("/demo")}
                className="mt-8 inline-flex items-center font-semibold text-[#201d19] underline decoration-[#ed5739] decoration-2 underline-offset-4 transition hover:text-[#ed5739]"
              >
                Explore the guest demo <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </motion.div>

            <motion.div
              {...reveal(0.08)}
              className="rounded-[2rem] border border-[#cbbbaa] bg-[#f8f3ea] p-2 shadow-[0_24px_65px_rgba(65,44,29,0.12)] sm:p-3"
            >
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem
                    key={item.question}
                    value={`faq-${index + 1}`}
                    className="border-[#ded4c8] px-4 sm:px-6"
                  >
                    <AccordionTrigger className="py-6 font-display text-xl leading-tight tracking-[-0.02em] text-[#201d19] no-underline hover:no-underline sm:text-2xl">
                      <span className="pr-4">{item.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="max-w-2xl pb-6 text-sm leading-7 text-[#6d655c] sm:text-base">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#322e29] px-5 py-8 text-center text-xs text-[#a79e91]">
        <p>
          QRServe · Local digital-menu setup and maintenance for cafés and
          restaurants.
        </p>
        <a
          href={setupEnquiryUrl}
          className="mt-2 inline-flex items-center gap-1.5 font-semibold text-[#d8ccbb] transition hover:text-white"
        >
          <Mail className="h-3.5 w-3.5" />
          Kaif.qr1@gmail.com
        </a>
      </footer>
    </div>
  );
}
