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
    └── migrations/0001_init.sql   # schema + RLS + funciones de invitación
```

## 1. Base de datos (Supabase)

La migración todavía **no fue aplicada** (el sandbox de este asistente bloquea comandos de deploy contra producción). Para aplicarla:

1. Entrá al [SQL Editor de tu proyecto Supabase](https://supabase.com/dashboard/project/cnorswwbdzkfuwkutytc/sql/new).
2. Pegá el contenido de [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) y ejecutalo.

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
- Cartas (crear y ver)
- Notitas (crear, ver, sacar)

Módulos marcados "Loopy todavía está tejiendo esto" (pendientes de Fase 2/3 según el roadmap del documento): Estados avanzados, Música, Pelis y series, Links, Calendario de eventos, Calendario de comidas, Ideas.

## Seguridad

- `SUPABASE_SERVICE_ROLE_KEY` vive solo en `server/.env` (gitignored). Nunca debe llegar al client ni al repo.
- Todo el acceso a datos desde el client pasa por Supabase Auth + RLS (`is_space_member`), no por el server.
