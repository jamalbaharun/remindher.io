-- ================================================
-- RemindHer.io — Supabase SQL Setup
-- Run this in Supabase SQL Editor
-- ================================================

-- Enable uuid extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Reminders table (references auth.users directly — no separate users table)
CREATE TABLE IF NOT EXISTS public.reminders (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  subject        TEXT        NOT NULL CHECK (char_length(subject) <= 255),
  expiry_date    TIMESTAMPTZ NOT NULL,
  notify_email   BOOLEAN     NOT NULL DEFAULT true,
  notify_wa      BOOLEAN     NOT NULL DEFAULT false,
  notify_telegram BOOLEAN    NOT NULL DEFAULT false,
  phone_number   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Single all-operations policy per PRD §3
CREATE POLICY "Users can manage their own reminders"
  ON public.reminders
  FOR ALL
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reminders_user_id   ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_expiry_date ON public.reminders(expiry_date);
