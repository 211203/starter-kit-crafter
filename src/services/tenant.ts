import { supabase } from '@/integrations/supabase/client';

export const ensureUserClient = async (opts?: { clientName?: string | null; googleSheetId?: string | null }) => {
  const { clientName = null, googleSheetId = null } = opts || {};
  const { data, error } = await supabase.rpc('ensure_user_client', {
    p_client_name: clientName,
    p_google_sheet_id: googleSheetId,
  });
  if (error) throw error;
  return data as string; // client_id uuid
};
