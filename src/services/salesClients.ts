import { supabase } from '@/integrations/supabase/client';
import { SalesClient } from '@/types/sales';

// Map DB row (snake_case) to app type (camelCase)
const mapFromDb = (row: any): SalesClient => ({
  id: row.id,
  user_id: row.user_id,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  phoneNo: row.phone_no,
  source: row.source,
  notes: row.notes ?? null,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

// Map app type to DB row for insert/upsert
const mapToDb = (client: SalesClient) => ({
  // id will be auto if not provided
  user_id: client.user_id ?? undefined, // trigger will set to auth.uid() if null
  first_name: client.firstName,
  last_name: client.lastName,
  email: client.email,
  phone_no: client.phoneNo,
  source: client.source,
  notes: client.notes ?? null,
});

// Fetch the current tenant's client_id from the user's profile
export const getCurrentClientId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  // Use RPC function to ensure user has a client and get the client_id
  const { data: clientId, error } = await supabase
    .rpc('ensure_user_client');
    
  if (error) throw error;
  return clientId || null;
};

export const getSalesClients = async (): Promise<SalesClient[]> => {
  const { data, error } = await supabase
    .from('sales_representatives')
    .select('id, user_id, first_name, last_name, email, phone_no, source, notes, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapFromDb);
};

export const upsertSalesClients = async (clients: SalesClient[]) => {
  if (!clients.length) return { count: 0 };

  const clientId = await getCurrentClientId();
  if (!clientId) throw new Error('No client_id associated with the current user');

  const payload = clients.map(c => ({ ...mapToDb(c), client_id: clientId }));
  const { error, count } = await supabase
    .from('sales_representatives')
    // Match the DB unique index (client_id, email) so upsert works per-tenant
    .upsert(payload, { onConflict: 'client_id,email', ignoreDuplicates: false, count: 'exact' });
  // Note: If you want a composite uniqueness (e.g., by email within tenant),
  // add a unique index in DB: unique (client_id, email)

  if (error) throw error;
  return { count: count ?? clients.length };
};

export const insertSalesClients = async (clients: SalesClient[]) => {
  if (!clients.length) return { count: 0 };
  const clientId = await getCurrentClientId();
  if (!clientId) throw new Error('No client_id associated with the current user');
  const payload = clients.map(c => ({ ...mapToDb(c), client_id: clientId }));
  const { error, count } = await supabase
    .from('sales_representatives')
    .insert(payload, { count: 'exact' });
  if (error) throw error;
  return { count: count ?? clients.length };
};
