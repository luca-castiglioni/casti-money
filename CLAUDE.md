# Casti Money

Web app (installabile su iPhone e Android) per registrare entrate e uscite personali,
usata da più utenti con credenziali proprie. L'utente è alle prime armi:
spiega le modifiche in italiano, in modo semplice, un passo alla volta.

## Stack
- Vite + React 19 + TypeScript (solo frontend, nessun server nostro)
- Supabase: autenticazione email/password + database Postgres con Row Level Security
- exceljs per l'esportazione in Excel (caricata solo al momento dell'export)
- Pubblicazione prevista su GitHub Pages (`base: './'` in vite.config.ts)

## Comandi
- `npm run dev` — avvia in locale (raggiungibile anche dal telefono sulla stessa Wi-Fi)
- `npm run build` — controllo dei tipi + build in `dist/`

## Struttura
- `supabase/schema.sql` — tabelle, trigger e regole di sicurezza; è la fonte di verità del DB.
  Ogni modifica allo schema va aggiunta qui E va rieseguita in Supabase → SQL Editor.
- `src/config.ts` — categorie e metodi di pagamento
- `src/supabase.ts` — tutte le query al database (i componenti non chiamano Supabase direttamente, salvo auth/profilo)
- `src/components/` — Login, MovimentoForm, Elenco
- `src/export.ts` — generazione del file Excel

## Regole di dominio
- Campi obbligatori: data, tipo, importo, categoria, controparte, pagamento. Descrizione facoltativa.
- Importo salvato con segno: uscite negative, entrate positive (vincolo nel DB).
- Permessi: tutti gli utenti vedono tutto; ognuno modifica/elimina solo i propri movimenti;
  l'amministratore (`profiles.is_admin`) può modificare tutto.
- Le registrazioni pubbliche sono disattivate: gli utenti li crea l'amministratore da Supabase.
- Testi dell'interfaccia e nomi nel codice in italiano.

## Sicurezza
- Mai committare `.env.local`. La anon key può stare nel browser; la service_role key MAI.
- La sicurezza dei dati dipende dalle policy RLS in `schema.sql`, non dai controlli nell'interfaccia.
