-- ---------------------------------------------------------------------------
-- 0006_feedback.sql — anonymous feedback capture (V1: capture + store).
--
--   Written SERVER-SIDE with the service-role key, exactly like quiz_sessions
--   (see src/lib/quiz/session-store.ts). Every table in this DB is deny-by-default
--   RLS with NO anon policies (0003_full_schema.sql); the service-role key
--   bypasses RLS, so no policy/grant is needed here.
--
--   feedback → quiz_sessions FK; session context (seed/answers/directions) lives
--   in quiz_sessions and is joined at read time. No PII columns. on delete cascade
--   → feedback dies with its session (RGPD deletion).
-- ---------------------------------------------------------------------------

create table if not exists feedback (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references quiz_sessions (id) on delete cascade,
  answers     jsonb not null default '{}'::jsonb,   -- {A1..A4, B1..B4}
  created_at  timestamptz not null default now()
);
create index if not exists idx_feedback_session on feedback (session_id);

-- Deny-by-default RLS, like every other table. No anon policies: all writes go
-- through the service-role key server-side (feedback insert lives in a server
-- action), which bypasses RLS.
alter table feedback enable row level security;
