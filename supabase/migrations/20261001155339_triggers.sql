-- Portfolio — triggers.
--
-- Split out from the tables migration because Postgres validates a function body when the
-- function is created. The tables have to exist before `is_admin()` can be defined, and
-- `set_updated_at()` has to exist before a trigger can reference it — so the order is
-- tables, then functions, then triggers.
--
-- These triggers are the reason no frontend code has to remember to send `updated_at`,
-- and the reason a visitor cannot forge `created_at` on a contact message.

-- Kept as an explicit list so it is obvious at a glance which tables maintain updated_at.
-- `contact_messages` is included so that marking a message read or archived bumps the
-- timestamp; only the four sealed columns are immutable, and updated_at is not one.
create trigger profile_set_updated_at before update on public.profile
  for each row execute function public.set_updated_at();
create trigger site_settings_set_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();
create trigger about_sections_set_updated_at before update on public.about_sections
  for each row execute function public.set_updated_at();
create trigger skill_categories_set_updated_at before update on public.skill_categories
  for each row execute function public.set_updated_at();
create trigger skills_set_updated_at before update on public.skills
  for each row execute function public.set_updated_at();
create trigger technologies_set_updated_at before update on public.technologies
  for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger project_images_set_updated_at before update on public.project_images
  for each row execute function public.set_updated_at();
create trigger experiences_set_updated_at before update on public.experiences
  for each row execute function public.set_updated_at();
create trigger educations_set_updated_at before update on public.educations
  for each row execute function public.set_updated_at();
create trigger certificates_set_updated_at before update on public.certificates
  for each row execute function public.set_updated_at();
create trigger services_set_updated_at before update on public.services
  for each row execute function public.set_updated_at();
create trigger social_links_set_updated_at before update on public.social_links
  for each row execute function public.set_updated_at();
create trigger contact_messages_set_updated_at before update on public.contact_messages
  for each row execute function public.set_updated_at();
create trigger media_set_updated_at before update on public.media
  for each row execute function public.set_updated_at();

-- Overwrites id, created_at, is_read and is_archived on every insert, so no role can set
-- them from the client. Order relative to the triggers above does not matter: the two
-- touch different columns.
create trigger contact_messages_seal_insert before insert on public.contact_messages
  for each row execute function public.contact_messages_seal_insert();