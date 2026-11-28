# Лото онлайн

MVP корпоративной веб-игры в русское лото (issue #1).

## Стек

- Next.js 15 (App Router) + TypeScript + Tailwind
- Supabase (Postgres, Auth OTP, Realtime)
- Деплой: Vercel

## Быстрый старт

1. Создайте проект Supabase и примените миграции из `supabase/migrations/` **по порядку** (MVP + `20251128100000_loto_grants.sql` — иначе на hosted Postgres возможен `permission denied for table sessions`).
2. Скопируйте `.env.example` → `.env.local` и заполните переменные (см. Integrations в Operum Desktop).
3. `npm install && npm run dev`

### Vercel / Supabase keys

| Dashboard (Supabase) | Переменная в Vercel |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| **Publishable** key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **Secret** key | `SUPABASE_SERVICE_ROLE_KEY` (только сервер) |

Поддерживаются и новые ключи (`sb_publishable_*` / `sb_secret_*`), и legacy JWT — важно не перепутать secret с publishable. Создание сессии идёт через `createAdminClient()` (service role).

## Пилот

- До **2** карточек на игрока (`PILOT_MAX_CARDS_PER_PLAYER` в коде).
- Ведущий: `/` → «Создать сессию» → `/host/{token}`.
- Игроки: `/play/{slug}` (QR на панели ведущего).

## CI

Первый слайс: **ci:cheap** — lint + typecheck после `npm install` (см. workflow).

## Логотип

Placeholder SVG в `public/brand/`. Замените на финальные PNG из макетов основателя (синий/белый знак), сохранив имена файлов.

## Фаза 2

Email PDF, откат бочонков, Excel, админка — вне этого MVP.