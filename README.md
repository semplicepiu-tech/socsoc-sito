# SOC & SOC — sito web

Sito di Soc & Soc di Rubin Federico, dedicato a sgomberi, recupero e mercatino dell'usato/vintage in Piemonte.

## Stack
- HTML / CSS / JavaScript vanilla
- GitHub Pages
- Supabase: database, Authentication e Storage

## Pagine principali
- `index.html` — homepage, ultimi prodotti Supabase e sezione Prima/Dopo
- `prodotti.html` — catalogo dinamico
- `sgomberi.html` — servizi, recensioni e carosello Prima/Dopo
- `admin.html` — area riservata prodotti
- `contatti.html` — modulo che prepara un messaggio WhatsApp
- `privacy.html`, `cookie.html` — informative

## Catalogo
I prodotti NON sono scritti manualmente nell'HTML.
Federico li gestisce da `admin.html`; il sito li legge da Supabase.

## Foto Prima/Dopo
Cartella predisposta:
`img/sgomberi/`

Nomi previsti:
- `prima-1.jpg` / `dopo-1.jpg`
- `prima-2.jpg` / `dopo-2.jpg`
- `prima-3.jpg` / `dopo-3.jpg`

Finché le fotografie reali non vengono inserite, il sito mostra segnaposto.

## Sicurezza Supabase — operazione da fare
Nel pacchetto è presente:

`SUPABASE-SICUREZZA-DA-ESEGUIRE.sql`

Apri Supabase → SQL Editor e incolla/esegui quel file **una volta**.

La migrazione:
- NON cancella prodotti;
- NON cancella fotografie;
- restringe inserimento/modifica/eliminazione all'account
  `semplicepiu@gmail.com`.

Prima di eseguirla verifica che questa sia l'email usata da Federico per il login in `admin.html`.

Consigliato inoltre in Supabase: disabilitare le registrazioni pubbliche se non servono.

## Pubblicazione
Dopo aver sostituito i file nel progetto:

```bash
git add .
git commit -m "Aggiornamento sito e sicurezza"
git push origin main
```

GitHub Pages pubblicherà automaticamente le modifiche.
