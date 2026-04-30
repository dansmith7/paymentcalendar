alter table public.payment_request_payments
  add column if not exists canceled_at timestamptz,
  add column if not exists canceled_by uuid references public.profiles(id) on delete set null;

create index if not exists idx_payment_request_payments_active_request
  on public.payment_request_payments(request_id, paid_at, created_at)
  where canceled_at is null;
