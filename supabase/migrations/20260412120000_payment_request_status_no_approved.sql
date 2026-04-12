-- Убираем статус «approved»: в приложении остаются «В работе», «Оплачено», «Отклонено».
update public.payment_requests
set status = 'in_progress'
where status = 'approved';

alter table public.payment_requests
  drop constraint if exists payment_requests_status_check;

alter table public.payment_requests
  add constraint payment_requests_status_check
    check (status in ('in_progress', 'rejected', 'paid'));
