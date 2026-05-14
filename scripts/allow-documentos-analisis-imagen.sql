-- Permite adjuntar documentos a analisis e imagenes.
-- Ejecutar una vez en Supabase SQL Editor.

do $$
declare
  current_constraint text;
begin
  -- Si tipo_entidad fuese enum, convertirlo a text para poder ampliar valores.
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'documentos'
      and column_name = 'tipo_entidad'
      and data_type = 'USER-DEFINED'
  ) then
    execute 'alter table public.documentos alter column tipo_entidad type text using tipo_entidad::text';
  end if;

  -- Eliminar constraints de check previos sobre tipo_entidad, si existen.
  for current_constraint in
    select tc.constraint_name
    from information_schema.table_constraints tc
    join information_schema.check_constraints cc
      on cc.constraint_name = tc.constraint_name
     and cc.constraint_schema = tc.constraint_schema
    where tc.table_schema = 'public'
      and tc.table_name = 'documentos'
      and tc.constraint_type = 'CHECK'
      and cc.check_clause ilike '%tipo_entidad%'
  loop
    execute format('alter table public.documentos drop constraint if exists %I', current_constraint);
  end loop;

  -- Eliminar FKs viejas sobre id_entidad. Una tabla genérica de documentos
  -- no puede mantener una FK simple contra consultas/cirugias y aceptar
  -- también IDs de analisis/imagenes.
  for current_constraint in
    select tc.constraint_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on kcu.constraint_name = tc.constraint_name
     and kcu.constraint_schema = tc.constraint_schema
    where tc.table_schema = 'public'
      and tc.table_name = 'documentos'
      and tc.constraint_type = 'FOREIGN KEY'
      and kcu.column_name = 'id_entidad'
  loop
    execute format('alter table public.documentos drop constraint if exists %I', current_constraint);
  end loop;

  alter table public.documentos
    add constraint documentos_tipo_entidad_check
    check (tipo_entidad in ('consulta', 'cirugia', 'analisis', 'imagen'));

  create index if not exists documentos_tipo_entidad_id_entidad_idx
    on public.documentos (tipo_entidad, id_entidad);

  create index if not exists documentos_id_clinica_idx
    on public.documentos (id_clinica);
end $$;