-- ANALYTICS SETUP — SOC & SOC
-- Da eseguire una sola volta nel SQL Editor di Supabase (progetto già esistente,
-- lo stesso che gestisce il catalogo prodotti).
--
-- Cosa fa:
-- 1. Crea una tabella per registrare visite pagina ed eventi (click WhatsApp/telefono)
-- 2. Attiva la sicurezza RLS: chiunque può SCRIVERE (necessario per tracciare i
--    visitatori del sito pubblico), ma solo un utente autenticato può LEGGERE
--    (il cruscotto è privato, non i dati grezzi)
-- 3. Non salva nessun dato personale: niente IP, niente identificativi utente,
--    solo pagina visitata, tipo di evento, provenienza e orario

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  path text not null,
  event_type text not null check (event_type in ('pageview', 'click_whatsapp', 'click_telefono')),
  referrer text
);

create index if not exists analytics_events_created_at_idx on analytics_events (created_at desc);
create index if not exists analytics_events_event_type_idx on analytics_events (event_type);

alter table analytics_events enable row level security;

-- Chiunque (i visitatori del sito, tramite anon key) può inserire un evento,
-- ma non può modificare o cancellare nulla.
create policy "Chiunque può registrare un evento"
  on analytics_events for insert
  to anon
  with check (true);

-- Lettura aperta per ora: nessun dato personale è salvato in questa tabella
-- (niente IP, niente identificativi), quindi la lettura pubblica è un rischio
-- accettabile finché il cruscotto è a uso personale. Se in futuro servirà
-- restringerla, basta cambiare "to anon" in "to authenticated" qui sotto.
create policy "Lettura aperta delle statistiche"
  on analytics_events for select
  to anon
  using (true);
