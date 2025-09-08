-- Add client_id to sales_clients for multi-tenant isolation
alter table if exists public.sales_clients
  add column if not exists client_id uuid references public.clients(id);

-- Backfill client_id for existing rows based on the owner's profile
update public.sales_clients sc
set client_id = p.client_id
from public.profiles p
where sc.user_id = p.user_id and sc.client_id is null;

-- Create a trigger to set user_id and client_id automatically on insert
create or replace function public.set_sales_clients_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- set user_id to the authed user if not provided
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  -- set client_id from the authed user's profile if not provided
  if new.client_id is null then
    select client_id into new.client_id
    from public.profiles
    where user_id = auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists set_sales_clients_tenant on public.sales_clients;
create trigger set_sales_clients_tenant
before insert on public.sales_clients
for each row execute function public.set_sales_clients_tenant();

-- Tighten RLS policies to tenant-based access via client_id
-- First drop old policies if they exist to avoid conflicts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sales_clients' AND policyname = 'Users can view their own sales clients'
  ) THEN
    EXECUTE 'DROP POLICY "Users can view their own sales clients" ON public.sales_clients';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sales_clients' AND policyname = 'Users can create their own sales clients'
  ) THEN
    EXECUTE 'DROP POLICY "Users can create their own sales clients" ON public.sales_clients';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sales_clients' AND policyname = 'Users can update their own sales clients'
  ) THEN
    EXECUTE 'DROP POLICY "Users can update their own sales clients" ON public.sales_clients';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sales_clients' AND policyname = 'Users can delete their own sales clients'
  ) THEN
    EXECUTE 'DROP POLICY "Users can delete their own sales clients" ON public.sales_clients';
  END IF;
END $$;

-- New tenant-aware policies
create policy "Tenant can view their sales clients"
  on public.sales_clients for select
  using (
    client_id in (
      select client_id from public.profiles where user_id = auth.uid()
    )
  );

create policy "Tenant can insert sales clients"
  on public.sales_clients for insert
  with check (
    (new.client_id is null or new.client_id in (
      select client_id from public.profiles where user_id = auth.uid()
    ))
  );

create policy "Tenant can update their sales clients"
  on public.sales_clients for update
  using (
    client_id in (
      select client_id from public.profiles where user_id = auth.uid()
    )
  );

create policy "Tenant can delete their sales clients"
  on public.sales_clients for delete
  using (
    client_id in (
      select client_id from public.profiles where user_id = auth.uid()
    )
  );
