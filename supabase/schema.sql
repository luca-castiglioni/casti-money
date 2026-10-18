-- =====================================================================
-- Casti Money — schema del database
-- Da eseguire una volta in Supabase → SQL Editor → New query → Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Profili utente: una riga per ogni utente registrato
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  nome       text,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

-- Crea automaticamente il profilo quando un utente viene aggiunto
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, nome)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- true se l'utente collegato è amministratore
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------
-- Movimenti: entrate (importo positivo) e uscite (importo negativo)
-- ---------------------------------------------------------------------
create table if not exists public.movimenti (
  id          uuid primary key default gen_random_uuid(),
  data        date not null default current_date,
  tipo        text not null check (tipo in ('uscita', 'entrata')),
  importo     numeric(12, 2) not null,
  categoria   text not null check (length(trim(categoria)) > 0),
  controparte text not null check (length(trim(controparte)) > 0),
  pagamento   text not null check (length(trim(pagamento)) > 0),
  descrizione text,
  created_by  uuid not null default auth.uid() references public.profiles (id),
  created_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id),
  updated_at  timestamptz,
  -- il segno dell'importo deve corrispondere al tipo
  constraint importo_coerente_con_tipo check (
    (tipo = 'uscita'  and importo < 0) or
    (tipo = 'entrata' and importo > 0)
  )
);

create index if not exists movimenti_data_idx on public.movimenti (data desc);

-- Registra automaticamente chi ha fatto l'ultima modifica e quando
create or replace function public.set_updated()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  new.created_by := old.created_by;  -- l'autore originale non si può cambiare
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists movimenti_set_updated on public.movimenti;
create trigger movimenti_set_updated
  before update on public.movimenti
  for each row execute function public.set_updated();

-- ---------------------------------------------------------------------
-- Regole di sicurezza (Row Level Security)
--   • tutti gli utenti collegati vedono tutti i movimenti
--   • ognuno inserisce movimenti solo a proprio nome
--   • ognuno modifica/elimina solo i propri; l'amministratore tutto
-- ---------------------------------------------------------------------
alter table public.profiles  enable row level security;
alter table public.movimenti enable row level security;

drop policy if exists "profili visibili agli utenti" on public.profiles;
create policy "profili visibili agli utenti" on public.profiles
  for select to authenticated using (true);

drop policy if exists "modifica del proprio nome" on public.profiles;
create policy "modifica del proprio nome" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and is_admin = public.is_admin());  -- nessuno può promuoversi admin da solo

drop policy if exists "lettura movimenti" on public.movimenti;
create policy "lettura movimenti" on public.movimenti
  for select to authenticated using (true);

drop policy if exists "inserimento movimenti" on public.movimenti;
create policy "inserimento movimenti" on public.movimenti
  for insert to authenticated with check (created_by = auth.uid());

drop policy if exists "modifica movimenti" on public.movimenti;
create policy "modifica movimenti" on public.movimenti
  for update to authenticated
  using (created_by = auth.uid() or public.is_admin());

drop policy if exists "eliminazione movimenti" on public.movimenti;
create policy "eliminazione movimenti" on public.movimenti
  for delete to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- Dopo aver creato il tuo utente (Authentication → Users → Add user),
-- rendilo amministratore sostituendo l'email ed eseguendo:
--
--   update public.profiles set is_admin = true where email = 'tua@email.it';
-- ---------------------------------------------------------------------
