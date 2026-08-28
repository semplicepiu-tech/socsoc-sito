-- SOC & SOC — MIGRAZIONE SICUREZZA RLS
-- DA ESEGUIRE ORA nel Supabase SQL Editor.
--
-- Questo file NON elimina prodotti e NON elimina immagini.
-- Sostituisce soltanto le policy di scrittura troppo larghe.
--
-- IMPORTANTE:
-- eseguilo se l'account usato da Federico per accedere ad admin.html
-- ha email: semplicepiu@gmail.com

alter table public.products enable row level security;

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
