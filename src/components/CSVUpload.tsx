import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { processClient } from '@/services/salesApi';

interface CSVUploadProps {
  onUploadSuccess: () => void;
}

export const CSVUpload = ({ onUploadSuccess }: CSVUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileUpload = async (file: File) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload files.",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      // Create a unique filename
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('csv-imports')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Parse CSV and insert data
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Find column indices - try multiple variations, return -1 if not found
      const getColumnIndex = (columnVariations: string[]) => {
        for (const variation of columnVariations) {
          const index = headers.findIndex(header => 
            header.includes(variation.toLowerCase()) || 
            variation.toLowerCase().includes(header) ||
            header === variation.toLowerCase()
          );
          if (index !== -1) return index;
        }
        return -1;
      };

      const firstNameIdx = getColumnIndex(['firstname', 'first_name', 'fname', 'first name']);
      const lastNameIdx = getColumnIndex(['lastname', 'last_name', 'lname', 'last name']);
      const emailIdx = getColumnIndex(['email', 'email_address', 'mail']);
      const phoneIdx = getColumnIndex(['phoneno', 'phone_no', 'phone', 'mobile', 'contact']);
      const sourceIdx = getColumnIndex(['source', 'lead_source', 'origin']);
      const notesIdx = getColumnIndex(['notes', 'note', 'remarks', 'comments', 'description']);

      // Process data rows
      const dataRows = lines.slice(1).filter(line => line.trim());
      const clientsData = [];

      for (const line of dataRows) {
        const columns = line.split(',').map(c => c.trim().replace(/"/g, ''));
        
        // Accept any row with at least some data
        if (columns.some(col => col.length > 0)) {
          clientsData.push({
            user_id: user.id,
            first_name: firstNameIdx !== -1 ? (columns[firstNameIdx] || '') : '',
            last_name: lastNameIdx !== -1 ? (columns[lastNameIdx] || '') : '',
            email: emailIdx !== -1 ? (columns[emailIdx] || '') : `unknown_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`,
            phone_no: phoneIdx !== -1 ? (columns[phoneIdx] || '') : '',
            source: sourceIdx !== -1 ? (columns[sourceIdx] || '') : 'CSV Import',
            notes: notesIdx !== -1 ? (columns[notesIdx] || '') : ''
          });
        }
      }

      if (clientsData.length === 0) {
        throw new Error('No data rows found in CSV file');
      }

      // Insert data into Supabase
      const { error } = await supabase
        .from('sales_representatives')
        .insert(clientsData);

      if (error) throw error;

      // Fire n8n webhook for each imported row (non-blocking for overall UX)
      try {
        const webhookPayloads = clientsData.map((c: any) => ({
          firstName: c.first_name,
          lastName: c.last_name,
          email: c.email,
          phoneNo: c.phone_no,
          notes: c.notes || ''
        }));
        const results = await Promise.allSettled(webhookPayloads.map(p => processClient(p)));
        const successCount = results.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value?.success).length;
        const failCount = webhookPayloads.length - successCount;

        toast({
          title: "Upload Successful",
          description: `Imported ${clientsData.length} clients. Webhook sent: ${successCount} ok${failCount ? `, ${failCount} failed` : ''}.`,
        });
      } catch (webhookErr: any) {
        console.error('Webhook dispatch error:', webhookErr);
        toast({
          title: 'Upload Successful (Webhook Issues)',
          description: 'Data imported, but sending to webhook failed for some or all records.',
        });
      }

      onUploadSuccess();

    } catch (error: any) {
      console.error('CSV upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to process CSV file. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Upload className="h-6 w-6" />
          Import Client Data
        </CardTitle>
        <CardDescription>
          Upload a CSV file containing your client data to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
        >
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          
          <div className="space-y-4">
            <div>
              <p className="text-lg font-medium">Drop your CSV file here</p>
              <p className="text-sm text-muted-foreground">or click to browse</p>
            </div>
            
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
              disabled={uploading}
            />
            
            <label htmlFor="csv-upload">
              <Button 
                variant="outline" 
                className="cursor-pointer" 
                disabled={uploading}
                asChild
              >
                <span>
                  {uploading ? 'Processing...' : 'Select CSV File'}
                </span>
              </Button>
            </label>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Flexible CSV Format:</p>
              <p className="text-muted-foreground">
                Upload any CSV file. We'll automatically detect columns like FirstName, LastName, Email, Phone, Source
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Secure Processing:</p>
              <p className="text-muted-foreground">
                Your data is processed securely and stored in your private database
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};