# Loopy

Two lives, one loop. El rincón privado y compartido para parejas: estados, cartas, música, pelis, notitas, calendario y más.

Ver [`loopy.md`](./loopy.md) para el documento de producto y diseño completo.

## Stack

- **Client:** React + Vite + TypeScript + Tailwind CSS v4 + React Router
- **Server:** Node.js + Express + TypeScript
- **DB/Auth:** Supabase (Postgres + Auth + RLS)

## Estructura

```
loopy/
├── client/      # app React (landing, auth, dashboard bento)
├── server/      # API Node/Express (link previews, futuras integraciones)
└── supabase/
    └── migrations/
        ├── 0001_tables.sql     # todas las tablas
        ├── 0002_functions.sql  # triggers + RPCs (create_space, create_invitation, accept_invitation)
        └── 0003_policies.sql   # RLS, al final para poder referenciar cualquier tabla/función
```

## 1. Base de datos (Supabase)

La migración todavía **no fue aplicada** (el sandbox de este asistente bloquea comandos de deploy contra producción). Aplicala en 3 pasos, en orden, cada uno como una query nueva:

1. Entrá a **Database → SQL Editor → New query** en tu [proyecto Supabase](https://supabase.com/dashboard/project/cnorswwbdzkfuwkutytc/sql/new) (no uses el asistente de IA del dashboard, puede alterar el SQL al pegarlo).
2. Pegá y ejecutá [`0001_tables.sql`](./supabase/migrations/0001_tables.sql).
3. En una query nueva, pegá y ejecutá [`0002_functions.sql`](./supabase/migrations/0002_functions.sql).
4. En otra query nueva, pegá y ejecutá [`0003_policies.sql`](./supabase/migrations/0003_policies.sql).

Si algo falla, revisá en qué paso fue: cada archivo es independiente, así que podés arreglar y re-ejecutar solo ese paso sin tocar los anteriores.

Esto crea:
- `profiles`, `couple_spaces`, `memberships`, `invitations`
- tablas de contenido: `statuses`, `letters`, `songs`, `movies`, `links`, `events`, `recipes`, `meals`, `ideas`, `notes`, `memories`
- Row Level Security en todo, restringido por `space_id`/membership
- funciones RPC: `create_space`, `create_invitation`, `accept_invitation`

## 2. Client

```bash
cd client
npm install
npm run dev
```

Variables de entorno (`client/.env`, ya configurado con las keys que diste):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...   # clave pública/anon, segura para el browser
VITE_API_URL=http://localhost:4000
```

## 3. Server

```bash
cd server
npm install
npm run dev
```

Variables de entorno (`server/.env`, ya configurado):

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...   # clave secreta — solo en el server, nunca en el client
TMDB_API_KEY=                    # completar cuando se integre el módulo de pelis
```

## Estado actual (MVP)

Implementado y funcional contra Supabase:
- Registro / login (email + password)
- Onboarding: apodo, color de hilo, nombre del espacio, aniversario
- Invitación de pareja (link + código de 6 dígitos, vence en 7 días) y animación de "nace Loopy"
- Dashboard en bento con estado de la pareja, "Pensando en vos", contador de días juntos
- Estados: emoji, disponibilidad, actividad y mensaje, con el estado de tu pareja en vivo
- Cartas (crear y ver)
- Notitas (crear, ver, sacar)
- Música: playlist compartida + "canción del día"
- Pelis y series: lista por ver/viendo/vista + ruleta "¿Qué vemos hoy?"
- Links: guardar con preview automático (vía el endpoint del server) + categorías + marcar como hecho
- Calendario de eventos: agendar y ver el próximo evento con cuenta regresiva
- Calendario de comidas: grilla semanal (desayuno/almuerzo/cena), crea la receta al vuelo por nombre
- Ideas: agregar, votar, marcar como privada

Pendiente (Fase 3+ del roadmap): línea de tiempo/recuerdos, pregunta del día, cápsula del tiempo, Loopy que crece, integración real con TMDB/Spotify.

## Seguridad

- `SUPABASE_SERVICE_ROLE_KEY` vive solo en `server/.env` (gitignored). Nunca debe llegar al client ni al repo.
- Todo el acceso a datos desde el client pasa por Supabase Auth + RLS (`is_space_member`), no por el server.
