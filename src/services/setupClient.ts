import { supabase } from '@/integrations/supabase/client';

// Helper function to assign a user to a client (for testing purposes)
export const assignUserToClient = async (userId: string, clientId: string) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ client_id: clientId })
      .eq('user_id', userId);
    
    if (error) {
      throw error;
    }
    
    return { success: true };
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
      .order('client_name');
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};