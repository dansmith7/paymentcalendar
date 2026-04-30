alter table public.payment_requests
  drop constraint if exists payment_requests_status_check;

alter table public.payment_requests
  add constraint payment_requests_status_check
    check (status in ('in_progress', 'partially_paid', 'rejected', 'paid'));
