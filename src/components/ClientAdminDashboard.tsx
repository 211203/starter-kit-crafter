import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, UserCheck } from 'lucide-react';
import { SalesRep } from '@/types/salesRep';
import { Customer } from '@/types/customer';
import { getSalesReps } from '@/services/salesRepService';
import { getCustomers } from '@/services/customerService';
import { SalesRepTable } from './SalesRepTable';
import { InviteSalesRepDialog } from './InviteSalesRepDialog';
import { useToast } from '@/hooks/use-toast';

export const ClientAdminDashboard = () => {
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [repsData, customersData] = await Promise.all([
        getSalesReps(),
        getCustomers()
      ]);
      setSalesReps(repsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInviteSuccess = () => {
    setShowInviteDialog(false);
    loadData();
    toast({
      title: 'Success',
      description: 'Sales representative invited successfully',
    });
  };

  const activeSalesReps = salesReps.filter(rep => rep.status === 'active').length;
  const totalCustomers = customers.length;

  return (
    <div className="min-h-screen bg-dashboard-bg p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Client Dashboard</h1>
            <p className="text-muted-foreground">Manage your sales team and monitor performance</p>
          </div>
          <Button onClick={() => setShowInviteDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Invite Sales Rep
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales Reps</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesReps.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeSalesReps} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                Across all sales reps
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Customers/Rep</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeSalesReps > 0 ? Math.round(totalCustomers / activeSalesReps) : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Per active sales rep
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sales Reps Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Representatives</CardTitle>
            <CardDescription>
              Manage your sales team and monitor their performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SalesRepTable 
              data={salesReps} 
              loading={loading}
              onDataChange={loadData}
            />
          </CardContent>
        </Card>

        {/* Invite Dialog */}
        <InviteSalesRepDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          onSuccess={handleInviteSuccess}
        />
      </div>
    </div>
  );
};