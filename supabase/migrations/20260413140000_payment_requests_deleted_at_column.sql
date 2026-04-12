-- Только колонка для мягкого удаления (без триггеров). После применения можно снова
-- добавить в lib/repositories/requests-repository.ts фильтр .is("deleted_at", null).
alter table public.payment_requests
  add column if not exists deleted_at timestamptz;

comment on column public.payment_requests.deleted_at is
  'Если задано — заявка скрыта из выборок; полная политика см. 20260413100000_payment_requests_safety.sql';
