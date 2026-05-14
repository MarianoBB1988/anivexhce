-- Replica el comportamiento "unrestricted" para analisis.
-- Ejecutar en Supabase SQL Editor.

-- 1. Desactivar RLS para que se comporte como una tabla unrestricted.
alter table if exists public.analisis disable row level security;

-- 2. Asegurar permisos CRUD para el cliente web.
grant select, insert, update, delete on table public.analisis to anon, authenticated;

-- 3. Asegurar uso de secuencias si existieran columnas identity/serial.
do $$
declare
  seq_name text;
begin
  for seq_name in
    select pg_get_serial_sequence(format('%I.%I', table_schema, table_name), column_name)
    from information_schema.columns
    where (table_schema, table_name) = ('public', 'analisis')
      and identity_generation is not null
  loop
    if seq_name is not null then
      execute format('grant usage, select on sequence %s to anon, authenticated', seq_name);
    end if;
  end loop;
end $$;