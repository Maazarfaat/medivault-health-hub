import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { FileSpreadsheet, Upload } from 'lucide-react';

interface CSVUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded: () => void;
}

interface CSVRow {
  medicineName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  customerMobile: string;
}

export function CSVUploadDialog({ open, onOpenChange, onUploaded }: CSVUploadDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ total: number; processed: number; errors: number } | null>(null);

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.trim().split('\n');
    return lines.slice(1).map(line => {
      const [medicineName, batchNumber, expiryDate, quantity, customerMobile] = line.split(',').map(s => s.trim());
      return { medicineName, batchNumber, expiryDate, quantity: parseInt(quantity) || 0, customerMobile };
    }).filter(r => r.medicineName && r.expiryDate);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    const text = await file.text();
    const rows = parseCSV(text);
    let processed = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        // Update/add inventory
        const { data: existing } = await supabase
          .from('pharmacy_inventory')
          .select('id, quantity')
          .eq('pharmacy_id', user.id)
          .eq('name', row.medicineName)
          .eq('batch_number', row.batchNumber)
          .single();

        if (existing) {
          await supabase.from('pharmacy_inventory')
            .update({ quantity: existing.quantity + row.quantity })
            .eq('id', existing.id);
        } else {
          await supabase.from('pharmacy_inventory').insert({
            pharmacy_id: user.id,
            name: row.medicineName,
            batch_number: row.batchNumber,
            expiry_date: row.expiryDate,
            quantity: row.quantity,
          });
        }

        // Link to customer
        if (row.customerMobile) {
          const { data: customerId } = await supabase.rpc('find_user_by_mobile', { _mobile: row.customerMobile });
          if (customerId) {
            await supabase.from('user_medicines').insert({
              user_id: customerId,
              name: row.medicineName,
              batch_number: row.batchNumber,
              expiry_date: row.expiryDate,
              quantity: row.quantity,
              added_method: 'csv',
            });
          }

          await supabase.from('sales_records').insert({
            pharmacy_id: user.id,
            customer_mobile: row.customerMobile,
            customer_id: customerId || null,
            medicine_name: row.medicineName,
            batch_number: row.batchNumber,
            expiry_date: row.expiryDate,
            quantity: row.quantity,
          });
        }

        processed++;
      } catch {
        errors++;
      }
    }

    // Record upload
    await supabase.from('csv_uploads').insert({
      pharmacy_id: user.id,
      total_records: rows.length,
      processed_records: processed,
      error_records: errors,
    });

    setResult({ total: rows.length, processed, errors });
    setLoading(false);
    toast({ title: 'CSV Processed', description: `${processed}/${rows.length} records processed.` });
    onUploaded();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setResult(null); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>CSV Billing Upload</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-8 text-center">
            <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              CSV format: MedicineName, BatchNumber, ExpiryDate, Quantity, CustomerMobile
            </p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleUpload} />
            <Button className="mt-4" onClick={() => fileRef.current?.click()} disabled={loading}>
              <Upload className="mr-2 h-4 w-4" />
              {loading ? 'Processing...' : 'Upload CSV'}
            </Button>
          </div>
          {result && (
            <div className="rounded-lg bg-secondary p-4 text-sm">
              <p><strong>Total Records:</strong> {result.total}</p>
              <p className="text-safe"><strong>Processed:</strong> {result.processed}</p>
              {result.errors > 0 && <p className="text-expired"><strong>Errors:</strong> {result.errors}</p>}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
