-- ---------------------------------------------------------------------------
-- 0009_test_sessions.sql — keep test sessions out of metrics and feedback counts.
--
--   Local runs and tests use the dev database (DEV_DB.md; the src/lib/supabase.ts
--   target guard refuses a hosted project off Vercel), so new test sessions never
--   reach production. Sessions written before that are flagged with is_test (the
--   marking is a separate, reviewed data change, NOT part of this migration).
--   Same SQL as 0009 on the market-data branch; only this header differs.
--
--   Metrics and feedback counts read the two views, never the base tables.
--   security_invoker: the views apply the caller's RLS (deny-by-default here),
--   so they don't expose quiz_sessions to the anon key. Service role only.
-- ---------------------------------------------------------------------------

alter table quiz_sessions add column if not exists is_test boolean not null default false;

create or replace view real_quiz_sessions
  with (security_invoker = true) as
select * from quiz_sessions where not is_test;

create or replace view real_feedback
  with (security_invoker = true) as
select f.*
from feedback f
join quiz_sessions s on s.id = f.session_id
where not s.is_test;

revoke all on real_quiz_sessions from anon, authenticated;
revoke all on real_feedback from anon, authenticated;
