# Casti Money

Registro di entrate e uscite, utilizzabile da telefono (iPhone e Android) da più persone.

## Come è fatta

| Parte | Cosa fa |
|---|---|
| **App web** (`src/`) | Le schermate: accesso, elenco del mese, modulo per nuovi movimenti, export Excel |
| **Supabase** | Conserva i dati nel cloud e gestisce gli utenti con email e password |
| **GitHub Pages** | Pubblica l'app su internet, gratis (tappa successiva) |

## Configurazione di Supabase (una volta sola)

1. Vai su [supabase.com](https://supabase.com), accedi (anche con GitHub) e crea un **nuovo progetto**.
   Scegli una password per il database e la regione **Central EU (Frankfurt)**.
2. Apri **SQL Editor → New query**, incolla tutto il contenuto di `supabase/schema.sql` e premi **Run**.
3. Vai in **Authentication → Sign In / Providers** e disattiva **Allow new users to sign up**:
   così nessuno può registrarsi da solo.
4. Vai in **Authentication → Users → Add user → Create new user**, inserisci la tua email e una
   password e spunta **Auto Confirm User**. Ripeti per ogni persona che userà l'app.
5. Torna nel **SQL Editor** e rendi te stesso amministratore:
   ```sql
   update public.profiles set is_admin = true where email = 'tua@email.it';
   ```
6. Vai in **Project Settings → API** (o **Data API**) e copia **Project URL** e la chiave
   **anon / publishable**.
7. Nella cartella del progetto copia `.env.example` in un nuovo file `.env.local` e incolla i due valori.

## Avviare l'app sul Mac

```bash
npm install
npm run dev
```

Apri l'indirizzo `http://localhost:5173` nel browser. Dal telefono, sulla stessa Wi-Fi, usa
l'indirizzo "Network" che compare nel terminale.

## Personalizzare

- Categorie e metodi di pagamento: `src/config.ts`
- Nome visualizzato di un utente: tabella `profiles` in Supabase (colonna `nome`)
