# SOC & SOC — Area Admin prodotti

L'area `admin.html` usa Supabase Authentication.

Federico può:
- caricare prodotti e fotografie;
- modificare prodotti;
- segnare disponibile/venduto;
- eliminare prodotti;
- gestire il catalogo senza modificare GitHub.

## File principali
- `admin.html`
- `css/admin.css`
- `js/admin.js`
- `js/supabase-config.js`
- `prodotti.html`
- `js/prodotti.js`

## Configurazione client
`js/supabase-config.js` contiene:
- Project URL
- Publishable Key

La Publishable Key è prevista nel browser.
NON inserire Secret Key o `service_role` nel frontend.

## Sicurezza RLS
La versione aggiornata delle policy limita le scritture a:
`semplicepiu@gmail.com`

Per applicare la correzione al progetto Supabase già esistente esegui:
`SUPABASE-SICUREZZA-DA-ESEGUIRE.sql`

Il file modifica solo le policy e non elimina catalogo o immagini.

Se l'email di login dell'admin è diversa, NON eseguire il file prima
di aver sostituito l'email nelle policy.
