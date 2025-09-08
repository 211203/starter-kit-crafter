-- Add notes column to sales_representatives
BEGIN;

ALTER TABLE public.sales_representatives
  ADD COLUMN IF NOT EXISTS notes text;

COMMIT;
