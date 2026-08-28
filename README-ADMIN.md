# SOC & SOC — Area Admin prodotti

Questi file aggiungono una vera area `/admin.html` collegata a Supabase.

## Cosa ottieni

- Login con email e password.
- Caricamento foto dal telefono o dal PC.
- Nome, categoria, prezzo, descrizione e stato del prodotto.
- Modifica prodotto.
- Segna come venduto / rimetti disponibile.
- Eliminazione prodotto e relativa foto.
- Pagina `prodotti.html` aggiornata automaticamente dal database.
- Ricerca e filtri nel catalogo.
- Layout mobile friendly.

## File da copiare nel progetto GitHub

Copia mantenendo esattamente queste cartelle:

- `admin.html`
- `prodotti.html` (sostituisce quello attuale)
- `css/admin.css`
- `css/prodotti.css`
- `js/admin.js`
- `js/prodotti.js`
- `js/supabase-config.js`
- `supabase-setup.sql` (serve solo per configurare Supabase)

Il tuo `css/style.css`, `js/site.js` e la cartella `img/` rimangono invariati.

## 1. Crea il progetto Supabase

Vai su Supabase e crea un nuovo progetto.

## 2. Crea il database e lo storage

Apri il **SQL Editor** di Supabase, copia tutto il contenuto di `supabase-setup.sql` ed eseguilo una volta.

## 3. Crea l'utente di Federico

In Supabase vai in **Authentication → Users** e crea un utente con email e password per Federico.

Non inserire la password nel codice del sito.

## 4. Collega il sito a Supabase

In Supabase apri le impostazioni API del progetto e recupera:

- Project URL
- anon / publishable key

Apri `js/supabase-config.js` e sostituisci:

```js
url: "INCOLLA_QUI_SUPABASE_URL",
anonKey: "INCOLLA_QUI_SUPABASE_ANON_KEY"
```

La anon key può essere usata nel browser: le policy RLS del database impediscono ai visitatori non autenticati di modificare i prodotti.

**Non usare mai la service_role key nel sito.**

## 5. Pubblica su GitHub

Da Visual Studio Code:

```bash
git add .
git commit -m "Aggiunta area admin prodotti"
git push origin main
```

GitHub Pages pubblicherà automaticamente i file.

Area amministratore:

`https://semplicepiu-tech.github.io/socsoc-sito/admin.html`

Catalogo:

`https://semplicepiu-tech.github.io/socsoc-sito/prodotti.html`

## Come lavorerà Federico

1. Apre `admin.html` dal telefono.
2. Accede con email e password.
3. Tocca **Nuovo prodotto**.
4. Seleziona una foto dalla galleria o scatta una foto.
5. Inserisce nome, categoria, prezzo e descrizione.
6. Tocca **Pubblica prodotto**.
7. Il prodotto compare su `prodotti.html` senza modificare GitHub.

## Nota sicurezza

L'URL di `admin.html` è pubblico, ma il pannello di gestione non è utilizzabile senza autenticazione Supabase. Le modifiche al database e alle immagini sono permesse solo agli utenti autenticati tramite le policy definite in `supabase-setup.sql`.
