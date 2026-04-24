-- Актуализируем справочник групп финансового учета под рабочий процесс.
-- Оставляем активными только согласованные группы и порядок отображения.

update public.finance_groups g
set
  is_active = v.is_active,
  sort_order = v.sort_order
from (
  values
    ('Производство', true, 10),
    ('Реестр', true, 20),
    ('Офис', true, 30),
    ('Маркетинг', true, 40)
) as v(name, is_active, sort_order)
where g.name = v.name;

insert into public.finance_groups (name, is_active, sort_order)
select v.name, v.is_active, v.sort_order
from (
  values
    ('Производство', true, 10),
    ('Реестр', true, 20),
    ('Офис', true, 30),
    ('Маркетинг', true, 40)
) as v(name, is_active, sort_order)
where not exists (
  select 1
  from public.finance_groups g
  where g.name = v.name
);

update public.finance_groups
set is_active = false
where name not in ('Производство', 'Реестр', 'Офис', 'Маркетинг');
