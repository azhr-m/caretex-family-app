# Lock-screen push notifications

How the app handles push, and the rules the backend must follow. Source of truth: `design_handoff_caretex_family_app/docs/04-api-contracts.md` §13.

## Payload

```json
{ "title": "CARETEX Family", "body": "You have a new message", "data": { "notificationId": "n_123" }, "tag": "caretex" }
```

- `title` is always `CARETEX Family`.
- `body` is one sentence from the fixed list below, in the device language.
- `data` carries only the notification id. Tapping the push opens the app; after sign-in (or unlock) the app fetches `GET /notifications/:id` and deep-links from there.
- `tag` is always `caretex`, so a newer push replaces an older one instead of stacking.

## Allowed bodies

| Notification kind | Body kind | English | Hebrew |
|---|---|---|---|
| `inquiry_reply` | message | You have a new message | יש לכם הודעה חדשה |
| `document`, `newsletter` | document | You have a new document waiting | יש לכם מסמך חדש שממתין |
| `event`, `calendar_change` | event | You have a new event | יש לכם אירוע חדש |
| `update`, `survey` | update | You have a new update | יש לכם עדכון חדש |
| `service_request` | request | There is an update on your request | יש עדכון בבקשה שלכם |

**Never** put in a push: resident or staff names, medical terms, inquiry subjects, message text, document titles, or anything typed by a person. Settings shows "Message previews on lock screen" as permanently off for this reason.

## In the app

- [src/lib/push.ts](src/lib/push.ts): `buildPushPayload(notificationId, kind, lang)` builds the payload. It has no parameter that could carry free text; unit tests check every kind and language produces one of the allowed bodies.
- `subscribeToPush(lang)` is a stub. It returns `not-configured` until `VITE_VAPID_PUBLIC_KEY` is set and the app has its own service worker (Phase 6, PWA). Then it asks for notification permission, subscribes, and registers the device with `POST /me/devices { platform: 'web', pushToken, locale }`.
- In mock mode the only service worker is MSW's, so push is never subscribed.

## Still needed (Phase 6 / backend)

- The app's service worker: show the push with the payload as is, and on click open `/notifications?open=<id>` (or the deep link after fetching the notification).
- A VAPID key pair; the public key goes in `VITE_VAPID_PUBLIC_KEY`.
- The backend picks the body from the table above using the member's `preferences.language`, and respects the member's notification toggles.
