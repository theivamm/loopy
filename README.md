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

## Música 2.0 (nuevo)

Ejecutá `supabase/migrations/0009_music_v2.sql` (después del 0008) y reiniciá el servidor.

## Pelis, Links, Calendario, Comidas e Ideas 2.0 (nuevo)

Ejecutá `supabase/migrations/0010_planear_v2.sql` (después del 0009). Para el buscador de pelis poné `TMDB_API_KEY` en `server/.env` (gratis en themoviedb.org). Reiniciá el servidor.

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

## App de Android (nuevo)

`client/android/` es un proyecto de Capacitor que **no empaqueta el sitio** — abre un WebView apuntando en vivo a `https://loopy-pi.vercel.app` (configurado en `client/capacitor.config.ts`, campo `server.url`). Ventaja: cualquier cambio que subís a Vercel se ve en la app sin recompilar ni repasar por la Play Store. Desventaja: necesita internet siempre, no funciona offline.

### Requisitos (en tu máquina, no en este sandbox)

- [Android Studio](https://developer.android.com/studio) instalado (trae el Android SDK y Gradle).
- Java no hace falta instalarlo aparte, Android Studio lo incluye.

### Probarla

```bash
cd client
npx cap open android
```

Eso abre el proyecto en Android Studio. Desde ahí: **Run ▶** con un emulador o el celular conectado por USB (con "Depuración USB" activada).

### Si cambiás `capacitor.config.ts` (por ejemplo la URL del servidor)

```bash
cd client
npx cap sync android
```

### Ícono y splash

Están generados a partir de `client/resources/` (`icon.png`, `icon-foreground.png`, `icon-background.png`, `splash.png` — el mascota Loopy). Si querés regenerarlos después de cambiar alguno de esos archivos:

```bash
cd client
npx capacitor-assets generate --android
```

(Instalá `@capacitor/assets` como dev dependency primero: `npm i -D @capacitor/assets`. Se puede desinstalar después de generar, no hace falta en runtime.)

### Para publicarla en la Play Store

Hace falta:
1. Cuenta de Google Play Developer (pago único de USD 25).
2. Generar un **keystore** de firma (`keytool -genkeypair ...` o desde Android Studio: Build → Generate Signed Bundle/APK) y guardarlo en un lugar seguro — **nunca lo subas al repo**, si lo perdés no podés actualizar la app nunca más con ese mismo `appId`.
3. Build → Generate Signed Bundle (`.aab`) desde Android Studio y subirlo a la consola de Play.

Como la app apunta a la URL en vivo, una vez publicada no hace falta volver a subir una versión nueva por cada cambio de UI — solo si cambiás algo nativo (ícono, nombre, permisos, plugins de Capacitor).
