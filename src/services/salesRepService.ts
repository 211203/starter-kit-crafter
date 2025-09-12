import { supabase } from '@/integrations/supabase/client';
import { SalesRep, CreateSalesRepRequest } from '@/types/salesRep';

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
    // Use Edge Function with service role to handle privileged invite flow
    const { data, error } = await supabase.functions.invoke('invite-sales-rep', {
      body: {
        first_name: salesRepData.first_name,
        last_name: salesRepData.last_name,
        email: salesRepData.email,
        phone_no: salesRepData.phone_no,
      },
    });

    if (error || !data?.success) {
      console.error('Error inviting sales rep via function:', error || data);
      return { success: false, message: data?.message || 'Failed to invite sales rep' };
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