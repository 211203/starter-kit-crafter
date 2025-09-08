import { supabase } from '@/integrations/supabase/client';

export interface ClientInfo {
  id: string;
  client_name: string;
  google_sheet_id: string;
}

export const updateClientSheetId = async (sheetId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user's profile to find their client_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('client_id')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile query error:', profileError);
      return false;
    }

    if (!profile?.client_id) {
      console.log('No client_id found for user');
      return false;
    }

    // Update the client's google_sheet_id
    const { error: updateError } = await supabase
      .from('clients')
      .update({ google_sheet_id: sheetId })
      .eq('id', profile.client_id);

    if (updateError) {
      console.error('Client update error:', updateError);
      return false;
    }

    console.log('Successfully updated client sheet ID:', sheetId);
    return true;
  } catch (error) {
    console.error('Error updating client sheet ID:', error);
    return false;
  }
};

export const fetchUserClientInfo = async (): Promise<ClientInfo | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user's profile first
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('client_id')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile query error:', profileError);
      return null;
    }

    if (!profile?.client_id) {
      console.log('No client_id found for user');
      return null;
    }

    // Then get client info
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, client_name, google_sheet_id')
      .eq('id', profile.client_id)
      .single();

    if (clientError) {
      console.error('Client query error:', clientError);
      return null;
    }

    if (!client) {
      console.log('No client found');
      return null;
    }

    return client as ClientInfo;
  } catch (error) {
    console.error('Error fetching client info:', error);
    return null;
  }
};