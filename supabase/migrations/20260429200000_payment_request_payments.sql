create table if not exists public.payment_request_payments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.payment_requests(id) on delete restrict,
  paid_at date not null,
  amount_rub numeric(14, 2) not null check (amount_rub > 0),
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_payment_request_payments_request_id
  on public.payment_request_payments (request_id);

create index if not exists idx_payment_request_payments_paid_at
  on public.payment_request_payments (paid_at desc);

comment on table public.payment_request_payments is
  'История фактических оплат по заявкам. Каждая частичная/полная оплата — отдельная строка.';
