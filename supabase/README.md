# Supabase setup

## Existing project (the live AYDA database)

1. Open the Supabase Dashboard → SQL Editor.
2. Paste and run `migrations/2026-07-19_secure_patient_data.sql`.
3. Register the admin account (replace the email):

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'admin@example.com'
   on conflict (user_id) do nothing;
   ```

4. Dashboard → Authentication → Sign In / Up → **disable new sign-ups**.

Without step 3 the dashboard login will succeed but show zero requests,
because reading `requests` is now allowed only for members of `public.admins`.

## Fresh project

Run `schema.sql` in the SQL Editor, then do steps 3–4 above.
Upload the site assets (`LOGO.png`, `AYDA.jpg`) to the public `images` bucket.

## Why this exists

The original policies allowed public `SELECT`/`UPDATE` on `requests` and kept
the `prescriptions` bucket public. The anon key is embedded in the JS bundle
that every visitor downloads, so patient names, phone numbers, diseases,
symptoms and prescription photos were effectively world-readable. The current
policies keep the public parts public (submitting a request, viewing
committees) and make everything touching patient data admin-only.
