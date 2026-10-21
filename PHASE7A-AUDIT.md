# Phase 7A baseline audit

Source inspected: React routes, contexts, public/admin pages and service adapters; Express routes, controllers, models, authentication, media helpers and order/inventory workflows. Existing media work is preserved. No deployment is authorized.

Initial checks: client lint reports 20 errors and 9 warnings. Client production build succeeds but warns about nonexistent fallback exports in Checkout and BookService. Server test script exits 1 with “Error: no test specified”.

Confirmed defects: Axios globally forces JSON on FormData; create/update description allows empty strings despite required Mongoose field; no primary-image ordering endpoint; legacy images cannot be removed in UI; featured products are fabricated; header has an empty telephone link and dead account control; mobile navigation has empty phone/WhatsApp links and lacks focus management; Services contains development copy; Shop retry reloads the whole page; no application error boundary. Async loaders and preview effects cause lint errors. Cloudinary errors may leak provider details in non-production responses. Cancellation stock restoration and order save are separate writes and are unsafe under concurrent requests or failure.

Existing contracts: product uploads use `images`, logo uses `image`; memory Multer limits each image to 5 MB, MIME types JPEG/PNG/WEBP, six product images. Product images are ordered subdocuments. Public settings explicitly project safe fields. Inventory changes use a separate protected endpoint; order creation atomically reserves each product and compensates on failure. Cancellation is terminal; delivered orders cannot be cancelled. CRM derives customers from orders/bookings. No customer authentication exists.

Live Cloudinary/MongoDB and browser verification remain pending; baseline checks do not prove them.

## Follow-up findings

- The configured database is standalone MongoDB. Transaction-based cancellation failed during isolated QA and was replaced with atomic, per-product restoration markers and retryable cancellation completion.
- Signed Cloudinary upload reached the provider but returned HTTP 403: `Request forbidden due to missing permissions (actions=["create"])`. This is independent of the original Axios/Multer defect. No uploaded live asset was created by those attempts.
- Browser regression QA uses real Express and an isolated MongoDB database, with Cloudinary transport explicitly simulated. It does not establish live Cloudinary success.
