import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Users } from 'lucide-react';
import { Customer } from '@/types/customer';
import { getCustomers } from '@/services/customerService';
import { CustomerTable } from './CustomerTable';
import { CSVUpload } from './CSVUpload';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const SalesRepDashboard = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const customersData = await getCustomers();
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to sign out. Please try again.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Success',
          description: 'You have been signed out successfully.'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive'
      });
    }
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    loadData();
  };

  const activeCustomers = customers.length; // All customers are active for now
  const pendingCustomers = 0; // Can be enhanced based on workflow status

  return (
    <div className="min-h-screen bg-dashboard-bg p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Sales Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowUpload(!showUpload)}>
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button onClick={loadData} disabled={loading}>
              Refresh Data
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
              <p className="text-xs text-muted-foreground">
                Your assigned customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCustomers}</div>
              <p className="text-xs text-muted-foreground">
                Currently in workflow
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCustomers}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting processing
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CSV Upload */}
        {showUpload && (
          <Card>
            <CardHeader>
              <CardTitle>Import Customers</CardTitle>
              <CardDescription>
                Upload a CSV file to import customer data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CSVUpload onUploadSuccess={handleUploadSuccess} />
            </CardContent>
          </Card>
        )}

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Customers</CardTitle>
            <CardDescription>
              Manage and process your assigned customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerTable 
              data={customers} 
              loading={loading}
              onDataChange={loadData}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};