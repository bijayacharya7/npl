# Production setup

## 1. Supabase project

Configure the project before publishing the site. Link the Supabase CLI to the intended project, review the target, then run `supabase config push` and `supabase db push --include-seed`. The config disables public and anonymous sign-ins; the migration removes the retired fan profiles, favourites, predictions, and poll tables. It also removes the signup profile trigger; administrator roles are assigned explicitly. If this project was set up manually, check its migration history before pushing so existing migrations are not replayed unexpectedly.

In Supabase Authentication settings, turn off **Allow new users to sign up** and anonymous sign-ins. The checked-in `supabase/config.toml` applies the same restriction to a local Supabase CLI stack. Create the one administrator account in the Supabase Dashboard, then replace the email in `supabase/admin_setup.sql` and run it in the SQL Editor. Do not create an `admin/admin` account in Supabase.

## 2. Frontend environment

Set these build-time variables in Vercel (or the frontend host):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (the publishable/anon key only)
- `VITE_LOCAL_DEMO=false` (optional; production always ignores local demo mode)

When the Supabase URL and anon key are configured, the production build uses Supabase Auth, Postgres, and Storage. Row-level security protects admin writes. A missing Supabase configuration leaves the public site read-only and disables admin sign-in.

## 3. Server environment

For the Vercel API and scheduled CricketData refresh, configure server-only variables as needed:

- `CRICKETDATA_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`

Never expose a service role key or provider key in a `VITE_` variable. The public site can run without a cricket feed; live data remains unavailable until the provider key and server functions are configured.

## 4. Local development

The local demo is enabled only by the Vite development server and uses `admin/admin` with browser-local sample data. Set `VITE_LOCAL_DEMO=false` in development to exercise Supabase Auth and the shared database. The demo shortcut is removed from production builds.

Run `npm test`, `npm run test:sql`, and `npm run build` before deployment. Then verify one admin sign-in, rejected non-admin sign-in, content create/edit/delete, image upload/delete, sign-out, public visibility from a separate browser, mobile layouts, and the deployed API/cron with production configuration.
