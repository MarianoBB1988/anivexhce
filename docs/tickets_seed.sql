-- =====================================================
-- DATOS DE EJEMPLO: Reportes de errores/tickets
-- =====================================================
-- NOTA: Los user_id se resuelven desde auth.users (supabase_auth)
--       que es donde realmente está el email.
-- =====================================================

-- 1. Reporte sobre "Analizar imagen con IA" (no funciona)
INSERT INTO tickets (user_id, title, description, status, priority, browser_info, app_version, page_url, created_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'mariano@anivex.com' LIMIT 1),
  'Analizar imagen con IA no funciona',
  'Al intentar usar la función de "Diagnóstico de imágenes" para analizar una radiografía de un perro, la IA no procesa la imagen. Se queda cargando infinitamente y nunca devuelve un resultado. Probé con imágenes PNG y JPG, en distintos navegadores, pero el problema persiste.

Pasos para reproducir:
1. Ir a Dashboard > Diagnóstico de imágenes
2. Seleccionar una mascota
3. Subir una imagen (radiografía)
4. Click en "Analizar"
5. El spinner de carga aparece pero nunca termina

Resultado esperado:
- La IA debería analizar la imagen y devolver un diagnóstico.

Resultado actual:
- Se queda cargando para siempre.
- En consola muestra error 500 (Internal Server Error)',
  'open',
  'high',
  '{"userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36", "os": "Linux", "browser": "Chrome 125"}',
  '1.2.0',
  '/dashboard/image-diagnostic',
  now() - interval '2 hours'
);

-- 2. Reporte sobre error al guardar consulta médica
INSERT INTO tickets (user_id, title, description, status, priority, browser_info, app_version, page_url, created_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'emanuele@anivex.com' LIMIT 1),
  'Error al guardar consulta médica - se pierden los datos',
  'Al completar una consulta médica y presionar "Guardar", a veces los datos no se persisten y se pierde toda la información ingresada. Parece ocurrir de forma intermitente cuando la descripción es muy larga.

Pasos:
1. Ir a Consultas
2. Crear nueva consulta
3. Llenar todos los campos
4. Guardar
5. La página se recarga pero la consulta no aparece en el listado',
  'in_progress',
  'medium',
  '{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36", "os": "macOS", "browser": "Chrome 125"}',
  '1.2.0',
  '/dashboard/consultations',
  now() - interval '1 day'
);

-- 3. Sugerencia: Mejorar diseño responsive en móvil
INSERT INTO tickets (user_id, title, description, status, priority, browser_info, app_version, page_url, created_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'matias@sanavet.uy' LIMIT 1),
  '[Sugerencia] Mejorar diseño responsive en móvil',
  'La tabla de pacientes en la vista de móvil se ve muy comprimida. Las columnas se superponen y es difícil leer los datos. Sugiero implementar un modo "card view" para móviles como tienen otras apps veterinarias.

También el menú lateral en móvil tapa demasiado contenido al abrirlo.',
  'resolved',
  'low',
  '{"userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148", "os": "iOS", "browser": "Safari"}',
  '1.1.0',
  '/dashboard/pets',
  now() - interval '3 days'
);

-- 4. Error al filtrar por fecha en Consultas
INSERT INTO tickets (user_id, title, description, status, priority, browser_info, app_version, page_url, created_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'mariano@anivex.com' LIMIT 1),
  'Filtro por fecha en consultas no funciona correctamente',
  'Cuando intento filtrar consultas por un rango de fechas, el filtro no respeta la fecha fin y muestra consultas de días posteriores también.

Pasos:
1. Ir a Consultas
2. Seleccionar filtro de fecha: desde 01/05/2026 hasta 15/05/2026
3. El listado muestra consultas del 20/05/2026 también',
  'open',
  'medium',
  '{"userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36", "os": "Linux", "browser": "Chrome 125"}',
  '1.2.0',
  '/dashboard/consultations',
  now() - interval '30 minutes'
);
