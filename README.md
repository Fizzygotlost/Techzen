# TechZen starter

A free-tier React + Vite storefront starter for TechZen.

## Included
- Responsive dark/purple storefront
- Product search and catalogue
- Cart and website checkout form
- Supabase product/order integration
- Admin sign-in, product management and order status dashboard
- Cloudflare Pages deployment setup

## 1. Run locally
Install Node.js, then:

```bash
npm install
cp .env.example .env
npm run dev
```

## 2. Supabase setup
The TechZen Supabase project has already been created and the schema applied.
1. Use the project URL and publishable key from Supabase project settings.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in your local `.env` file.
3. Create your admin user in Supabase Authentication.
4. In that user's **App Metadata**, set `{"role":"admin"}`. Do not put this in User Metadata.
5. Disable public sign-ups. Only the intended admin account should be able to sign in.

Never put a Supabase `service_role` or secret key in frontend code. The database policies only grant dashboard access to users whose trusted App Metadata role is `admin`.

## 3. Deploy free on Cloudflare Pages
1. Connect the GitHub repository to Cloudflare Pages.
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Build output directory: `dist`.
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as Pages environment variables.
6. Deploy. Cloudflare Pages will provide a `*.pages.dev` address.

## Important launch checks
- Add only product claims confirmed by the supplier.
- Confirm supplier authorization, commission, delivery, COD settlement and return terms before accepting real orders.
- The demo products are placeholders. Replace them with verified products and authorized product images.
- Checkout requests are limited to COD and the database recalculates item names and prices from active products. Delivery charges are not included in the product subtotal and must be confirmed with the customer.
- This starter does not integrate a courier, payment gateway, inventory sync, automated email/SMS, or Markaz API.
- Protect the admin account with a strong unique password and enable MFA if available.
- Free-tier quotas and provider policies can change; check current limits before launch.
