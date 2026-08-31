-- MIGRAZIONE — aggiunta nuove categorie prodotto (usato, sport, vestiario)
-- Da eseguire UNA SOLA VOLTA in: Supabase → SQL Editor → New query → Run

alter table public.products drop constraint if exists products_category_check;

alter table public.products add constraint products_category_check
  check (category in ('mobili','vintage','casa','elettrodomestici','usato','sport','vestiario','altro'));
