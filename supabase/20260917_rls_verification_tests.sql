-- =============================================================
-- RLS Verification Script for admin_tasks / admin_task_history
--
-- Run this in the Supabase SQL Editor AFTER deploying the migration.
-- Each test documents what it verifies and expected result.
--
-- NOTE: Replace the placeholder UUIDs below with real values
--       from your user_roles and profiles tables.
-- =============================================================

-- ── Step 0: Find your admin user IDs ────────────────────────────
-- Run this first to get real IDs to use below:
SELECT ur.user_id, p.full_name, p.email
FROM user_roles ur
JOIN profiles p ON p.id = ur.user_id
WHERE ur.role = 'admin';

-- Copy two admin UUIDs from the result. We'll call them:
--   ADMIN_A = '<paste first admin UUID here>'
--   ADMIN_B = '<paste second admin UUID here>'
-- Also grab a non-admin user ID:
SELECT p.id, p.full_name, p.email
FROM profiles p
WHERE p.id NOT IN (SELECT user_id FROM user_roles WHERE role = 'admin')
LIMIT 1;
--   NON_ADMIN = '<paste non-admin UUID here>'


-- =============================================================
-- TEST 1: Non-admin cannot SELECT tasks
-- Expected: 0 rows (RLS blocks it)
-- =============================================================
-- In Supabase dashboard, switch to the non-admin user's session,
-- or use the JS client logged in as a non-admin and run:
--   supabase.from('admin_tasks').select('*')
-- Verify: returns empty array, not an error


-- =============================================================
-- TEST 2: Non-admin cannot INSERT a task
-- Expected: RLS policy violation error
-- =============================================================
-- As non-admin user:
--   supabase.from('admin_tasks').insert({
--     title: 'Should fail',
--     created_by: NON_ADMIN
--   })
-- Verify: returns error, row not created


-- =============================================================
-- TEST 3: Admin CAN create a task with their own ID
-- Expected: succeeds
-- =============================================================
-- As ADMIN_A:
--   supabase.from('admin_tasks').insert({
--     title: 'Test task by Admin A',
--     created_by: ADMIN_A
--   }).select().single()
-- Verify: returns the created row


-- =============================================================
-- TEST 4: Admin CANNOT create a task impersonating another admin
-- Expected: RLS policy violation (created_by != auth.uid())
-- =============================================================
-- As ADMIN_A:
--   supabase.from('admin_tasks').insert({
--     title: 'Spoofed task',
--     created_by: ADMIN_B   // <-- different user!
--   })
-- Verify: returns error, row not created


-- =============================================================
-- TEST 5: Admin CANNOT insert history impersonating another admin
-- Expected: RLS policy violation (performed_by != auth.uid())
-- =============================================================
-- As ADMIN_A (use a real task_id from TEST 3):
--   supabase.from('admin_task_history').insert({
--     task_id: '<task id from test 3>',
--     action: 'spoofed_action',
--     performed_by: ADMIN_B   // <-- different user!
--   })
-- Verify: returns error, row not created


-- =============================================================
-- TEST 6: Admin CAN insert history with their own ID
-- Expected: succeeds
-- =============================================================
-- As ADMIN_A:
--   supabase.from('admin_task_history').insert({
--     task_id: '<task id from test 3>',
--     action: 'test_action',
--     performed_by: ADMIN_A
--   })
-- Verify: returns success


-- =============================================================
-- TEST 7: History is immutable — no UPDATE allowed
-- Expected: RLS policy violation (no UPDATE policy exists)
-- =============================================================
-- As ADMIN_A:
--   supabase.from('admin_task_history')
--     .update({ action: 'tampered' })
--     .eq('id', '<history id from test 6>')
-- Verify: returns error, row unchanged


-- =============================================================
-- TEST 8: History is immutable — no DELETE allowed
-- Expected: RLS policy violation (no DELETE policy exists)
-- =============================================================
-- As ADMIN_A:
--   supabase.from('admin_task_history')
--     .delete()
--     .eq('id', '<history id from test 6>')
-- Verify: returns error, row still exists


-- =============================================================
-- TEST 9: Admin CAN update any task's status (collaborative)
-- Expected: succeeds (any admin can progress any task)
-- =============================================================
-- As ADMIN_B:
--   supabase.from('admin_tasks')
--     .update({ status: 'in_progress' })
--     .eq('id', '<task id from test 3>')
-- Verify: returns success, status changed


-- =============================================================
-- TEST 10: CHECK constraint blocks invalid status/priority
-- Expected: check constraint violation
-- =============================================================
-- As ADMIN_A:
--   supabase.from('admin_tasks').insert({
--     title: 'Bad status',
--     created_by: ADMIN_A,
--     status: 'invalid_status'
--   })
-- Verify: returns error (check constraint)
--
--   supabase.from('admin_tasks').insert({
--     title: 'Bad priority',
--     created_by: ADMIN_A,
--     priority: 'critical'
--   })
-- Verify: returns error (check constraint)


-- =============================================================
-- CLEANUP: Remove test data after verification
-- =============================================================
-- DELETE FROM admin_task_history WHERE action IN ('test_action');
-- DELETE FROM admin_tasks WHERE title LIKE 'Test task%';
