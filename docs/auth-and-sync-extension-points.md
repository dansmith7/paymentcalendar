# Auth and Sync Extension Points

## Auth (mock -> magic link)

- `lib/auth/session.ts`
  - Main switch point via `AUTH_MODE`.
  - `AUTH_MODE=mock` -> `MockAuthProvider`
  - `AUTH_MODE=supabase` -> `SupabaseAuthProvider`

- `lib/auth/providers/mock-provider.ts`
  - Dev stub for current user/role.

- `lib/auth/providers/supabase-provider.ts`
  - Reads Supabase session and resolves `profiles` data.
  - This is the place to finalize magic-link behavior.

- `lib/auth/guards.ts`
  - Route protection entry point at page/layout level (`requireRole`).

- `middleware.ts` + `lib/auth/middleware.ts`
  - Prepared path-level auth guard hook for `/employee/*` and `/manager/*`.
  - Currently pass-through, ready for strict session checks.

## Current user/profile loading

- `lib/services/requests-service.ts`
  - `getCurrentProfile()` is central and already abstracted from UI.
  - In mock mode it resolves/creates test profile mapping.
  - In Supabase mode it uses provider session.

## Google Sheets future integration

- `lib/services/sheets-sync-service.ts`
  - `exportRequest()` (push to Sheets)
  - `importStatusUpdates()` (pull from Sheets)
  - Current implementation is `NoopSheetsSyncService`.

- `lib/services/requests-service.ts`
  - Request lifecycle marks `sync_status = 'pending'` on create/update.
  - Intended integration point for triggering export queue/job.

## Data model prepared for sync

- Migration: `supabase/migrations/20260409150000_payment_requests_sync_columns.sql`
  - `sync_status` (`pending|synced|failed`)
  - `external_id`
  - `last_synced_at`

