create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key,
  email text not null unique,
  full_name text not null,
  role text not null default 'employee' check (role in ('employee', 'manager', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.finance_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null,
  applicant_name text not null,
  applicant_email text not null default '',
  request_date date not null default current_date,
  amount_rub numeric(14, 2) not null check (amount_rub > 0),
  payment_recipient text not null,
  payment_purpose text not null,
  desired_payment_date date not null,
  critical_payment_date date,
  finance_group_id uuid references public.finance_groups(id) on delete set null,
  finance_group_name text,
  planned_payment_date date,
  is_paid boolean not null default false,
  paid_at timestamptz,
  status text not null default 'in_progress' check (status in ('in_progress', 'rejected', 'paid')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payment_requests_applicant_id
  on public.payment_requests (applicant_id);

create index if not exists idx_payment_requests_desired_payment_date
  on public.payment_requests (desired_payment_date);

create index if not exists idx_payment_requests_critical_payment_date
  on public.payment_requests (critical_payment_date);

create index if not exists idx_payment_requests_planned_payment_date
  on public.payment_requests (planned_payment_date);

create index if not exists idx_payment_requests_is_paid
  on public.payment_requests (is_paid);

create or replace function public.set_payment_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_payment_requests_updated_at on public.payment_requests;

create trigger trg_payment_requests_updated_at
before update on public.payment_requests
for each row
execute function public.set_payment_requests_updated_at();

insert into public.finance_groups (name, is_active, sort_order)
select v.name, v.is_active, v.sort_order
from (
  values
    ('Аренда и коммунальные', true, 10),
    ('Фонд оплаты труда', true, 20),
    ('Налоги и взносы', true, 30),
    ('Логистика и доставка', true, 40),
    ('Маркетинг и реклама', true, 50),
    ('IT и подписки', true, 60),
    ('Прочие расходы', true, 90)
) as v(name, is_active, sort_order)
where not exists (
  select 1 from public.finance_groups g where g.name = v.name
);

-- Обновляем порядок/активность, если строки уже были без нужных значений
update public.finance_groups g
set
  is_active = s.is_active,
  sort_order = s.sort_order
from (
  values
    ('Аренда и коммунальные', true, 10),
    ('Фонд оплаты труда', true, 20),
    ('Налоги и взносы', true, 30),
    ('Логистика и доставка', true, 40),
    ('Маркетинг и реклама', true, 50),
    ('IT и подписки', true, 60),
    ('Прочие расходы', true, 90)
) as s(name, is_active, sort_order)
where g.name = s.name
  and (g.is_active is distinct from s.is_active or g.sort_order is distinct from s.sort_order);
