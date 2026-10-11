-- Software / ELV field assignment for projects.
--
-- Additive and backward compatible: the column defaults to 'software', so every existing
-- project keeps its meaning (all existing projects are software/Flutter) without a data
-- rewrite. The CHECK mirrors the app's FieldOption union.
alter table public.projects
  add column field text not null default 'software';

alter table public.projects
  add constraint projects_field_check check (field in ('software', 'elv'));

comment on column public.projects.field is
  'Professional field this project belongs to: software or elv.';

create index projects_field_idx on public.projects (field);
