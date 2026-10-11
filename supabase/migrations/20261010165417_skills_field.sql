-- Software / ELV field assignment for skills and categories.
--
-- Additive and backward compatible: both columns default to 'software', so every existing
-- row keeps its meaning (the current catalogue is software/Flutter) without a data rewrite.
-- A CHECK mirrors the app's FieldOption union, the same way social_links.platform and
-- skills.proficiency are constrained in the database rather than only in the form.

alter table public.skills
  add column field text not null default 'software';

alter table public.skills
  add constraint skills_field_check check (field in ('software', 'elv'));

comment on column public.skills.field is
  'Professional field this skill belongs to: software or elv.';

alter table public.skill_categories
  add column field text not null default 'software';

alter table public.skill_categories
  add constraint skill_categories_field_check check (field in ('software', 'elv'));

comment on column public.skill_categories.field is
  'Professional field this category belongs to: software or elv.';

-- The public and admin skill queries filter by field, so index it.
create index skills_field_idx on public.skills (field);

create index skill_categories_field_idx on public.skill_categories (field);
