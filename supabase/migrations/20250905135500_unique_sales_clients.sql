-- Ensure per-tenant uniqueness on email
create unique index if not exists sales_clients_client_email_uniq
  on public.sales_clients (client_id, email);
