import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserRole, UserProfile } from '@/types/auth';
import { getUserProfile } from '@/services/authService';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface RoleContextType {
  userRole: UserRole | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isClientAdmin: boolean;
  isSalesRep: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!user) {
        setUserRole(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const metaRole = ((authUser?.user_metadata?.role as UserRole) || 'client_admin') as UserRole;
        const displayName = (authUser?.user_metadata?.display_name as string) || undefined;

        // Ensure a profile exists with the correct role and basic info
        await supabase
          .from('profiles')
          .upsert(
            {
              user_id: authUser!.id,
              role: metaRole,
              display_name: displayName,
            },
            { onConflict: 'user_id' }
          );

        // Ensure a tenant (client) exists for client admins
        if (metaRole === 'client_admin') {
          const companyName = (authUser?.user_metadata?.company_name as string) || null;
          await supabase.rpc('ensure_user_client', {
            p_client_name: companyName,
            p_google_sheet_id: null,
          });
        }

        const profile = await getUserProfile();
        if (profile) {
          setUserProfile(profile);
          setUserRole(profile.role);
        } else {
          setUserRole(metaRole);
        }
      } catch (error) {
        console.error('Error initializing user profile/role:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user]);

  const value = {
    userRole,
    userProfile,
    loading,
    isClientAdmin: userRole === 'client_admin',
    isSalesRep: userRole === 'sales_rep',
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};