# Sheep Farm Mobile (Expo SDK 57)

React Native + Expo Router + React Native Paper client for the **existing** sheep-farm backend
(Spring Boot + PostgreSQL). This project does not create or modify the backend or database.

## Status / honesty notes

This source was generated in an environment **without network access**. That means:

- `npm install`, `expo-doctor`, `tsc` and `jest` were **not run** against real dependencies.
- The backend's Swagger/OpenAPI was **not inspected**. All DTOs in `src/types/api.ts` are **assumptions**
  (field names such as `tagNumber`, `withdrawalPeriodDays`, `treatmentDate`, `accessToken`).
- Expo-managed packages are declared as `*` in `package.json` on purpose; step 2 below pins the
  versions that match SDK 57.

Do steps 1–5 below before trusting the app.

## Setup

1. Prerequisites: Node 20+ (22 recommended), Expo Go or a dev build, backend running and reachable from the phone.
2. Install and align versions with SDK 57:
   ```bash
   npm install
   npx expo install --fix      # pins expo, react, react-native and all expo-* packages to SDK 57
   npx expo-doctor
   ```
3. Configure the API URL:
   ```bash
   cp .env.example .env
   # EXPO_PUBLIC_API_URL=http://<your-computer-LAN-IP>:<backend-port>
   ```
   Physical devices cannot use `localhost`. Android emulator: `http://10.0.2.2:<port>`.
   The backend must allow requests from the device (same Wi-Fi, firewall open, CORS is not relevant for native).
4. Verify DTOs against Swagger (`/swagger-ui.html` or `/v3/api-docs`) and edit **only** `src/types/api.ts`
   plus the small mappers in `src/features/*/…Form.tsx` and `src/schemas/index.ts` if names differ.
5. Run:
   ```bash
   npm run typecheck
   npm test
   npx expo start
   ```
   Since `expo-sqlite`, `expo-secure-store` and NetInfo are used, Expo Go works; if a module is missing from Expo Go use a dev build (`npx expo run:android`).

## Architecture

- `app/` – Expo Router screens (`(auth)`, `(tabs)`, detail/new/edit routes, `pending`)
- `src/services/api/` – Axios client (timeout, bearer auth, single-flight token refresh, GET-only retry), one module per resource
- `src/services/database/` – SQLite: `cache` (last fetched records), `meta`, `pending_ops` (offline queue)
- `src/services/sync/` – queue runner
- `src/repositories/` – the only layer screens use; "network first, cache fallback" + create-or-queue
- `src/providers/` – Auth, Sync (connectivity + queue state), Snackbar
- `src/schemas/` – Zod; `src/theme/paperTheme.ts` – deep-green Paper theme

Tokens are stored in `expo-secure-store`. SQLite is wiped on sign-out. AsyncStorage is listed for light
preferences but nothing currently needs it.

## Offline behaviour and limitations

| Action | Offline | Notes |
|---|---|---|
| View sheep / medications / treatments | Cached copy | Banner shows "cached" + timestamp |
| Register sheep, add medication, record treatment | Queued locally | Shown with a "Waiting to sync" chip |
| Update sheep status, edit medication, activate/deactivate | **Online only** | The API shows no version/ETag, so queued edits could silently overwrite newer data |
| Treatment for a sheep/medication created offline | Not allowed until those sync | They have no server id yet |

Sync rules (`src/services/sync/syncService.ts`):
- A queued item is deleted **only after a 2xx** from the server; nothing is reported as synced before that.
- Each operation has a client UUID, sent as an `Idempotency-Key` header. **Unless the backend honours it, it provides no protection**; it is harmless otherwise.
- Network error → stays `pending`, retried on reconnect/app start.
- **Timeout or app killed mid-request → `unconfirmed`** (the server may have saved it). Never auto-resent; the user chooses "Send again" (with duplicate warning) or "Discard" in *Sync queue*.
- HTTP 409 → `conflict`; other 4xx → `rejected`. Kept for review, never overwritten.
- Same sheep + same date + different/same medication is never blocked client-side.

## API surface used (nothing else is called)

Auth: `POST /api/auth/{register,login,refresh}` ·
Sheep: `GET/POST /api/v1/sheep`, `GET /api/v1/sheep/{id}`, `PATCH /api/v1/sheep/{id}/status` ·
Medications: `GET/POST /api/v1/medications`, `GET/PUT /api/v1/medications/{id}`, `PATCH /api/v1/medications/{id}/status` ·
Treatments: `GET/POST /api/v1/treatments`, `GET /api/v1/treatments/{id}`

## Known gaps caused by missing endpoints / unknown DTOs

- **Edit sheep**: no `PUT/PATCH /sheep/{id}` exists, so there is no edit-sheep screen (only status).
- **Treatment history per sheep**: no `?sheepId=` filter is known, so the full treatment list is fetched and filtered on the device.
- **Search / filter / sort** are done client-side on the fetched list; no unverified query parameters are sent. If the lists are paged by the backend, only the first page is loaded (page wrappers `content/data/items/results` are unwrapped; paging is not implemented).
- **Treatments due**: not shown; no scheduling data is known to exist.
- **Withdrawal warnings**: shown only when the treatment has `withdrawalEndDate`, or the medication has `withdrawalPeriodDays`.
- **Registration** assumes `{fullName,email,password}`; login assumes `{email,password}` and both return `{accessToken,refreshToken}`. If register returns no tokens the app logs in afterwards.
- Sheep status is free text because the allowed status values are unknown.
- Numeric vs string ids: ids are kept as received and sent back unchanged in URLs; form selections send ids as strings (Jackson normally coerces them).
