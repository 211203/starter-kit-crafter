import { supabase } from '@/integrations/supabase/client';
import { SalesClient } from '@/types/sales';

// Map DB row (snake_case) to app type (camelCase)
const mapFromDb = (row: any): SalesClient => ({
  id: row.id,
  user_id: row.sales_rep_user_id,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  phoneNo: row.phone_no,
  source: row.source,
  notes: row.notes,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

// Map app type to DB row for insert/upsert
const mapToDb = (client: SalesClient) => ({
  id: client.id,
  sales_rep_user_id: client.user_id,
  first_name: client.firstName,
  last_name: client.lastName,
  email: client.email,
  phone_no: client.phoneNo,
  source: client.source,
  notes: client.notes,
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
    .from('customers')
    .select('id, sales_rep_user_id, first_name, last_name, email, phone_no, source, notes, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapFromDb);
};

export const upsertSalesClients = async (clients: SalesClient[]) => {
  if (!clients.length) return { count: 0 };

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('User not authenticated');

  const payload = clients.map(c => ({ 
    ...mapToDb(c), 
    sales_rep_user_id: userData.user.id 
  }));
  
  const { error, count } = await supabase
    .from('customers')
    .upsert(payload, { onConflict: 'sales_rep_user_id,email', ignoreDuplicates: false, count: 'exact' });

  if (error) throw error;
  return { count: count ?? clients.length };
};

export const insertSalesClients = async (clients: SalesClient[]) => {
  if (!clients.length) return { count: 0 };
  
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('User not authenticated');
  
  const payload = clients.map(c => ({ 
    ...mapToDb(c), 
    sales_rep_user_id: userData.user.id 
  }));
  
  const { error, count } = await supabase
    .from('customers')
    .insert(payload, { count: 'exact' });
    
  if (error) throw error;
  return { count: count ?? clients.length };
};
