import React from 'react';
import { useRole } from '@/contexts/RoleContext';
import { ClientAdminDashboard } from '@/components/ClientAdminDashboard';
import { SalesRepDashboard } from '@/components/SalesRepDashboard';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { userRole, loading } = useRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (userRole === 'client_admin') {
    return <ClientAdminDashboard />;
  }

  if (userRole === 'sales_rep') {
    return <SalesRepDashboard />;
  }

  return (
    <div className="min-h-screen bg-dashboard-bg flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary mb-2">Access Denied</h1>
        <p className="text-muted-foreground">Unable to determine your role. Please contact support.</p>
      </div>
    </div>
  );
};

export default Index;