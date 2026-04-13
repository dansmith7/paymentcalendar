## Платежный календарь (MVP)

MVP на Next.js + Supabase: заявки на оплату, роли сотрудник/руководитель/админ, аналитика по неделям, подготовка под Supabase Auth и синхронизацию с Google Sheets.

## Быстрый старт

1. Установите зависимости:

```bash
npm install
```

2. Скопируйте env:

```bash
cp .env.example .env.local
```

3. Заполните `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_MODE` (`mock` или `supabase`)
- при `AUTH_MODE=supabase`: опционально `NEXT_PUBLIC_SITE_URL` (точный URL для ссылок magic link; иначе берётся из заголовков запроса)

4. Примените SQL-миграции в Supabase SQL Editor (в хронологическом порядке из `supabase/migrations/`), в том числе:
- `20260408120000_init.sql`
- далее по цепочке до актуальных файлов, например `20260413120000_payment_requests_applicant_email.sql` (колонка `applicant_email` у заявок).

5. Запустите проект:

```bash
npm run dev
```

Откройте `http://127.0.0.1:3000`.

## Режимы авторизации

### Mock auth (по умолчанию)

- Установите `AUTH_MODE=mock`.
- Переключение ролей (`employee/manager`) доступно в сайдбаре.
- В dev используется service role client для серверных операций, чтобы mock-пользователь мог проходить через RLS-ограничения.

### Real auth (Supabase)

- Установите `AUTH_MODE=supabase`.
- Включите **Email** (magic link) в Supabase → Authentication → Providers.
- В **URL configuration** добавьте redirect: `http://127.0.0.1:3000/auth/callback` (и боевой URL `/auth/callback` на хостинге).
- Вход в приложении: страница **`/login`** (email → письмо со ссылкой → callback → сессия). Кнопка **«Выйти»** в шапке.
- После регистрации триггер в миграции `20260414100000_profiles_on_auth_user_created.sql` создаёт строку в **`profiles`** с ролью **`employee`**; роль **manager** задаётся вручную в таблице `profiles`.
- Точки кода: `lib/auth/providers/supabase-provider.ts`, `lib/auth/session.ts`, `lib/auth/guards.ts`, `middleware.ts`, `lib/supabase/middleware.ts`, `app/auth/callback/route.ts`.

## Что реализовано в MVP

- Employee:
  - создание заявки (сумма с разрядами через пробел, пустое поле при нуле)
  - список своих заявок с фильтрами/сортировкой/недельным фильтром
  - редактирование своей заявки
  - запрет редактирования оплаченной заявки
- Manager:
  - просмотр всех заявок (поиск, недели по желаемой/критичной дате)
  - действия руководителя по статусу, оплате, плановой дате, группе финучёта
  - аналитика по неделям
- Технически:
  - service/repository слои
  - серверная валидация
  - loading/empty/error состояния
  - sync-ready поля: `sync_status`, `external_id`, `last_synced_at`

## Расширение под Google Sheets

Подготовленные точки интеграции:
- `lib/services/sheets-sync-service.ts`
- `lib/services/requests-service.ts` (заявка помечается `sync_status='pending'` при create/update)
- миграция с sync-колонками уже добавлена.

## Документация по точкам замены

Подробно по auth/sync extension points:
- `docs/auth-and-sync-extension-points.md`
