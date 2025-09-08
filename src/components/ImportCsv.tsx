import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { insertSalesClients, upsertSalesClients, getCurrentClientId } from '@/services/salesClients';
import { ensureUserClient } from '@/services/tenant';
import { Loader2, Upload } from 'lucide-react';

interface ImportCsvProps {
  onImported?: (count: number) => void;
  mode?: 'insert' | 'upsert';
}

// Very basic CSV parser for comma-separated values with a header row
// Assumes no embedded commas or quotes in fields (keep CSV simple)
function parseCsv(content: string) {
  // Remove BOM if present
  const normalizedContent = content.replace(/^\uFEFF/, '');
  const lines = normalizedContent.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [] as any[];
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim());
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => {
      obj[h] = cols[idx] ?? '';
    });
    return obj;
  });
  return rows;
}

export const ImportCsv: React.FC<ImportCsvProps> = ({ onImported, mode = 'upsert' }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleChoose = () => fileInputRef.current?.click();

  const handleFile = async (file: File) => {
    try {
      setLoading(true);
      // Ensure the current user is assigned to a client (tenant)
      let clientId = await getCurrentClientId();
      if (!clientId) {
        // Auto-provision a client for this user if missing
        const createdId = await ensureUserClient();
        clientId = createdId;
        toast({
          title: 'Client space created',
          description: 'A private client workspace was created for your account. Proceeding with import...',
        });
      }
      const text = await file.text();
      const rows = parseCsv(text);

      // Expecting headers: first_name,last_name,email,phone_no,source
      const normalized = rows.map(r => ({
        // id/user_id omitted; DB trigger fills user_id; id auto
        firstName: r.first_name ?? r.firstname ?? '',
        lastName: r.last_name ?? r.lastname ?? '',
        email: r.email ?? '',
        phoneNo: r.phone_no ?? r.phone ?? '',
        source: r.source ?? 'csv',
      }));

      // Filter out invalid rows
      const valid = normalized.filter(r => r.email);
      if (valid.length === 0) {
        toast({
          title: 'No valid rows',
          description: 'CSV did not contain any rows with an email field.',
          variant: 'destructive',
        });
        return;
      }

      const action = mode === 'insert' ? insertSalesClients : upsertSalesClients;
      const { count } = await action(valid as any);

      toast({
        title: 'Import complete',
        description: `Imported ${count} records`,
      });
      onImported?.(count);
    } catch (err) {
      console.error('CSV import error', err);
      let description = 'Unknown error';
      if (err instanceof Error) {
        description = err.message;
      } else if (err && typeof err === 'object') {
        // Supabase/Postgrest error shape may include message/details/hint/code
        const anyErr = err as any;
        description = anyErr?.message || anyErr?.details || anyErr?.hint || JSON.stringify(anyErr);
      }
      toast({
        title: 'Import failed',
        description,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <Button onClick={handleChoose} disabled={loading} variant="outline">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" /> Import CSV
          </>
        )}
      </Button>
      <div className="text-xs text-muted-foreground">
        Expected headers: first_name, last_name, email, phone_no, source
      </div>
    </div>
  );
};

export default ImportCsv;
