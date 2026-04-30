alter table public.payment_requests
  add column if not exists paid_amount_rub numeric(14, 2)
    check (paid_amount_rub is null or paid_amount_rub > 0);

comment on column public.payment_requests.paid_amount_rub is
  'Фактически оплаченная сумма. Если null у оплаченной заявки, приложение использует сумму заявки как fallback.';
