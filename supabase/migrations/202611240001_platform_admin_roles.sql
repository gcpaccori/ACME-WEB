-- ============================================================
-- Roles de plataforma para crear usuarios admin desde la web
-- ============================================================
-- Que hace (se puede correr varias veces sin romper nada):
--   1. Crea los roles 'admin' y 'super_admin' en public.roles si no existen.
--   2. Si public.roles tiene RLS, deja que cualquier usuario logueado los lea
--      (la pantalla "Usuarios" necesita leerlos para mostrar la casilla).
-- Donde correrlo: Supabase de ACME > SQL Editor > pegar y Run.
-- ============================================================

do $$
declare
  v_code_type text;
  v_name_type text;
  v_code text;
  v_name text;
begin
  select format_type(a.atttypid, a.atttypmod) into v_code_type
  from pg_attribute a
  where a.attrelid = 'public.roles'::regclass and a.attname = 'code' and not a.attisdropped;

  select format_type(a.atttypid, a.atttypmod) into v_name_type
  from pg_attribute a
  where a.attrelid = 'public.roles'::regclass and a.attname = 'name' and not a.attisdropped;

  foreach v_code in array array['admin', 'super_admin'] loop
    v_name := case v_code when 'admin' then 'Administrador' else 'Super administrador' end;
    execute format(
      'insert into public.roles (code, name)
       select %L::%s, %L::%s
       where not exists (select 1 from public.roles where code::text = %L)',
      v_code, v_code_type, v_name, coalesce(v_name_type, 'text'), v_code
    );
  end loop;
end $$;

-- Lectura de roles para usuarios logueados (solo si la tabla tiene RLS).
do $$
begin
  if exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'roles' and c.relrowsecurity
  ) and not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'roles' and cmd in ('SELECT', 'ALL')
  ) then
    execute 'create policy roles_authenticated_select on public.roles for select to authenticated using (true)';
  end if;
end $$;

-- Comprobacion: deben salir las dos filas.
select id, code, name from public.roles where code::text in ('admin', 'super_admin');
