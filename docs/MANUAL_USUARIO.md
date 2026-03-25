# Anivex — Manual de Usuario

## Índice

1. [Introducción](#introducción)
2. [Primeros pasos — Inicio de sesión](#primeros-pasos--inicio-de-sesión)
3. [Navegación general](#navegación-general)
4. [Panel de inicio (Dashboard)](#panel-de-inicio-dashboard)
5. [Dueños](#dueños)
6. [Mascotas](#mascotas)
7. [Consultas](#consultas)
8. [Turnos (Citas)](#turnos-citas)
9. [Vacunaciones](#vacunaciones)
10. [Cirugías](#cirugías)
11. [Usuarios de la clínica](#usuarios-de-la-clínica)
12. [Archivos adjuntos (documentos)](#archivos-adjuntos-documentos)
13. [Preferencias: idioma y tema](#preferencias-idioma-y-tema)
14. [Cerrar sesión](#cerrar-sesión)
15. [Preguntas frecuentes](#preguntas-frecuentes)

---

## 1. Introducción

**Anivex** es un sistema de gestión para clínicas veterinarias. Permite llevar el registro completo de dueños, mascotas, consultas clínicas, turnos, vacunaciones y cirugías, todo en un mismo lugar y desde cualquier navegador.

El sistema es seguro y privado: los datos de su clínica nunca son accesibles por otras clínicas.

---

## 2. Primeros pasos — Inicio de sesión

1. Abra el navegador e ingrese a la dirección de Anivex que le indicó su administrador.
2. Ingrese su **correo electrónico** y su **contraseña**.
3. Haga clic en **Iniciar sesión**.

> Si olvidó su contraseña, consulte con el administrador de su clínica para que le genere una nueva.

---

## 3. Navegación general

Una vez dentro del sistema, verá la **barra lateral izquierda** con todos los módulos disponibles:

| Ícono | Módulo |
|---|---|
| 🗂️ LayoutDashboard | Inicio (Dashboard) |
| 👥 Users | Dueños |
| 🐾 PawPrint | Mascotas |
| 🩺 Stethoscope | Consultas |
| 📅 CalendarDays | Turnos |
| 💉 Syringe | Vacunaciones |
| ✂️ Scissors | Cirugías |
| ⚙️ UserCog | Usuarios *(solo administradores)* |

Haga clic en cualquier ítem para navegar al módulo correspondiente.

En dispositivos pequeños, la barra lateral se puede abrir con el botón de menú (☰) en la parte superior.

---

## 4. Panel de inicio (Dashboard)

El dashboard muestra un resumen rápido de la actividad de la clínica:

- **Estadísticas generales** — total de dueños, mascotas registradas, consultas del mes, turnos pendientes.
- **Próximos turnos** — lista de citas programadas para los próximos días.
- **Consultas recientes** — últimas consultas registradas en el sistema.
- **Gráficos** — visualización de actividad por período.

Este panel se actualiza automáticamente al ingresar.

---

## 5. Dueños

### Ver la lista de dueños

Haga clic en **Dueños** en la barra lateral. Verá una tabla con todos los dueños registrados en su clínica.

Puede **buscar** un dueño escribiendo su nombre en el campo de búsqueda.

### Agregar un nuevo dueño

1. Haga clic en el botón **Nuevo dueño**.
2. Complete los campos:
   - **Nombre** *(requerido)*
   - Teléfono
   - Email
   - Dirección
3. Haga clic en **Guardar**.

### Editar un dueño

1. En la tabla, haga clic en el ícono de lápiz (✏️) en la fila del dueño.
2. Modifique los datos necesarios.
3. Haga clic en **Guardar**.

### Eliminar un dueño

1. Haga clic en el ícono de papelera (🗑️) en la fila del dueño.
2. Confirme la eliminación en el diálogo que aparece.

> **Atención:** Antes de eliminar un dueño, asegúrese de que no tenga mascotas asociadas.

---

## 6. Mascotas

### Ver la lista de mascotas

Haga clic en **Mascotas** en la barra lateral.

Puede buscar mascotas por nombre.

### Agregar una mascota

1. Haga clic en **Nueva mascota**.
2. Complete los campos:
   - **Nombre** *(requerido)*
   - Especie (perro, gato, etc.)
   - Raza
   - Fecha de nacimiento
   - Sexo
   - Peso (kg)
   - **Dueño** *(requerido)* — seleccione de la lista
3. Haga clic en **Guardar**.

### Editar o eliminar una mascota

Use los íconos de lápiz o papelera en la fila correspondiente, igual que con dueños.

---

## 7. Consultas

Las consultas representan el **historial clínico** de cada mascota.

### Ver la lista de consultas

Haga clic en **Consultas** en la barra lateral. Se muestra una tabla con todas las consultas, ordenadas por fecha (más reciente primero).

### Registrar una nueva consulta

1. Haga clic en **Nueva consulta**.
2. Complete los campos:
   - **Mascota** *(requerido)* — busque por nombre
   - **Veterinario** *(requerido)*
   - **Fecha** *(requerido)*
   - Motivo de consulta
   - Diagnóstico
   - Tratamiento
   - Observaciones
3. Haga clic en **Guardar**.

### Ver el detalle de una consulta

Haga clic en el ícono de **ojo** (👁️) en la fila de la consulta. Se abrirá un panel lateral con todos los datos de la consulta y los archivos adjuntos asociados (en modo solo lectura).

### Editar una consulta y adjuntar archivos

1. Haga clic en el ícono de **lápiz** (✏️).
2. El diálogo de edición tiene dos pestañas:
   - **Datos** — modifique la información clínica.
   - **Documentos** — adjunte, visualice o elimine archivos (ver sección [Archivos adjuntos](#archivos-adjuntos-documentos)).
3. Guarde los cambios.

### Eliminar una consulta

Haga clic en el ícono de **papelera** (🗑️) y confirme.

> Los archivos adjuntos a la consulta también serán eliminados.

---

## 8. Turnos (Citas)

El módulo de turnos permite agendar y gestionar las citas de la clínica.

### Ver los turnos

Haga clic en **Turnos** en la barra lateral.

Puede ver los turnos en:
- **Vista de lista** — tabla con todos los turnos.
- **Vista de calendario** — distribución visual por día/semana.

También puede filtrar para ver **solo los turnos pendientes** (sin atender).

### Agendar un nuevo turno

1. Haga clic en **Nuevo turno**.
2. Complete:
   - **Mascota** *(requerido)*
   - **Veterinario**
   - **Fecha y hora** *(requerido)*
   - Notas adicionales
3. Haga clic en **Guardar**.

### Cambiar el estado de un turno

Cada turno puede tener uno de los siguientes estados:

| Estado | Significado |
|---|---|
| Sin atender | El turno está programado, aún no fue atendido |
| Atendido | La mascota ya fue atendida |
| Ausente | La mascota no se presentó al turno |

Para cambiar el estado:
1. Haga clic en el ícono de **lápiz** (✏️) en el turno.
2. Cambie el campo **Estado**.
3. Guarde.

### Eliminar un turno

Haga clic en el ícono de **papelera** (🗑️) y confirme.

---

## 9. Vacunaciones

Registre el historial de vacunación de cada mascota y lleve control de las próximas dosis.

### Ver vacunaciones

Haga clic en **Vacunaciones** en la barra lateral.

### Registrar una vacunación

1. Haga clic en **Nueva vacunación**.
2. Complete:
   - **Mascota** *(requerido)*
   - **Tipo de vacuna** *(requerido)* — seleccione de la lista
   - **Fecha de aplicación** *(requerido)*
   - Fecha de próxima dosis
3. Haga clic en **Guardar**.

### Editar o eliminar un registro de vacuna

Use los íconos de lápiz o papelera en la fila correspondiente.

---

## 10. Cirugías

El módulo de cirugías permite gestionar los procedimientos quirúrgicos con seguimiento de estado.

### Ver la lista de cirugías

Haga clic en **Cirugías** en la barra lateral.

### Registrar una nueva cirugía

1. Haga clic en **Nueva cirugía**.
2. Complete:
   - **Mascota** *(requerido)*
   - **Veterinario/Cirujano** *(requerido)*
   - **Fecha** *(requerido)*
   - Tipo de cirugía
   - Descripción del procedimiento
   - Resultado
3. Puede adjuntar archivos (protocolos, imágenes, consentimientos) desde la pestaña **Documentos** si edita el registro luego de crearlo.
4. Haga clic en **Guardar**.

### Ver el detalle de una cirugía

Haga clic en el ícono de **ojo** (👁️). Se desplegará un panel lateral con todos los datos y los archivos adjuntos.

### Cambiar el estado de una cirugía (acceso rápido)

Para actualizar el estado sin abrir el formulario completo:

1. Haga clic en el ícono de **estado** (generalmente un ícono de actualización o semáforo) en la fila.
2. Haga clic en uno de los cuatro botones de estado:

| Estado | Color | Significado |
|---|---|---|
| Programado | Azul | La cirugía está calendarizada |
| En progreso | Amarillo/Naranja | La cirugía está siendo realizada |
| Exitosa | Verde | La cirugía finalizó exitosamente |
| Complicaciones | Rojo | Surgieron complicaciones |

3. El estado se actualiza de inmediato.

### Editar una cirugía y adjuntar archivos

1. Haga clic en el ícono de **lápiz** (✏️).
2. Use la pestaña **Datos** para modificar la información clínica.
3. Use la pestaña **Documentos** para gestionar archivos adjuntos.
4. Guarde los cambios.

---

## 11. Usuarios de la clínica

> Esta sección está disponible solo para usuarios con rol **Administrador**.

### Ver usuarios

Haga clic en **Usuarios** en la barra lateral.

### Agregar un usuario

1. Haga clic en **Nuevo usuario**.
2. Complete nombre, email y rol (`admin`, `veterinario`, `asistente`).
3. Guarde.

El usuario recibirá sus credenciales de acceso por correo electrónico (si la función de envío de emails está habilitada en Supabase).

### Editar o eliminar un usuario

Use los íconos correspondientes en la tabla.

---

## 12. Archivos adjuntos (documentos)

Puede adjuntar archivos (PDFs, imágenes, documentos Word, etc.) a **consultas** y **cirugías**.

### Abrir el panel de documentos

1. Edite una consulta o cirugía (ícono de lápiz).
2. Haga clic en la pestaña **Documentos**.

### Subir un archivo

1. Haga clic en **Adjuntar archivo** (o el botón de carga).
2. Seleccione el archivo desde su computadora.
3. El archivo se sube automáticamente y aparece en la lista.

> No hay límite de archivos por consulta o cirugía.

### Ver/abrir un archivo

1. Haga clic en el ícono de **abrir** (📄 o enlace) junto al archivo.
2. El archivo se abrirá en una nueva pestaña del navegador.

> Los enlaces son seguros y tienen una validez de **1 hora**. Si el enlace expira, simplemente vuelva a abrirlo desde el sistema.

### Eliminar un archivo

1. Haga clic en el ícono de **papelera** (🗑️) junto al archivo.
2. Confirme la eliminación.

> Los archivos eliminados no pueden recuperarse.

---

## 13. Preferencias: idioma y tema

### Cambiar el idioma

En la parte superior de la pantalla (o en la barra lateral) encontrará el selector de idioma:
- **ES** → Español
- **EN** → Inglés

El idioma seleccionado se guarda automáticamente y se recuerda en su próxima visita.

### Cambiar el tema visual

En la parte superior encontrará el botón de tema (ícono de sol / luna):
- **Claro** — fondo blanco, texto oscuro
- **Oscuro** — fondo oscuro, texto claro
- **Sistema** — se adapta automáticamente a la preferencia de su dispositivo

---

## 14. Cerrar sesión

Para cerrar sesión de forma segura:

1. En la barra lateral, desplácese hasta la parte inferior.
2. Haga clic en **Cerrar sesión** (ícono de salida).
3. Será redirigido automáticamente a la pantalla de inicio de sesión.

> Siempre cierre sesión cuando utilice un equipo compartido.

---

## 15. Preguntas frecuentes

**¿Puedo usar Anivex desde mi celular?**
Sí. El sistema es responsivo y funciona en navegadores móviles. Para mejor experiencia, use Chrome o Safari en su versión actualizada.

**¿Los datos de mi clínica son privados?**
Sí. Cada clínica tiene sus propios datos completamente aislados. Ningún usuario de otra clínica puede ver su información.

**¿Se pueden recuperar registros eliminados?**
No. Las eliminaciones son permanentes. Se recomienda archivar registros en lugar de eliminarlos cuando sea posible.

**¿Por qué no puedo ver el módulo de Usuarios?**
El módulo de Usuarios está disponible solo para el rol **Administrador**. Si necesita acceso, contacte a su administrador.

**Un archivo adjunto ya no abre, ¿qué hago?**
Los enlaces a archivos tienen una validez de 1 hora. Simplemente cierre y vuelva a abrir el detalle de la consulta o cirugía para obtener un enlace nuevo.

**Olvidé mi contraseña, ¿qué hago?**
Contacte al administrador de su clínica para que restablezca su contraseña desde el módulo de Usuarios.

**¿Puedo exportar los datos?**
Por el momento, la exportación de datos no está disponible desde la interfaz. Consulte con su administrador para solicitudes de exportación.
