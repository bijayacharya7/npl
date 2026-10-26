import { PGlite } from '@electric-sql/pglite'
const db = new PGlite()
await db.exec(`
  create role authenticated nologin;
  create table public.t (id int);
  insert into public.t values (1);
  alter table public.t enable row level security;
  create policy p on public.t for all using (false) with check (false);
  grant select, update on public.t to authenticated;
`)
console.log('superuser:', (await db.query('select current_user, count(*) from public.t')).rows)
await db.exec('set role authenticated')
console.log('after set role current_user:', (await db.query('select current_user')).rows)
console.log('select as authenticated:', (await db.query('select count(*) from public.t')).rows)
try {
  await db.query('update public.t set id = 2')
  console.log('UPDATE SUCCEEDED (bad)')
} catch (e) {
  console.log('update blocked:', e.message)
}
await db.close()
