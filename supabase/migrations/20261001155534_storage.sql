-- Portfolio — Storage buckets and their policies.
--
-- Bucket design, from ARCHITECTURE.md section 8:
--
--   portfolio-media  public-read  images: avatar, covers, galleries, logos, tech icons
--   portfolio-files  public-read  documents: the resume PDF
--
-- Why the buckets are public: the public site renders these images directly in <img>
-- tags and in Open Graph tags. Social crawlers do not send an Authorization header, so
-- a private bucket would produce broken preview images and would force the project to
-- mint signed URLs — which needs a server this project deliberately does not have.
--
-- Public *read* does not mean public *write*. Every write path below requires an admin,
-- and `storage.objects` has RLS enabled with policies written here. The published anon
-- key therefore cannot upload, overwrite or delete a single file.
--
-- Size and type limits are set on the bucket as well as in the frontend. The frontend
-- check exists to produce a readable error message; the bucket limit is the one that
-- actually holds.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-media',
  'portfolio-media',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-files',
  'portfolio-files',
  true,
  10485760, -- 10 MB
  array['application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Storage policies
-- ---------------------------------------------------------------------------

-- `storage.objects` already has RLS enabled by Supabase. It has no permissive policies
-- of its own, so these four are the complete list of ways a client can touch a file.
-- Note that `storage.objects.bucket_id` is a `text` column holding the bucket name, so
-- the bucket names are compared as plain strings.

-- Public read of any file in either portfolio bucket.
--
-- The `owner = (select auth.uid())` alternative was rejected: the buckets are public, so
-- reading is not a privileged act and the policy should say so plainly.
create policy portfolio_storage_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('portfolio-media', 'portfolio-files'));

-- Admin upload.
create policy portfolio_storage_admin_insert on storage.objects
  for insert to authenticated
  with check (
    (select public.is_admin())
    and bucket_id in ('portfolio-media', 'portfolio-files')
  );

-- Admin replace and delete.
--
-- These are scoped by admin status and bucket, not by `owner`. Scoping to the uploader
-- would stop one admin overwriting another's files, which is not a threat in a
-- single-owner portfolio, and it would tie the policies to whichever of `owner` (uuid) or
-- `owner_id` (text) the Storage server happens to populate. Admin status plus bucket is
-- the whole requirement, so it is what the policies check.
create policy portfolio_storage_admin_update on storage.objects
  for update to authenticated
  using (
    (select public.is_admin())
    and bucket_id in ('portfolio-media', 'portfolio-files')
  )
  with check (
    (select public.is_admin())
    and bucket_id in ('portfolio-media', 'portfolio-files')
  );

create policy portfolio_storage_admin_delete on storage.objects
  for delete to authenticated
  using (
    (select public.is_admin())
    and bucket_id in ('portfolio-media', 'portfolio-files')
  );