-- Moraleja · Autodiagnóstico — esquema Supabase
-- Ejecutar UNA vez en: Supabase Dashboard → SQL Editor → New query → Run.
--
-- Qué crea:
--   Tabla `resultados`: guarda cada perfil generado, ligado a la usuaria.
--   Políticas RLS: cada usuaria solo ve / crea / borra SUS propios resultados.
--   Al borrar su cuenta de Auth, sus resultados se borran en cascada.
--
-- Requisito previo: en Authentication → Sign In / Up, activar "Email" provider
-- (Magic Link / OTP por email) y registrar como Redirect URL la URL pública del test,
-- ej. https://www.moraleja.co/autodiagnostico-clara-emprendedoras.html

create table if not exists public.resultados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  nombre text default '',
  perfil text not null,
  puntajes jsonb not null,
  consent_version text default '',
  created_at timestamptz not null default now()
);

alter table public.resultados enable row level security;

drop policy if exists "resultados_select_own" on public.resultados;
create policy "resultados_select_own"
  on public.resultados for select
  using (auth.uid() = user_id);

drop policy if exists "resultados_insert_own" on public.resultados;
create policy "resultados_insert_own"
  on public.resultados for insert
  with check (auth.uid() = user_id);

drop policy if exists "resultados_delete_own" on public.resultados;
create policy "resultados_delete_own"
  on public.resultados for delete
  using (auth.uid() = user_id);

create index if not exists resultados_user_created_idx
  on public.resultados (user_id, created_at desc);
