-- 2026-11-22 — mark the quiz sessions tests wrote to production before the dev database.
-- One-off, reviewed data change. NOT a migration: run by hand in the Supabase SQL editor,
-- AFTER supabase/migrations/0009_test_sessions.sql. Decision (George, 2026-11-22):
--   test  = 60 sessions: 35 burst (script runs), 7 empty (feedback debugging, incl. the only
--           feedback row), 18 one-at-a-time sessions by the developer.
--   real  = 1 session, kept: 53e735ff-ff91-4ff8-9e55-764c694aad66
--           created 2026-11-20 06:33:00 UTC (07:33:00 Paris), 32 answers, an outside tester.
-- Sessions created after this list was read (2026-11-21 23:05 UTC) are not touched: they stay real.
-- The block aborts and changes nothing unless exactly 60 rows end up test and the kept one is real.
-- Undo: the same update with is_test = false.

begin;

update quiz_sessions set is_test = true where id in (
  '2b825780-2fac-4d56-9d36-3191b1f070f1', -- 2026-06-18T22:33:05Z manual, 20 answers
  'cd78c611-b2d7-4ca5-a67b-9111a96dc3fa', -- 2026-06-18T22:48:07Z manual, 5 answers
  '5c6a5e3c-f0ee-4dcf-927c-5f50b12f28d5', -- 2026-06-19T10:40:26Z burst, 45 answers
  '69f82556-c60b-406a-835c-a72827edfe68', -- 2026-06-19T10:40:27Z burst, 45 answers
  'ec053679-0527-419b-9a30-9dba0bf51b3b', -- 2026-06-19T10:40:28Z burst, 45 answers
  '0131f580-afb2-4d19-8118-1d64216db8d2', -- 2026-06-19T10:40:28Z burst, 45 answers
  'd998ce15-7745-4bd6-a963-41a3f5e77195', -- 2026-06-19T10:40:29Z burst, 45 answers
  '228dc506-62f0-4b10-8ec4-dfdeeafd0d40', -- 2026-06-19T11:10:28Z manual, 37 answers
  '8c4d463e-bcf6-41b4-bfb7-cb19cde10d4c', -- 2026-06-19T11:17:30Z manual, 37 answers
  '604add7e-e158-4ff6-bc03-91bc4c85c620', -- 2026-06-19T11:19:38Z manual, 37 answers
  '97c7451c-7463-4943-8139-113e15a8980e', -- 2026-06-30T00:21:47Z manual, 37 answers
  'c8109aa3-f965-4c77-8ff5-ba4b69a6dbb7', -- 2026-06-30T00:26:55Z manual, 45 answers
  '3aaf9d48-8500-48c8-958a-98611d448747', -- 2026-06-30T00:27:27Z manual, 37 answers
  'c497609c-2219-4bf1-b012-534f7ec24de7', -- 2026-07-01T22:11:35Z burst, 41 answers
  'd983d807-b235-4db0-b3d7-6e74d75aa34f', -- 2026-07-01T22:11:36Z burst, 41 answers
  '94f41ec8-c55b-4b07-ae9b-6232b9538af7', -- 2026-07-01T22:11:37Z burst, 41 answers
  'eb76dbd2-0491-4fbf-8b0a-17cc0c873aa6', -- 2026-07-01T22:11:38Z burst, 41 answers
  '54c93aa7-18e0-4306-946e-b351f5205dda', -- 2026-07-01T22:11:39Z burst, 41 answers
  '93852ee9-7c41-43c0-8c01-3a2aa1df1490', -- 2026-07-01T22:11:39Z burst, 41 answers
  'f0348a08-f584-425f-9cd6-9952447e5aa9', -- 2026-07-01T22:11:40Z burst, 41 answers
  'd3d6b419-7ba3-40dc-bdeb-1a8b07f21d06', -- 2026-07-01T22:11:42Z burst, 41 answers
  'dc880ba4-e005-4a5f-be9d-16a55b622ba7', -- 2026-07-01T22:11:42Z burst, 41 answers
  '83590dd6-5513-4d80-a8f0-4c3b770291d6', -- 2026-07-01T22:11:43Z burst, 41 answers
  '1525f5ce-b7c0-4692-9b3d-ebf2aa52d606', -- 2026-07-01T22:11:44Z burst, 41 answers
  '6a4a9c84-1b2a-4223-b509-f5454c4e2d9f', -- 2026-07-01T22:11:45Z burst, 41 answers
  '669e3d5e-5c54-4e37-a58c-db2195a9aa7f', -- 2026-07-01T22:11:46Z burst, 41 answers
  '724f6008-70a4-427c-bf73-18072c45b128', -- 2026-07-01T22:11:47Z burst, 41 answers
  'ca28abf9-5dc0-4d25-941a-c59251f67c9b', -- 2026-07-01T22:11:47Z burst, 41 answers
  'f2f04ccf-400d-4df5-abaf-0c8ddabc5da8', -- 2026-07-01T22:11:48Z burst, 41 answers
  '7c0133ae-93cf-4a47-a950-bcd7799c6e19', -- 2026-07-01T22:11:48Z burst, 41 answers
  '9dcd171a-cd5b-4b57-be7d-5e0925135592', -- 2026-07-01T22:11:49Z burst, 41 answers
  '30165ad5-6f9b-4d55-a98b-4fc26276c84a', -- 2026-07-01T22:11:50Z burst, 41 answers
  'f5e0af04-beff-4b79-aa52-ff758111ef75', -- 2026-07-01T22:11:50Z burst, 41 answers
  '45e45b6d-3d6c-4c48-8139-6be88a4575f7', -- 2026-07-01T22:11:50Z burst, 41 answers
  'b037d403-9ac2-4774-a6e3-e3f92deaf468', -- 2026-07-01T22:11:52Z burst, 41 answers
  'c863e71d-bc86-479a-b443-0c3470bab1fa', -- 2026-07-01T22:11:53Z burst, 41 answers
  '31c1b1a5-4696-48bd-b3ea-921e8629293b', -- 2026-07-01T22:11:53Z burst, 41 answers
  'd74d0a5f-8b62-4a96-9796-86acd4cad626', -- 2026-07-01T22:31:50Z manual, 40 answers
  'ac638efd-4827-44ba-8be8-918715a60ad2', -- 2026-07-01T22:34:15Z manual, 11 answers
  'df17005c-1064-47a3-bc9a-0d5e7b6c464b', -- 2026-07-02T17:58:56Z manual, 32 answers
  '52a3997f-ce5a-47ad-b938-a95c4e6fd12f', -- 2026-07-03T14:43:36Z burst, 5 answers
  '935644b1-6042-4eb3-a99e-20c4fa651b19', -- 2026-07-03T14:43:36Z burst, 4 answers
  '67fcb07e-d6b0-42bf-a57c-4719d5d88e8a', -- 2026-07-03T14:43:36Z burst, 5 answers
  'f2c27fbd-0da2-42fc-9c13-11a74699de67', -- 2026-07-04T08:44:35Z burst, 5 answers
  'b7578507-7ef5-47e9-9006-e86deee51d1f', -- 2026-07-04T08:44:35Z burst, 4 answers
  'd7b6f72f-6d30-41a9-ac35-125a1f7c8652', -- 2026-07-04T08:44:35Z burst, 5 answers
  '715deb71-c986-4c03-af49-2247480ad972', -- 2026-07-06T12:09:25Z manual, 39 answers
  '6de39fdd-9d02-4c30-864e-1dcf510a1719', -- 2026-07-06T12:11:35Z manual, 40 answers
  'e1e97fb3-610f-41f2-9f55-bd64cb71d833', -- 2026-07-07T20:58:17Z manual, 40 answers
  '576b285f-23d2-45e9-8b71-0d9e9278d579', -- 2026-07-31T19:24:15Z manual, 39 answers
  'c5e3609d-8040-401a-8ced-e6a9f47e2890', -- 2026-07-31T21:03:41Z manual, 12 answers
  'f4d28219-867a-47e4-839f-0f119e641588', -- 2026-07-31T21:06:31Z manual, 20 answers
  '5c21413a-d787-4585-b5b1-12985c3848bb', -- 2026-08-04T16:40:32Z empty, 0 answers
  '503883da-a375-489a-8529-9cc0fef83118', -- 2026-08-04T16:53:56Z empty, 1 answers
  '51a3cfd9-a8c0-4515-96dd-ce31a294cd34', -- 2026-08-04T17:12:27Z empty, 1 answers
  'ef4a65fe-d813-4c48-a892-91f3fbc6e782', -- 2026-08-04T17:21:56Z empty, 0 answers
  'e3787573-0d2b-4895-bef9-17aec23469ac', -- 2026-08-04T17:23:23Z empty, 0 answers
  'dbcf9bf8-d98c-4949-b06e-83e75ce5c9fd', -- 2026-08-04T17:48:52Z empty, 1 answers
  '83a1a869-bdff-4ead-b4db-eb2565d0ce22', -- 2026-08-04T18:01:58Z empty, 1 answers, has the only feedback row
  'a09a4c51-5ce6-45d7-8196-09d4362e19df'  -- 2026-11-17T20:51:01Z manual, 39 answers
);

do $$
begin
  if (select count(*) from quiz_sessions where is_test) <> 60 then
    raise exception 'expected 60 test sessions, found %', (select count(*) from quiz_sessions where is_test);
  end if;
  if (select is_test from quiz_sessions where id = '53e735ff-ff91-4ff8-9e55-764c694aad66') is distinct from false then
    raise exception 'kept session 53e735ff is missing or marked test';
  end if;
end $$;

commit;

-- Check (expect real_sessions >= 1, real_feedback = 0 unless new feedback arrived):
select (select count(*) from real_quiz_sessions) as real_sessions,
       (select count(*) from real_feedback)      as real_feedback;
