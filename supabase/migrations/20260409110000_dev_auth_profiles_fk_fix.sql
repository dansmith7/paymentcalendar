do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'profiles'
      and constraint_name = 'profiles_id_fkey'
  ) then
    alter table public.profiles drop constraint profiles_id_fkey;
  end if;
end $$;

alter table public.payment_requests
  drop constraint if exists payment_requests_status_check;

alter table public.payment_requests
  add constraint payment_requests_status_check
  check (status in ('in_progress', 'approved', 'rejected', 'paid'));

alter table public.payment_requests
  drop constraint if exists payment_requests_applicant_id_fkey;
