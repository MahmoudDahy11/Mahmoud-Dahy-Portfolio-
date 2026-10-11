-- Software / ELV field assignment for certificates.
alter table public.certificates
  add column field text not null default 'software';

alter table public.certificates
  add constraint certificates_field_check check (field in ('software', 'elv'));

comment on column public.certificates.field is
  'Professional field this certificate belongs to: software or elv.';

create index certificates_field_idx on public.certificates (field);
