-- Portfolio — a second CV for the ELV / Light Current track.
--
-- `profile.resume_path` remains the software/Flutter CV. This adds an independent column
-- for the ELV / Light Current CV so each can be uploaded, replaced and downloaded on its
-- own. Additive and nullable: existing rows and the existing Flutter CV are untouched.
alter table public.profile
  add column resume_elv_path text;

comment on column public.profile.resume_elv_path is
  'Storage object path for the ELV / Light Current CV. Mirrors resume_path; both are independently managed.';
