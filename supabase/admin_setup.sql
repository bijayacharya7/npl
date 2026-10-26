-- Run once in the Supabase SQL Editor after creating the administrator account
-- through Supabase Dashboard > Authentication > Users. Replace the email below.
insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where lower(email) = lower('REPLACE_WITH_ADMIN_EMAIL')
on conflict (user_id) do update set role = excluded.role;

-- Confirm exactly one account was promoted and its role is correct.
select u.email, r.role
from auth.users u
join public.user_roles r on r.user_id = u.id
where lower(u.email) = lower('REPLACE_WITH_ADMIN_EMAIL');
