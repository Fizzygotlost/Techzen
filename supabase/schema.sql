-- TechZen database schema. The live project was provisioned using this schema.
create extension if not exists pgcrypto;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Accessories',
  description text not null default '',
  image_url text,
  images text[] not null default '{}',
  price integer not null check (price > 0),
  compare_at integer not null default 0,
  active boolean not null default true,
  stock integer null check (stock is null or stock >= 0),
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  notes text default '',
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  total integer not null default 0 check (total >= 0),
  delivery_fee integer not null default 149 check (delivery_fee >= 0),
  status text not null default 'pending'
    check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  payment_method text not null default 'cash_on_delivery'
    check (payment_method = 'cash_on_delivery'),
  stock_deducted boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;

create policy "Public can read active products"
on public.products for select to anon, authenticated
using (active = true);

create policy "TechZen admins can read all products"
on public.products for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "TechZen admins can insert products"
on public.products for insert to authenticated
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "TechZen admins can update products"
on public.products for update to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "TechZen admins can delete products"
on public.products for delete to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Public can submit COD order requests"
on public.orders for insert to anon, authenticated
with check (status = 'pending' and payment_method = 'cash_on_delivery');

create policy "TechZen admins can read orders"
on public.orders for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "TechZen admins can update orders"
on public.orders for update to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant insert on public.orders to anon, authenticated;
grant select, update on public.orders to authenticated;

create or replace function public.normalize_order_request()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_name text;
  v_price integer;
  v_stock integer;
  v_items jsonb := '[]'::jsonb;
  v_subtotal integer := 0;
begin
  if jsonb_typeof(new.items) <> 'array' or jsonb_array_length(new.items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;
  for v_item in select value from jsonb_array_elements(new.items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity < 1 or v_quantity > 20 then
      raise exception 'Invalid item quantity';
    end if;
    select p.name, p.price, p.stock into v_name, v_price, v_stock
      from public.products p where p.id = v_product_id and p.active = true
      for update;
    if not found then raise exception 'Product unavailable'; end if;
    if v_stock is not null and v_stock < v_quantity then
      raise exception 'Insufficient stock for %', v_name;
    end if;
    v_subtotal := v_subtotal + (v_price * v_quantity);
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'product_id', v_product_id, 'name', v_name, 'unit_price', v_price, 'quantity', v_quantity
    ));
  end loop;
  new.items := v_items;
  new.delivery_fee := 149;
  new.total := v_subtotal + new.delivery_fee;
  new.status := 'pending';
  new.payment_method := 'cash_on_delivery';
  new.stock_deducted := false;
  return new;
end;
$$;

create or replace function public.sync_order_stock_on_status_change()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_stock integer;
begin
  if new.status in ('confirmed','shipped','delivered') and not old.stock_deducted then
    for v_item in select value from jsonb_array_elements(old.items)
    loop
      v_product_id := (v_item ->> 'product_id')::uuid;
      v_quantity := (v_item ->> 'quantity')::integer;
      select p.stock into v_stock
        from public.products p where p.id = v_product_id
        for update;
      if not found then raise exception 'Product no longer exists'; end if;
      if v_stock is not null then
        if v_stock < v_quantity then
          raise exception 'Insufficient stock to confirm order item %', v_item ->> 'name';
        end if;
        update public.products set stock = stock - v_quantity where id = v_product_id;
      end if;
    end loop;
    new.stock_deducted := true;
  elsif new.status = 'cancelled' and old.stock_deducted then
    for v_item in select value from jsonb_array_elements(old.items)
    loop
      v_product_id := (v_item ->> 'product_id')::uuid;
      v_quantity := (v_item ->> 'quantity')::integer;
      update public.products
        set stock = stock + v_quantity
        where id = v_product_id and stock is not null;
    end loop;
    new.stock_deducted := false;
  end if;
  return new;
end;
$$;

create trigger normalize_order_request_before_insert
before insert on public.orders
for each row execute function public.normalize_order_request();

drop trigger if exists sync_order_stock_on_status_change on public.orders;
create trigger sync_order_stock_on_status_change
before update of status on public.orders
for each row when (old.status is distinct from new.status)
execute function public.sync_order_stock_on_status_change();


-- Product images: public read, admin-only uploads and management.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('techzen-products', 'techzen-products', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "TechZen admins can upload product images"
on storage.objects for insert to authenticated
with check (bucket_id = 'techzen-products' and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "TechZen admins can update product images"
on storage.objects for update to authenticated
using (bucket_id = 'techzen-products' and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check (bucket_id = 'techzen-products' and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "TechZen admins can delete product images"
on storage.objects for delete to authenticated
using (bucket_id = 'techzen-products' and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
