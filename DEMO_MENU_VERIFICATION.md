# QRServe Demo Menu Verification Notes

The new `/demo` route renders a clearly labelled **The Marigold Table** showcase venue without a database query, customer data, or scan analytics. Desktop verification confirmed the header, demo notice, filter controls, menu sections, nine dishes, and guest-order actions are present.

At a 390 × 844 mobile viewport, the demo menu remains single-column and readable. The category controls stay horizontally accessible, each dish card retains its price and add-to-order control, and the existing mobile order bar remains available as visitors scroll.

Reduced-motion behavior is deterministic: the `GuestMenu` component calls QRServe’s shared `scrollReveal(Boolean(reducedMotion), delay, offset)` helper for its menu sections and dish cards, while the helper’s focused unit test confirms it returns no animation props when reduced motion is requested. The expanded demo-menu regression test verifies this page-level wiring.

A UI-level render test now loads the actual `GuestMenu` component with reduced motion enabled and verifies every motion wrapper receives no initial animation props. The final local suite contains 41 passing tests, including that component test, followed by a successful TypeScript check and production build.

Public deployment verification confirmed that `https://qr-serve-three.vercel.app/demo` serves **The Marigold Table** with its complete category filters, guest order controls, and direct image URLs. The former preview-only image paths were replaced after they failed on Vercel; the live demo now uses production-safe, verified Unsplash image delivery.
