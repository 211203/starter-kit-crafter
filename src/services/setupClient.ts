import { supabase } from '@/integrations/supabase/client';

// Helper function to assign a user to a client (for testing purposes)
export const assignUserToClient = async (userId: string, clientId: string) => {
  try {
    // Use RPC function to ensure the user client is set up properly
    const { data, error } = await supabase
      .rpc('ensure_user_client');
    
    if (error) {
      throw error;
    }
    
    return { success: true, clientId: data };
  } catch (error) {
    console.error('Error assigning user to client:', error);
    throw error;
  }
};

// Get all available clients
export const getAvailableClients = async () => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('display_name');
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};