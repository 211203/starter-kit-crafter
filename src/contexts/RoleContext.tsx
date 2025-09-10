import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserRole, UserProfile } from '@/types/auth';
import { getUserProfile } from '@/services/authService';
import { useAuth } from './AuthContext';

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
    const fetchUserProfile = async () => {
      if (!user) {
        setUserRole(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile();
        if (profile) {
          setUserProfile(profile);
          setUserRole(profile.role);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
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