-- Колонка applicant_email (если таблица создана без неё) и заполнение из profiles.
alter table public.payment_requests
  add column if not exists applicant_email text;

update public.payment_requests pr
set applicant_email = p.email
from public.profiles p
where pr.applicant_id = p.id
  and (pr.applicant_email is null or btrim(pr.applicant_email) = '');

update public.payment_requests
set applicant_email = ''
where applicant_email is null;

alter table public.payment_requests
  alter column applicant_email set default '',
  alter column applicant_email set not null;

comment on column public.payment_requests.applicant_email is
  'Email заявителя на момент создания заявки (копия из profiles.email).';
