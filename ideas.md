# QRServe Product Direction

## Product Positioning

QRServe will be built as a focused SaaS for independent restaurant operators: a calm, capable workspace for publishing a faster, better-looking digital menu through a QR code. The experience should feel like a polished operational tool rather than an academic project.

## Visual Direction — “Warm Service, Precise System”

The visual language pairs an **ink-black / espresso interface** with warm parchment surfaces and a restrained paprika-red accent. It echoes a well-run restaurant: composed, tactile, and fast. The display type will be a high-contrast editorial serif for restaurant-facing moments, balanced by a clean geometric sans serif for the product controls.

## Information Architecture

The application will provide a public landing page, a secured operator workspace, and a mobile-first public menu route. The workspace will use a compact navigation rail on desktop and a streamlined mobile header. The public menu will intentionally avoid dashboard chrome so a diner sees a light, direct menu immediately after scanning.

## Key Interaction Principles

Primary actions will be explicit and functional: create restaurant, add category, add menu item, publish a QR URL, search the public menu, and copy or print the QR code. Empty states will guide first-time owners into the real create flow; no UI control will imply an unavailable workflow.

## Platform Decisions

The supplied brief requests a PostgreSQL, JWT, and Cloudinary stack. The initialized managed application provides first-class MySQL, secure OAuth session cookies, typed RPC, and S3-backed storage instead. The MVP will use the managed capabilities so authentication, data persistence, and uploads work in this environment while preserving the brief’s core security, ownership, validation, and image-storage goals.

## Scope for This Delivery

The implementation will cover the core owner journey: sign in, create and manage restaurants, create categories and menu items, enable/disable availability, publish a public menu, generate and copy a QR destination URL, view lightweight per-restaurant metrics, and use responsive dashboard/public menu views. Subscription payment processing, drag-and-drop ordering, and third-party Cloudinary configuration remain deliberately outside this MVP.
