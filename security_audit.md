# QRServe Hardening Audit

## Scope and Findings

The current implementation was assessed against the functional and security requirements contained in the supplied QRServe specification. The review prioritized authorization, validation, data exposure, transport security, upload safety, request abuse controls, dependency posture, and the core restaurant-to-public-menu user journey.

| Area | Status after hardening | Implementation and verification |
| --- | --- | --- |
| Authentication and session handling | Implemented by the managed OAuth session layer | Protected procedures require an authenticated user. Session cookies are httpOnly and OAuth state uses a one-time nonce. |
| Authorization and ownership | Hardened | Restaurant, category, and menu mutations verify ownership; cross-restaurant category moves are now rejected. Router tests cover forbidden ownership and invalid relationships. |
| Input validation | Hardened | Server-side Zod schemas validate restaurant and menu data, safe image names, integer identifiers, prices, and image MIME declarations. |
| Upload safety | Hardened | Images are limited to 5 MB, restricted to JPEG/PNG/WebP, and validated against file signatures before reaching storage. |
| HTTP security | Hardened | Security headers, HTTPS upgrade policy in production, referrer policy, same-origin plus configured CORS allowlisting, disabled `X-Powered-By`, bounded request bodies, and safe JSON parse/size-limit errors are configured centrally. |
| Abuse controls | Hardened | API and OAuth callback routes are rate-limited; the authentication route uses a materially tighter policy. |
| Public data exposure | Hardened | The public menu response now returns only guest-facing restaurant, category, and available item fields. Owner identity, plan, timestamps, and internal data remain private. |
| QR analytics | Implemented | QR-generated links carry a source marker; the public route records a QR scan event once per page load and the dashboard summary returns scan totals. |
| Dependency posture | Improved and checked | Direct audit findings were remediated through package upgrades and removal of the unused markdown renderer. A final production audit is run before delivery. |

## Deliberately Out of Scope

The managed platform provides secure OAuth sessions instead of the original brief’s self-managed email/password, JWT, bcrypt, and Cloudinary stack. The product therefore uses the platform’s session cookies and S3-backed storage rather than reimplementing a separate credential system. Subscription payment processing and multi-user restaurant teams are not present because payment and team-management requirements need additional product decisions.

## Verification Standard

The completion check includes strict TypeScript validation, targeted server/security tests, a production build, production dependency audit, security header inspection, and CORS rejection behavior. The application is not represented as a substitute for an independent penetration test or an externally managed security-compliance certification.
