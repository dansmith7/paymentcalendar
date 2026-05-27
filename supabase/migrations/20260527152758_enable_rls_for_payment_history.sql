-- Закрываем таблицы истории оплат и аудита через RLS.
-- Миграция additive/idempotent: данные не удаляет и таблицы не пересоздаёт.

create or replace function public.profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role::text
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

alter table public.payment_request_payments enable row level security;
alter table public.payment_request_audit enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'payment_request_payments'
      and policyname = 'payment_request_payments_select_related'
  ) then
    create policy payment_request_payments_select_related
      on public.payment_request_payments
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.payment_requests r
          where r.id = payment_request_payments.request_id
            and r.deleted_at is null
            and (
              r.applicant_id = auth.uid()
              or public.profile_role() in ('manager', 'admin')
            )
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'payment_request_payments'
      and policyname = 'payment_request_payments_insert_manager'
  ) then
    create policy payment_request_payments_insert_manager
      on public.payment_request_payments
      for insert
      to authenticated
      with check (
        public.profile_role() in ('manager', 'admin')
        and exists (
          select 1
          from public.payment_requests r
          where r.id = payment_request_payments.request_id
            and r.deleted_at is null
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'payment_request_payments'
      and policyname = 'payment_request_payments_update_manager'
  ) then
    create policy payment_request_payments_update_manager
      on public.payment_request_payments
      for update
      to authenticated
      using (public.profile_role() in ('manager', 'admin'))
      with check (public.profile_role() in ('manager', 'admin'));
  end if;
end $$;
