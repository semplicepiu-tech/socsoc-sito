-- MIGRAZIONE — supporto multi-foto per prodotto (max 3)
-- Da eseguire UNA SOLA VOLTA in: Supabase → SQL Editor → New query → Run
--
-- Cosa fa:
-- 1) Aggiunge due nuove colonne (elenco foto + elenco percorsi storage)
-- 2) Copia la foto già esistente di ogni prodotto nel nuovo formato
-- 3) Impedisce di salvare più di 3 foto per prodotto
--
-- Le vecchie colonne image_url / image_path NON vengono toccate.

alter table public.products
  add column if not exists image_urls text[] not null default '{}';

alter table public.products
  add column if not exists image_paths text[] not null default '{}';

-- Copia la foto esistente nel nuovo formato, solo se non già migrata.
update public.products
set image_urls = array[image_url]
where image_url is not null
  and image_url <> ''
  and array_length(image_urls, 1) is null;

update public.products
set image_paths = array[image_path]
where image_path is not null
  and image_path <> ''
  and array_length(image_paths, 1) is null;

-- Limite massimo: 3 foto per prodotto.
alter table public.products drop constraint if exists products_max_3_images;
alter table public.products add constraint products_max_3_images
  check (array_length(image_urls, 1) is null or array_length(image_urls, 1) <= 3);
