# TechZen starter

A free-tier React + Vite storefront starter for TechZen.

## Included
- Responsive dark/purple storefront
- Product search and catalogue
- Cart and website checkout form
- Supabase product/order integration
- Admin sign-in, product management and order status dashboard
- Netlify deployment configuration

## 1. Run locally
Install Node.js, then:

```bash
npm install
cp .env.example .env
npm run dev
```

## 2. Create Supabase project
1. Create a project at https://supabase.com/
2. Open SQL Editor and run `supabase/schema.sql`.
3. In Authentication > Users, create your admin user.
4. Copy the Project URL and publishable/anon key into `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Never put a Supabase `service_role` or secret key in frontend code.

## 3. Deploy free on Netlify
1. Push this project to a GitHub repository.
2. Import that repository in Netlify.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add the two environment variables from `.env` in Netlify site settings.
6. Deploy. Netlify will provide a `*.netlify.app` address.

## Important launch checks
- Confirm Supabase RLS policies and test using a separate non-admin browser session.
- Add only product claims confirmed by the supplier.
- Confirm supplier authorization, commission, delivery, COD settlement and return terms before accepting real orders.
- The demo products are placeholders. Replace them with verified products and authorized product images.
- This starter records order requests; it does not integrate a courier, payment gateway, inventory sync, automated email/SMS, or Markaz API.
- Protect the admin account with a strong unique password and enable MFA if available.
- Free-tier quotas and policies can change; check provider limits before launch.
