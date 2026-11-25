-- Run this in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Accessories',
  description text not null default '',
  image_url text,
  price integer not null check (price > 0),
  compare_at integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  notes text default '',
  items jsonb not null,
  total integer not null check (total >= 0),
  status text not null default 'pending' check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  payment_method text not null default 'cash_on_delivery',
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;

-- Public can read active products. Only authenticated admins can manage products.
create policy "Public can read active products" on public.products
for select using (active = true or auth.role() = 'authenticated');
create policy "Admins can insert products" on public.products
for insert to authenticated with check (true);
create policy "Admins can update products" on public.products
for update to authenticated using (true) with check (true);
create policy "Admins can delete products" on public.products
for delete to authenticated using (true);

-- Public checkout can create order requests. Customers cannot read orders.
create policy "Public can create order requests" on public.orders
for insert to anon, authenticated with check (
  status = 'pending' and payment_method = 'cash_on_delivery'
);
create policy "Admins can read orders" on public.orders
for select to authenticated using (true);
create policy "Admins can update orders" on public.orders
for update to authenticated using (true) with check (true);

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant insert on public.orders to anon, authenticated;
grant select, update on public.orders to authenticated;
