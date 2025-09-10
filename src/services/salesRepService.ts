import { supabase } from '@/integrations/supabase/client';
import { SalesRep, CreateSalesRepRequest } from '@/types/salesRep';
import { getUserClientId } from './authService';

export const getSalesReps = async (): Promise<SalesRep[]> => {
  try {
    const { data, error } = await supabase
      .from('sales_reps')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sales reps:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSalesReps:', error);
    return [];
  }
};

export const inviteSalesRep = async (salesRepData: CreateSalesRepRequest): Promise<{ success: boolean; message?: string }> => {
  try {
    const clientId = await getUserClientId();
    if (!clientId) {
      return { success: false, message: 'No client ID found' };
    }

    // First, create the user account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: salesRepData.email,
      password: 'TempPass123!', // Generate a temporary password
      email_confirm: true,
      user_metadata: {
        display_name: `${salesRepData.first_name} ${salesRepData.last_name}`,
        role: 'sales_rep'
      }
    });

    if (authError) {
      console.error('Error creating user:', authError);
      return { success: false, message: 'Failed to create user account' };
    }

    // Then create the sales rep record
    const { error: repError } = await supabase
      .from('sales_reps')
      .insert({
        user_id: authData.user.id,
        client_id: clientId,
        first_name: salesRepData.first_name,
        last_name: salesRepData.last_name,
        email: salesRepData.email,
        phone_no: salesRepData.phone_no
      });

    if (repError) {
      console.error('Error creating sales rep:', repError);
      return { success: false, message: 'Failed to create sales rep record' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in inviteSalesRep:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
};

export const updateSalesRep = async (id: string, updates: Partial<SalesRep>): Promise<{ success: boolean; message?: string }> => {
  try {
    const { error } = await supabase
      .from('sales_reps')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating sales rep:', error);
      return { success: false, message: 'Failed to update sales rep' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateSalesRep:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
};