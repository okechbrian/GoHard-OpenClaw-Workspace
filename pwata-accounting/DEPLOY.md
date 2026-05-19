# Deployment Notes

## Vercel environment variables

Required for the customer store to work end-to-end:

| Variable | Where set | Purpose |
|---|---|---|
| `FLW_SECRET_KEY` | Vercel env (production) | Flutterwave API key — server-side calls |
| `FLW_SECRET_HASH` | Vercel env (production) | Random shared secret — must match the `Secret Hash` field in the Flutterwave dashboard |
| `BLOB_READ_WRITE_TOKEN` | Auto-injected by `vercel blob create-store --yes` | Vercel Blob upload token |
| `NEXT_PUBLIC_ENABLE_UPLOADS` | Vercel env | Set to `true` to show the upload zone in Step 2 of the order wizard |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Vercel env | Format `256XXXXXXXXX` (no `+`, no spaces). Drives the WhatsApp CTA on the customer tracking page |
| `WHATSAPP_VERIFY_TOKEN` | Vercel env | Secret value Meta uses to verify `/api/whatsapp/webhook` |
| `WHATSAPP_ACCESS_TOKEN` | Vercel env | Meta WhatsApp Cloud API access token for sending replies |
| `WHATSAPP_PHONE_NUMBER_ID` | Vercel env | Meta phone number ID used by the Cloud API |
| `WHATSAPP_GRAPH_VERSION` | Vercel env | Optional. Defaults to `v25.0` |
| `GEMINI_API_KEY` | Vercel env | Enables AI-assisted WhatsApp replies |
| `WHATSAPP_AI_MODEL` | Vercel env | Optional. Defaults to `gemini-2.5-flash` |
| `ORDERS_APP_PUBLIC_URL` | Vercel env | Optional public URL used in WhatsApp bot replies. Falls back to `ORDERS_APP_URL` |

Set via:

```pwsh
vercel env add FLW_SECRET_KEY production --value "FLWSECK-..." --yes
vercel env add FLW_SECRET_HASH production --value "<random-32-char-string>" --yes
```

## Flutterwave webhook setup

After deploying to Vercel and getting the production URL (e.g. `https://pwata-accounting.vercel.app`):

1. Open Flutterwave dashboard → Settings → Webhooks
2. Set the **URL** to: `https://<your-domain>/api/store/payment/webhook`
3. Set the **Secret Hash** to the same value you put in `FLW_SECRET_HASH` above
4. Save

When a customer pays the deposit on their phone, Flutterwave POSTs to that URL with a `verif-hash` header. The webhook:
- Verifies the hash with `timingSafeEqual` (constant-time compare)
- Flips the order's `payment_status` from `pending` to `partial`
- Bumps the order status from `pending` to `in_design`
- Auto-creates a Sale + Invoice in the accounting ledger via `onOrderStatusChange()`

The endpoint is idempotent — repeated webhook deliveries are safe.

## Blob store setup

If not already done:

```pwsh
vercel blob create-store pwata-uploads --access public --yes \
  --environment production --environment preview --environment development
```

This creates the store *and* connects it to the project, auto-injecting `BLOB_READ_WRITE_TOKEN` into all three environments.

## WhatsApp bot webhook setup

The Pwata business WhatsApp bot webhook lives at:

```text
https://<your-domain>/api/whatsapp/webhook
```

In the Meta app dashboard:

1. Add the callback URL above.
2. Set the verify token to the same value as `WHATSAPP_VERIFY_TOKEN`.
3. Subscribe the WhatsApp Business Account webhook to `messages`.
4. Set `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and `GEMINI_API_KEY` in Vercel.

The current bot slice handles menu/help messages, order-page routing, price starting points, order status lookups by order number or by the sender's phone number, and AI-assisted replies for open-ended customer messages. If `GEMINI_API_KEY` is missing or Gemini fails, the bot falls back to the menu instead of breaking the webhook.

## Local dev

Pull the production env locally:

```pwsh
vercel env pull .env.local
```

Then start dev with `npm run dev`. The Flutterwave webhook needs a public URL — use `ngrok http 3000` or similar for local testing.
