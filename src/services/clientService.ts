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

    // Use RPC function to ensure user has a client and get the client_id
    const { data: clientId, error: clientError } = await supabase
      .rpc('ensure_user_client');

    if (clientError) {
      console.error('Client RPC error:', clientError);
      return false;
    }

    if (!clientId) {
      console.log('No client_id found for user');
      return false;
    }

    // Update the client's Google Sheet ID
    const { error: updateError } = await supabase
      .from('clients')
      .update({ google_sheet_id: sheetId })
      .eq('id', clientId);

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

    // Use RPC function to ensure user has a client and get the client_id
    const { data: clientId, error: clientError } = await supabase
      .rpc('ensure_user_client');

    if (clientError) {
      console.error('Client RPC error:', clientError);
      return null;
    }

    if (!clientId) {
      console.log('No client_id found for user');
      return null;
    }

    // Then get client info
    const { data: client, error: queryError } = await supabase
      .from('clients')
      .select('id, client_name, google_sheet_id')
      .eq('id', clientId)
      .single();

    if (queryError) {
      console.error('Client query error:', queryError);
      return null;
    }

    if (!client) {
      console.log('No client found');
      return null;
    }

    return {
      id: client.id,
      client_name: client.client_name || 'My Company',
      google_sheet_id: client.google_sheet_id || ''
    } as ClientInfo;
  } catch (error) {
    console.error('Error fetching client info:', error);
    return null;
  }
};