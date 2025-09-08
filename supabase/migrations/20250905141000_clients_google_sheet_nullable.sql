-- Allow clients.google_sheet_id to be nullable so RPC can create clients without a sheet configured
alter table if exists public.clients
  alter column google_sheet_id drop not null;
