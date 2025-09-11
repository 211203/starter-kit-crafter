import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole } from '@/types/auth';

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) {
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

export const getUserRole = async (): Promise<UserRole | null> => {
  try {
    const { data, error } = await supabase.rpc('get_user_role');
    
    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserRole:', error);
    return null;
  }
};

export const getUserClientId = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.rpc('get_user_client_id');
    
    if (error) {
      console.error('Error fetching user client ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserClientId:', error);
    return null;
  }
};