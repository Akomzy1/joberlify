# Joberlify — Production Deployment Checklist

## Pre-flight: run the health check
```bash
npm run health-check
```
All checks must pass before deploying.

---

## 1 — Supabase production setup

1. Create a **new** Supabase project at supabase.com (separate from dev)
2. Run all migrations: `supabase db push --linked`
3. Enable Row Level Security on all tables:
   - `users`, `user_profiles`, `evaluations`, `pipeline_items`, `cv_documents`, `interview_preps`
4. Set Auth redirect URLs:
   - **Site URL**: `https://joberlify.com`
   - **Redirect URLs**: `https://joberlify.com/**`
5. Seed data:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed:soc-codes
   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed:sponsors
   ```

---

## 2 — Stripe production setup

1. Switch to **Live mode** in the Stripe dashboard
2. Create products:
   - **Joberlify Pro** — $17.99/month (recurring)
   - **Joberlify Global** — $34.99/month (recurring)
3. Copy the live Price IDs into your production env vars
4. Set up the webhook endpoint:
   - URL: `https://joberlify.com/api/billing/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
5. Copy the webhook signing secret (`whsec_...`) to `STRIPE_WEBHOOK_SECRET`
6. Test with Stripe's webhook test tool before going live

---

## 3 — Vercel deployment

### 3a — Connect repository
1. Push code to GitHub
2. Go to vercel.com → New Project → import your GitHub repo
3. Framework preset: **Next.js** (auto-detected)
4. Root directory: `/` (default)

### 3b — Environment variables in Vercel dashboard
Add all variables from `.env.local.example`. Use **production values** (live Stripe keys, production Supabase, production app URL):

| Variable | Production value |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://joberlify.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Your prod Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Prod anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Prod service role key |
| `ANTHROPIC_API_KEY` | Live Anthropic key |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from prod webhook |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `STRIPE_PRO_PRICE_ID` | Live price ID |
| `STRIPE_GLOBAL_PRICE_ID` | Live price ID |
| `RESEND_API_KEY` | Resend API key |
| `UK_SPONSORS_CSV_URL` | GOV.UK CSV URL |

### 3c — Deploy
Click **Deploy**. The first build will take 2–3 minutes.

---

## 4 — Custom domain

1. In Vercel: Settings → Domains → Add `joberlify.com`
2. Add DNS records at your registrar:
   - Type: `A`, Name: `@`, Value: `76.76.21.21` (Vercel IP)
   - Type: `CNAME`, Name: `www`, Value: `cname.vercel-dns.com`
3. SSL certificate: provisioned automatically by Vercel (Let's Encrypt), usually within 5 minutes

---

## 5 — Post-deployment verification

### Automated checks
```bash
# Set NEXT_PUBLIC_APP_URL to prod URL and run health check
NEXT_PUBLIC_APP_URL=https://joberlify.com npm run health-check
```

### Manual checks
- [ ] `https://joberlify.com` loads with correct SSL (green padlock)
- [ ] `https://joberlify.com/sitemap.xml` — valid XML, all pages listed
- [ ] `https://joberlify.com/robots.txt` — correct directives
- [ ] `https://joberlify.com/llms.txt` — accessible
- [ ] OG image renders at: opengraph.xyz → paste joberlify.com
- [ ] Sign up flow: `/auth/signup` → email verification → onboarding → dashboard
- [ ] CV upload: upload a PDF, verify parsing
- [ ] Evaluate: paste a job URL, verify results page loads
- [ ] Stripe checkout: use Stripe's test card `4242 4242 4242 4242` (test mode first)
- [ ] Stripe webhook: verify subscription tier updates in Supabase after checkout
- [ ] Mobile: test on real iPhone/Android at 375px width
- [ ] Page speed: run Lighthouse on `/` — target > 90 performance score

### Stripe live mode test
1. Enable live mode, use a real card with $0.00 Stripe test
2. Or: create a coupon for 100% discount, test full checkout flow
3. Verify the webhook fires and `subscription_tier` updates in `users` table

---

## 6 — Search Console & SEO

1. Go to Google Search Console
2. Add property: `https://joberlify.com`
3. Verify ownership (DNS TXT record or HTML meta tag via `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`)
4. Submit sitemap: `https://joberlify.com/sitemap.xml`
5. Wait 24–48 hours for initial indexing

---

## 7 — Ongoing operations

| Task | Frequency | Command |
|---|---|---|
| Refresh sponsor data | Weekly | `npm run ingest:sponsors` (or set up a Vercel cron) |
| Health check | Before each deployment | `npm run health-check` |
| Stripe webhook events | Monitor | Stripe Dashboard → Developers → Webhooks |
| Error monitoring | Always on | Vercel Functions → Logs |

### Vercel cron for sponsor ingestion
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/ingest-sponsors",
      "schedule": "0 3 * * 1"
    }
  ]
}
```
This runs every Monday at 03:00 UTC. Create a matching route at `app/api/cron/ingest-sponsors/route.ts` that triggers the ingestion script with the `CRON_SECRET` header check.
