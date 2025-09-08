-- Rename sales_clients table to sales_representatives and update related objects
BEGIN;

-- Ensure the source table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'sales_clients'
  ) THEN
    RAISE EXCEPTION 'Table public.sales_clients does not exist. Aborting rename.';
  END IF;
END $$;

-- Rename table
ALTER TABLE public.sales_clients RENAME TO sales_representatives;

-- Enable RLS (preserve if already enabled)
ALTER TABLE public.sales_representatives ENABLE ROW LEVEL SECURITY;

-- Rename unique index if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i' AND n.nspname = 'public' AND c.relname = 'sales_clients_client_email_uniq'
  ) THEN
    EXECUTE 'ALTER INDEX public.sales_clients_client_email_uniq RENAME TO sales_representatives_client_email_uniq';
  END IF;
END $$;

-- Drop any existing triggers on the old table name (safe no-op if not exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'sales_representatives' AND t.tgname = 'set_sales_clients_tenant'
  ) THEN
    EXECUTE 'DROP TRIGGER set_sales_clients_tenant ON public.sales_representatives';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'sales_representatives' AND t.tgname = 'update_sales_clients_updated_at'
  ) THEN
    EXECUTE 'DROP TRIGGER update_sales_clients_updated_at ON public.sales_representatives';
  END IF;
END $$;

-- Recreate tenant trigger on the new table (reusing the same function)
CREATE TRIGGER set_sales_representatives_tenant
BEFORE INSERT ON public.sales_representatives
FOR EACH ROW
EXECUTE FUNCTION public.set_sales_clients_tenant();

-- If you had an updated_at trigger previously, recreate it under a new name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
  ) THEN
    EXECUTE 'CREATE TRIGGER update_sales_representatives_updated_at
      BEFORE UPDATE ON public.sales_representatives
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

-- Drop old policies if any exist on the new table (by name)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sales_representatives' AND policyname = 'Tenant can view their sales clients'
  ) THEN
    EXECUTE 'DROP POLICY "Tenant can view their sales clients" ON public.sales_representatives';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sales_representatives' AND policyname = 'Tenant can insert sales clients'
  ) THEN
    EXECUTE 'DROP POLICY "Tenant can insert sales clients" ON public.sales_representatives';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sales_representatives' AND policyname = 'Tenant can update their sales clients'
  ) THEN
    EXECUTE 'DROP POLICY "Tenant can update their sales clients" ON public.sales_representatives';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sales_representatives' AND policyname = 'Tenant can delete their sales clients'
  ) THEN
    EXECUTE 'DROP POLICY "Tenant can delete their sales clients" ON public.sales_representatives';
  END IF;
END $$;

-- Create new tenant-aware policies with updated names
CREATE POLICY "Tenant can view their sales representatives"
  ON public.sales_representatives FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant can insert sales representatives"
  ON public.sales_representatives FOR INSERT
  WITH CHECK (
    (NEW.client_id IS NULL OR NEW.client_id IN (
      SELECT client_id FROM public.profiles WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Tenant can update their sales representatives"
  ON public.sales_representatives FOR UPDATE
  USING (
    client_id IN (
      SELECT client_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant can delete their sales representatives"
  ON public.sales_representatives FOR DELETE
  USING (
    client_id IN (
      SELECT client_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

COMMIT;
