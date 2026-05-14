-- Replica el comportamiento "unrestricted" de consultas para imagenologias
-- y documentos. Ejecutar en Supabase SQL Editor.

-- 1. Desactivar RLS para que se comporten como una tabla unrestricted.
alter table if exists public.imagenologias disable row level security;
alter table if exists public.documentos disable row level security;

-- 2. Asegurar permisos CRUD para el cliente web.
grant select, insert, update, delete on table public.imagenologias to anon, authenticated;
grant select, insert, update, delete on table public.documentos to anon, authenticated;

-- 3. Asegurar uso de secuencias si existieran columnas identity/serial.
do $$
declare
  seq_name text;
begin
  for seq_name in
    select pg_get_serial_sequence(format('%I.%I', table_schema, table_name), column_name)
    from information_schema.columns
    where (table_schema, table_name) in (('public', 'imagenologias'), ('public', 'documentos'))
      and identity_generation is not null
  loop
    if seq_name is not null then
      execute format('grant usage, select on sequence %s to anon, authenticated', seq_name);
    end if;
  end loop;
end $$;