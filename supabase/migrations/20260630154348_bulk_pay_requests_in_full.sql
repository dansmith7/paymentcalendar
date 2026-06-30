-- Массовая полная оплата заявок одним серверным вызовом.
-- Без удаления данных: только функция для атомарного insert/update.

create or replace function public.pay_payment_requests_in_full(
  request_ids uuid[],
  paid_on date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
  updated_count integer := 0;
begin
  if request_ids is null or cardinality(request_ids) = 0 then
    raise exception 'Выберите заявки для оплаты.';
  end if;

  select p.role::text
  into actor_role
  from public.profiles p
  where p.id = actor_id
  limit 1;

  if actor_role not in ('manager', 'admin') then
    raise exception 'Недостаточно прав';
  end if;

  with unique_ids as (
    select distinct unnest(request_ids) as id
  ),
  active_payment_totals as (
    select
      p.request_id,
      coalesce(sum(p.amount_rub), 0)::numeric(14, 2) as active_paid
    from public.payment_request_payments p
    where p.canceled_at is null
      and p.request_id in (select id from unique_ids)
    group by p.request_id
  ),
  selected_requests as (
    select
      r.id,
      r.amount_rub,
      greatest(
        coalesce(t.active_paid, 0),
        case
          when r.is_paid or r.status in ('paid', 'partially_paid')
            then coalesce(r.paid_amount_rub, r.amount_rub)
          else 0
        end
      )::numeric(14, 2) as paid_before
    from public.payment_requests r
    left join active_payment_totals t on t.request_id = r.id
    where r.id in (select id from unique_ids)
      and r.deleted_at is null
      and r.status <> 'rejected'
    for update of r
  ),
  payable_requests as (
    select
      id,
      amount_rub,
      paid_before,
      greatest(0, amount_rub - paid_before)::numeric(14, 2) as remaining
    from selected_requests
    where greatest(0, amount_rub - paid_before) > 0
  ),
  inserted_payments as (
    insert into public.payment_request_payments (
      request_id,
      paid_at,
      amount_rub,
      note,
      created_by
    )
    select
      id,
      paid_on,
      remaining,
      'Полная оплата выбранных заявок',
      actor_id
    from payable_requests
    returning request_id
  ),
  updated_requests as (
    update public.payment_requests r
    set
      paid_at = paid_on,
      paid_amount_rub = r.amount_rub,
      is_paid = true,
      status = 'paid',
      updated_at = now()
    where r.id in (select request_id from inserted_payments)
    returning r.id
  )
  select count(*)
  into updated_count
  from updated_requests;

  return updated_count;
end;
$$;

revoke all on function public.pay_payment_requests_in_full(uuid[], date) from public;
revoke all on function public.pay_payment_requests_in_full(uuid[], date) from anon;
grant execute on function public.pay_payment_requests_in_full(uuid[], date) to authenticated;
