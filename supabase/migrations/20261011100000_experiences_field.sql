-- Software / ELV field assignment for experiences.
alter table public.experiences
  add column field text not null default 'software';

alter table public.experiences
  add constraint experiences_field_check check (field in ('software', 'elv'));

comment on column public.experiences.field is
  'Professional field this experience belongs to: software or elv.';

create index experiences_field_idx on public.experiences (field);
