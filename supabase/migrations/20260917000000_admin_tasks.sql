-- =============================================================
-- Migration: Admin Tasks Feature
-- Date: 2026-09-17
--
-- Creates two new tables for internal admin task management:
--   1. admin_tasks       — the tasks themselves
--   2. admin_task_history — audit/activity log per task
--
-- RLS: All operations restricted to admins via has_role().
-- No existing tables/policies are modified.
-- =============================================================

-- ── Table: admin_tasks ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_tasks (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text        NOT NULL,
  description   text,
  priority      text        NOT NULL DEFAULT 'normal'
                            CHECK (priority IN ('normal', 'urgent')),
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'in_progress', 'completed', 'closed')),
  due_date      timestamptz,
  created_by    uuid        NOT NULL REFERENCES auth.users(id),
  assigned_to   uuid        REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Table: admin_task_history ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_task_history (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       uuid        NOT NULL REFERENCES public.admin_tasks(id) ON DELETE CASCADE,
  action        text        NOT NULL,
  old_value     text,
  new_value     text,
  performed_by  uuid        NOT NULL REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_admin_tasks_created_by  ON public.admin_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_assigned_to ON public.admin_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_status      ON public.admin_tasks(status);
CREATE INDEX IF NOT EXISTS idx_admin_task_history_task  ON public.admin_task_history(task_id);

-- ── Enable RLS ──────────────────────────────────────────────────
ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_task_history ENABLE ROW LEVEL SECURITY;

-- ── RLS: admin_tasks ────────────────────────────────────────────
CREATE POLICY "Admins can read all tasks"
  ON public.admin_tasks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- created_by must match the calling user — prevents identity spoofing
CREATE POLICY "Admins can create tasks"
  ON public.admin_tasks FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    AND created_by = auth.uid()
  );

CREATE POLICY "Admins can update tasks"
  ON public.admin_tasks FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tasks"
  ON public.admin_tasks FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── RLS: admin_task_history ─────────────────────────────────────
-- History is APPEND-ONLY by design: no UPDATE/DELETE policies exist,
-- so Postgres RLS blocks those operations even for admins.

CREATE POLICY "Admins can read task history"
  ON public.admin_task_history FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- performed_by must match the calling user — prevents audit-log spoofing
CREATE POLICY "Admins can insert task history"
  ON public.admin_task_history FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    AND performed_by = auth.uid()
  );

-- ── Auto-update updated_at on admin_tasks ───────────────────────
CREATE OR REPLACE FUNCTION public.update_admin_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_tasks_updated_at ON public.admin_tasks;
CREATE TRIGGER trg_admin_tasks_updated_at
  BEFORE UPDATE ON public.admin_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_admin_tasks_updated_at();
