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

## Local dev

Pull the production env locally:

```pwsh
vercel env pull .env.local
```

Then start dev with `npm run dev`. The Flutterwave webhook needs a public URL — use `ngrok http 3000` or similar for local testing.
