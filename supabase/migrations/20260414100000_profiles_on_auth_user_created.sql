-- Профиль при регистрации через Supabase Auth: роль по умолчанию employee (руководителя выставляют вручную в profiles).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      nullif(trim(both from coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
      nullif(trim(both from split_part(coalesce(new.email, 'user@local'), '@', 1)), '')
    ),
    'employee'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(
      nullif(trim(both from public.profiles.full_name), ''),
      excluded.full_name
    );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
