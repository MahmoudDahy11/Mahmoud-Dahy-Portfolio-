-- Gallery images no longer require a description.
--
-- The owner adds screenshots faster than descriptions, and an alt text that had to be
-- filled in before every save was in the way. NULL now means "no description": the column
-- keeps `project_images_alt_check`, so a description that *is* given is still never blank,
-- and the form sends NULL rather than an empty string for an image left undescribed.
--
-- On the public site a NULL alt text renders as `alt=""`, which tells assistive technology
-- the image is decorative and it should be skipped.
alter table public.project_images alter column alt_text drop not null;
