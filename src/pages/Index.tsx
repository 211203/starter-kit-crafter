import React, { useState, useEffect } from 'react';
import { SalesTable } from '@/components/SalesTable';
import { DashboardHeader } from '@/components/DashboardHeader';
import { CSVUpload } from '@/components/CSVUpload';
import { SalesClient } from '@/types/sales';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [clients, setClients] = useState<SalesClient[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_representatives')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match SalesClient interface
      const transformedData = data?.map(client => ({
        id: client.id,
        user_id: client.user_id,
        firstName: client.first_name,
        lastName: client.last_name,
        email: client.email,
        phoneNo: client.phone_no,
        source: client.source,
        notes: client.notes ?? null,
        created_at: client.created_at,
        updated_at: client.updated_at
      })) || [];
      
      setClients(transformedData);
    } catch (error) {
      console.error('Error loading sales data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load sales data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleRefresh = () => {
    loadData();
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-card rounded-xl border border-border shadow-xl p-8">
          <DashboardHeader
            onRefresh={handleRefresh}
            clientCount={clients.length}
            isLoading={loading}
          />
          
          {clients.length === 0 && !loading && (
            <div className="mt-8">
              <CSVUpload onUploadSuccess={loadData} />
            </div>
          )}
          
          <div className="mt-8">
            <SalesTable data={clients} loading={loading} onDataChange={loadData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
