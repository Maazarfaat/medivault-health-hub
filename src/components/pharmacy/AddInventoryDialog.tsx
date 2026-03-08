import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, PenLine } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { QrScanner } from '@/components/scanner/QrScanner';

interface AddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
  table: 'pharmacy_inventory' | 'hospital_inventory';
  idField: 'pharmacy_id' | 'hospital_id';
}

export function AddInventoryDialog({ open, onOpenChange, onAdded, table, idField }: AddInventoryDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('manual');
  const [form, setForm] = useState({ name: '', batchNumber: '', expiryDate: '', quantity: '' });

  const handleQrScan = (data: Record<string, string>) => {
    setForm((f) => ({
      ...f,
      name: data.name || f.name,
      batchNumber: data.batchNumber || f.batchNumber,
      expiryDate: data.expiryDate || f.expiryDate,
      quantity: data.quantity || f.quantity,
    }));
    setTab('manual');
    toast({ title: 'QR Scanned', description: 'Details populated. Review and save.' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from(table).insert({
      [idField]: user.id,
      name: form.name,
      batch_number: form.batchNumber || null,
      expiry_date: form.expiryDate,
      quantity: parseInt(form.quantity) || 0,
    } as any);

    setLoading(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Item Added' });
    setForm({ name: '', batchNumber: '', expiryDate: '', quantity: '' });
    onOpenChange(false);
    onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
          <DialogDescription>Scan QR code or enter inventory details manually.</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan"><QrCode className="mr-2 h-4 w-4" />QR Scan</TabsTrigger>
            <TabsTrigger value="manual"><PenLine className="mr-2 h-4 w-4" />Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="scan">
            <QrScanner
              onScan={handleQrScan}
              onError={(msg) => {
                if (msg.includes('not found')) {
                  toast({ title: 'QR Read Failed', description: 'Medicine details not found in QR code.', variant: 'destructive' });
                }
              }}
              onManual={() => setTab('manual')}
            />
          </TabsContent>

          <TabsContent value="manual">
            <form onSubmit={handleSubmit} className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label>Medicine Name *</Label>
                <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>

              <div className="space-y-1">
                <Label>Batch Number</Label>
                <Input value={form.batchNumber} onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Expiry Date *</Label>
                  <Input type="date" required value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Quantity *</Label>
                  <Input type="number" min="0" required value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Adding...' : 'Add to Inventory'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
