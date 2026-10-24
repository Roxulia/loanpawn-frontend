# Ownership frontend integration (OWN-31)

OWN-29 was marked accepted at the user's request. The user then limited implementation to frontend work, allowing server additions only for missing API capabilities. All required reads and receipt linking are available in the current APIs; no server API, route or business caller was changed. OWN-30 remains deferred. This does not complete broader Purchasing, Sales or Pawn workflows or convert legacy receipt-sourced acquisitions into paid purchase-source lots.

## Implemented behavior

- The existing register/detail composition now uses typed paginated item, lot, movement, receipt and piece responses. Costs and quantities remain strings; no mixed-currency total or float quantity conversion is introduced.
- Search, tracking and all/current/depleted filters reset register paging. Selecting a record fetches fresh detail independently of the list snapshot. Resource keys and effect cleanup discard superseded responses, errors and completion. Each child page has separate state and bounded reads; history remains accessible for depleted holdings.
- Detail distinguishes owned, reserved, pledged, available ownership, physical stock, received backing, awaiting receipt and received-but-unlinked quantities. Availability is explicitly not a claim that stock is sellable.
- Users with manage_owned_item can choose eligible purchase-source lots, page receipts, and select exact eligible serialized pieces across pages. Changing receipt clears previous identities. Quantity writes use exact thousandths and serialized counts, checked against receipt capacity and the server storage limit before submission; the server remains authoritative.
- Existing idempotencyKeyForPayload retains the key for unchanged retries, including after a transport failure. The item/lot, version and exact payload form the fingerprint. Submission uses a synchronous duplicate-click guard. A 409 blocks resubmission until the user explicitly reloads and reviews current data. A successful link clears selection and refreshes register/detail/lots/history; it never creates another acquisition.
- Photos reuse InventoryItemImage, full-size signed links and the bundled default illustration. Expired or invalid expiration timestamps remove links; failed images use the existing fallback. Fresh detail/refresh obtains renewed URLs. No image upload or storage path UI was added.
- English/Myanmar labels and feedback are connected through the existing locale dictionary. Desktop and mobile filters use separate classes and field IDs; shared DataTable already renders separate tables/cards. Detail, balances, photo, linking and piece sections have corresponding responsive classes.
- Existing Ownership/Inventory feature gates and list permission remain. Manual acquisition and expired-collateral forms no longer mount from navigation or direct URLs; those deferred URLs redirect to the protected register. No public sale/pledge/return or trusted-source input was added.

## Code structure and bounds

OwnedItemsPage coordinates the register. Small components separately handle filters, fresh detail, balances, photos, lots, movements, receipt linking, pieces and read failures. useOwnershipRead centralizes stale-response protection; existing HTTP, DataTable, image and idempotency helpers are reused.

Register pages contain 25 items; lots, history and receipts contain 10 rows; piece pages contain 25 rows. Display work and loaded page data are linear in the current page. Selected piece memory is linear in the explicit selection across pages; constructing the stable payload sorts those codes in O(S log S) time with O(S) copied references. Exact arithmetic uses bounded decimal strings/BigInt, not float rounding. No unbounded register/history/receipt download was introduced.

## Verification

- `npm run test:ownership`: **10 tests passed**. Node's built-in test runner evaluates the shipped TypeScript modules; only the HTTP transport boundary is replaced. Checks cover exact values and limits, rejected quantities, capacity, UNIQUE rules, cross-page piece payloads, duplicate pieces, required source/version, stable/changed retry keys, actual endpoint paths and encoded references, pagination/filter options, and unchanged decimal/key transport.
- `npm run build`: **passed**, including `tsc -b` and the production Vite/PWA build.
- Targeted ESLint for `src/modules/ownership`, `src/app/routes/router.tsx` and `src/components/navigation/Sidebar.tsx`: **passed**.
- Adding `src/locales/UiLocale.tsx` reports five `react-refresh/only-export-components` errors. Running ESLint on that file from HEAD reproduces the same five errors. No unrelated locale refactor or rule suppression was introduced.
- Whitespace checks passed. Existing build notices about bundle size, Browserslist data age and plugin timing remain; no unrelated dependency or bundle work was performed.

These checks verify contracts, pure payload/retry logic, types, lint and compilation. They do not claim browser interaction or live authenticated purchase/sale acceptance. No development server was started; desktop/mobile browser confirmation remains Stage 6. Existing backend old-feature failures were not changed or rerun for this frontend-only batch.
