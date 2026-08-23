# Venue-Owner Access Verification Notes

The local `/sign-in` screen now provides both the existing QRServe sign-in flow and a dedicated **Create venue-owner account** mode. The registration mode presents name, email, and password fields; it explains that only `@rastaurant.com` and `@cafe.com` addresses are accepted; and it states that each venue owner can update only the menus they create.

Server-side tests enforce the exact allowlist, reject unapproved registration before database access, create an approved owner with the `user` role, issue an HTTPS-only httpOnly session, and retain existing restaurant ownership checks that return no cross-tenant restaurant data.
