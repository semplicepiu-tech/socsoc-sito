-- SOC & SOC — setup database Supabase
-- Configurazione aggiornata con policy RLS limitate all'account admin.
-- Email admin autorizzata: semplicepiu@gmail.com
--
-- NOTA: la Publishable Key può restare nel frontend.
-- Le operazioni di scrittura sono consentite solo al JWT autenticato
-- con l'email indicata qui sotto.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'altro'
    check (category in ('mobili','vintage','casa','elettrodomestici','usato','sport','vestiario','altro')),
  price text not null default 'Prezzo su richiesta',
  description text not null default '',
  status text not null default 'available'
    check (status in ('available','sold')),
  image_url text,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

-- Catalogo leggibile pubblicamente.
drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
on public.products for select
to anon, authenticated
using (true);

-- Rimuove le vecchie policy troppo larghe, se presenti.
drop policy if exists "Authenticated can insert products" on public.products;
drop policy if exists "Authenticated can update products" on public.products;
drop policy if exists "Authenticated can delete products" on public.products;
drop policy if exists "Federico can insert products" on public.products;
drop policy if exists "Federico can update products" on public.products;
drop policy if exists "Federico can delete products" on public.products;

create policy "Federico can insert products"
on public.products for insert
to authenticated
with check ((auth.jwt() ->> 'email') = 'semplicepiu@gmail.com');

create policy "Federico can update products"
on public.products for update
to authenticated
using ((auth.jwt() ->> 'email') = 'semplicepiu@gmail.com')
with check ((auth.jwt() ->> 'email') = 'semplicepiu@gmail.com');

create policy "Federico can delete products"
on public.products for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'semplicepiu@gmail.com');

-- Bucket pubblico per le fotografie dei prodotti.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
on storage.objects for select
to public
using (bucket_id = 'product-images');

-- Rimuove le vecchie policy storage troppo larghe, se presenti.
drop policy if exists "Authenticated can upload product images" on storage.objects;
drop policy if exists "Authenticated can update product images" on storage.objects;
drop policy if exists "Authenticated can delete product images" on storage.objects;
drop policy if exists "Federico can upload product images" on storage.objects;
drop policy if exists "Federico can update product images" on storage.objects;
drop policy if exists "Federico can delete product images" on storage.objects;

create policy "Federico can upload product images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (auth.jwt() ->> 'email') = 'semplicepiu@gmail.com'
);

create policy "Federico can update product images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-images'
  and (auth.jwt() ->> 'email') = 'semplicepiu@gmail.com'
)
with check (
  bucket_id = 'product-images'
  and (auth.jwt() ->> 'email') = 'semplicepiu@gmail.com'
);

create policy "Federico can delete product images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (auth.jwt() ->> 'email') = 'semplicepiu@gmail.com'
);
