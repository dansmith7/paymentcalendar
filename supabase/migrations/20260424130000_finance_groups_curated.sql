-- Актуализируем справочник групп финансового учета под рабочий процесс.
-- Оставляем активными только согласованные группы и порядок отображения.

insert into public.finance_groups (name, is_active, sort_order)
values
  ('Производство', true, 10),
  ('Реестр', true, 20),
  ('Офис', true, 30),
  ('Маркетинг', true, 40)
on conflict (name)
do update set
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

update public.finance_groups
set is_active = false
where name not in ('Производство', 'Реестр', 'Офис', 'Маркетинг');
