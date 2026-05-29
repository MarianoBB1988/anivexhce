-- =====================================================
-- TICKETS / REPORTES DE ERRORES
-- Migración completa: tabla, índices, RLS policies
-- =====================================================

-- 1. Crear tabla tickets
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  admin_response TEXT,
  browser_info TEXT,
  app_version TEXT,
  page_url TEXT
);

-- 2. Comentarios de tabla y columnas
COMMENT ON TABLE tickets IS 'Reportes de errores/tickets de usuarios';
COMMENT ON COLUMN tickets.status IS 'open, in_progress, resolved, closed';
COMMENT ON COLUMN tickets.priority IS 'low, medium, high';

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_updated_at ON tickets(updated_at DESC);

-- 4. Habilitar Row Level Security
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- 5. Policy: Usuarios autenticados pueden CREAR tickets (solo ellos mismos)
CREATE POLICY "Usuarios pueden crear sus propios tickets"
  ON tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

-- 6. Policy: Usuarios pueden VER solo sus propios tickets
CREATE POLICY "Usuarios pueden ver sus propios tickets"
  ON tickets
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
  );

-- 7. Policy: Admins pueden VER todos los tickets
CREATE POLICY "Admins pueden ver todos los tickets"
  ON tickets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol = 'admin'
    )
  );

-- 8. Policy: Admins pueden ACTUALIZAR cualquier ticket (status, response)
CREATE POLICY "Admins pueden actualizar tickets"
  ON tickets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol = 'admin'
    )
  );

-- 9. (Opcional) Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_updated_at_trigger
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_tickets_updated_at();
