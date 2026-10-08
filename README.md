# Rediseño Loopy — pastel esponjoso

Reemplaza los archivos del cliente desde la raíz del repo.

## Instalar

```bash
# desde la raíz de loopy/
cp -R loopy-redesign/client/. client/
cd client
npm install        # instala @phosphor-icons/react (ya agregado al package.json)
npm run dev
```

(Si preferís no pisar `package.json`: `npm i @phosphor-icons/react`.)

## Base de datos (nuevo)

Ejecutá, en orden, `supabase/migrations/0005_questions_and_moods.sql` y `0006_estados_v2.sql` en Supabase > SQL Editor > New query. Crea `mood_logs`, `questions` (30 preguntas), `question_answers`, las funciones `has_answered` y `partner_answered`, RLS y realtime. Copiá también ese archivo a `supabase/migrations/` del repo.

## Cartas 2.0 + Push (nuevo)

1. SQL: ejecutá `0007_letters_v2_and_push.sql` (crea el bucket `letter-assets`, columnas de cartas, `push_subscriptions`, `notification_prefs`).
2. Claves VAPID: `npx web-push generate-vapid-keys`.
   - `server/.env`: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (y `CLIENT_ORIGIN` con tu puerto, ej. `http://localhost:5174`).
   - `client/.env`: `VITE_VAPID_PUBLIC_KEY` = la pública.
3. `cd server && npm install` (agrega `web-push`) y reiniciá. `cd client && npm install` si falta algo.
4. Entrá a Ajustes → Notificaciones → activar en cada dispositivo.
   - El push requiere HTTPS en producción (localhost sirve para probar). En iPhone hay que agregar la app a la pantalla de inicio.

## Notitas 2.0 (nuevo)

Ejecutá `supabase/migrations/0008_notes_v2.sql` (después del 0007). Reiniciá el servidor (nuevo aviso push de notitas).

## Historial de notificaciones

Ejecutá `supabase/migrations/0009_notifications.sql` en Supabase → SQL Editor, después de 0008, y desplegá el cliente. La campanita junto al estado muestra el contador de avisos sin leer y el historial paginado. Abrir un aviso lo marca como leído; también se pueden marcar todos. Los avisos nuevos de estados, toques, reacciones, cartas y notitas se guardan mediante triggers aunque la app esté cerrada y sin depender de push o VAPID. Cada usuario solo puede consultar sus propios avisos y actualizar su fecha de lectura. Los eventos anteriores a la migración no se importan.

## Qué cambia

- **Íconos**: sin emojis de sistema. Librería Phosphor (duotone) dentro de "tiles" pastel de color — `components/ui/Icon.tsx`.
- **Estados de ánimo**: ahora `statuses.emoji` guarda una clave (`feliz`, `enamorado`…). Los emojis viejos que ya estén en la base se siguen mostrando como texto, sin migración.
- **Sistema**: `index.css` (tokens, `.card`, `.field`, `.glass`, animaciones), `Button`, `BentoCard`, `PageShell` (Page/PageHeader/EmptyState/IconBtn/Chip/FormCard), `AuthShell`, `Blobs`.
- **Mascota** `LoopyMascot`: lana esponjosa, brillo, parpadeo, 6 expresiones. Misma API.
- **Móvil**: dock flotante inferior con 4 accesos + "Más" (hoja con el resto), logo superior, comidas en tarjetas por día, formularios y botones táctiles de 44px+.
- **Vistas**: Landing, Login, Signup, Onboarding, Invite (x2), Dashboard, Estados, Cartas, Notitas, Música, Pelis, Links, Calendario, Comidas, Ideas, Ajustes.

## Sin cambios

Toda la lógica Supabase, rutas, props y tipos se mantienen. No se tocan `App.tsx`, `AuthContext`, `supabaseClient`, `threadColors` ni `types/db.ts`.

## Notas

- `index.html` debe tener `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- El Dashboard ahora consulta también canción del día, próximo evento, cena de hoy, notitas y pelis pendientes (todo con tablas existentes).
