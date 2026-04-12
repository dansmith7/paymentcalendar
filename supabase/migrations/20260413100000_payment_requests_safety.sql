-- Мягкое скрытие, запрет физического удаления и журнал изменений заявок.

-- 1. Архивация (мягкое «удаление»): не показываем в приложении, пока deleted_at IS NULL
alter table public.payment_requests
  add column if not exists deleted_at timestamptz;

comment on column public.payment_requests.deleted_at is
  'Если задано — заявка скрыта из выборок приложения (без физического удаления).';

-- 2. Запрет DELETE на уровне БД
create or replace function public.prevent_payment_requests_delete()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  raise exception 'Удаление заявок из payment_requests запрещено. Используйте deleted_at для скрытия.';
end;
$$;

drop trigger if exists trg_payment_requests_block_delete on public.payment_requests;

create trigger trg_payment_requests_block_delete
  before delete on public.payment_requests
  for each row
  execute function public.prevent_payment_requests_delete();

-- 3. Журнал вставок и обновлений
create table if not exists public.payment_request_audit (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  changed_at timestamptz not null default now(),
  op text not null check (op in ('insert', 'update')),
  old_record jsonb,
  new_record jsonb not null
);

create index if not exists idx_payment_request_audit_request_id
  on public.payment_request_audit (request_id);

create index if not exists idx_payment_request_audit_changed_at
  on public.payment_request_audit (changed_at desc);

comment on table public.payment_request_audit is
  'История изменений заявок (снимок строки после insert/update).';

create or replace function public.log_payment_request_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.payment_request_audit (request_id, op, old_record, new_record)
    values (
      new.id,
      'insert',
      null,
      row_to_json(new)::jsonb
    );
  elsif tg_op = 'UPDATE' then
    insert into public.payment_request_audit (request_id, op, old_record, new_record)
    values (
      new.id,
      'update',
      row_to_json(old)::jsonb,
      row_to_json(new)::jsonb
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_payment_request_audit_iu on public.payment_requests;

create trigger trg_payment_request_audit_iu
  after insert or update on public.payment_requests
  for each row
  execute function public.log_payment_request_audit();
