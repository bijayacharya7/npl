# Production setup

## 1. Supabase project

Configure the project before publishing the site. Link the Supabase CLI to the intended project, review the target, then run `supabase config push` and `supabase db push --include-seed`. The config disables public and anonymous sign-ins; the migration removes the retired fan profiles, favourites, predictions, and poll tables. It also removes the signup profile trigger; administrator roles are assigned explicitly. If this project was set up manually, check its migration history before pushing so existing migrations are not replayed unexpectedly.

In Supabase Authentication settings, turn off **Allow new users to sign up** and anonymous sign-ins. The checked-in `supabase/config.toml` applies the same restriction to a local Supabase CLI stack. Create the one administrator account in the Supabase Dashboard, then replace the email in `supabase/admin_setup.sql` and run it in the SQL Editor. Do not create an `admin/admin` account in Supabase.

## 2. Frontend environment

Set these build-time variables in Vercel (or the frontend host):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (the publishable/anon key only)
- `VITE_LOCAL_DEMO=false` (optional; production always ignores local demo mode)

Both Supabase values are required for a production build; `src/lib/supabase.js` intentionally stops the build when either is missing. The URL and anon/publishable key are public browser configuration, not secrets. Apply every migration and seed before hosting so the site can load its shared content. Row-level security is the security boundary for admin writes. Do not deploy a local-demo build or treat browser-local data as shared production content.

## 3. Server environment

For the Vercel API and scheduled CricketData refresh, configure server-only variables as needed:

- `CRICKETDATA_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`

Never expose a service role key or provider key in a `VITE_` variable. The public site can run without a cricket feed; live data remains unavailable until the provider key and server functions are configured.

## 4. Local development

The local demo is enabled only by the Vite development server and uses `admin/admin` with browser-local sample data. It is not a public multi-user data store. Set `VITE_LOCAL_DEMO=false` in development to exercise Supabase Auth and the shared database; production always disables local-demo mode.

## 5. Build, deploy, and final public-launch checks

Run `npm ci`, then `npm run test:release`. In Vercel, import this repository, set the frontend variables above for the production environment, and deploy with the checked-in Vite settings (`npm run build`, output directory `dist`). Add the server-only variables to Vercel only if you enable the scheduled CricketData refresh endpoint; without a provider key, the site still works with manually entered results and must not imply scores are live. The scheduled Vercel cron feature may require a paid plan—check your current Vercel plan before enabling it.

After the first deploy, test the actual public origin: reload deep links, check browser console/network errors, verify public data from a signed-out session, sign in with the explicitly promoted admin, verify an ordinary account cannot write, test create/edit/delete and image uploads, and confirm storage policies. Review factual sources and sample article labels before publishing. Configure the custom domain in Vercel and follow its DNS instructions. Do not announce the site as production-ready until Supabase configuration, auth/RLS, storage and the actual deployed origin have been verified.
