import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, PenLine } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { QrScanner } from '@/components/scanner/QrScanner';

type AddMethod = Database['public']['Enums']['add_method'];

interface AddMedicineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
  defaultMethod?: AddMethod;
}

export function AddMedicineDialog({ open, onOpenChange, onAdded, defaultMethod = 'manual' }: AddMedicineDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<string>(defaultMethod === 'scan' ? 'scan' : 'manual');
  const [scanned, setScanned] = useState(false);
  const [form, setForm] = useState({
    name: '', batchNumber: '', expiryDate: '', quantity: '', dosage: '', prescribedDoses: '',
  });

  const handleQrScan = (data: Record<string, string>) => {
    setForm(f => ({
      ...f,
      name: data.name || f.name,
      batchNumber: data.batchNumber || f.batchNumber,
      expiryDate: data.expiryDate || f.expiryDate,
      quantity: data.quantity || f.quantity,
      dosage: data.dosage || f.dosage,
    }));
    setScanned(true);
    setTab('manual');
    toast({ title: 'QR Scanned', description: 'Medicine details populated. Review and save.' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const method: AddMethod = scanned ? 'scan' : 'manual';
    const { error } = await supabase.from('user_medicines').insert({
      user_id: user.id,
      name: form.name,
      batch_number: form.batchNumber || null,
      expiry_date: form.expiryDate,
      quantity: parseInt(form.quantity) || 0,
      added_method: method,
      dosage: form.dosage || null,
      prescribed_doses: form.prescribedDoses ? parseInt(form.prescribedDoses) : null,
      doses_taken: 0,
    });

    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Medicine Added' });
      setForm({ name: '', batchNumber: '', expiryDate: '', quantity: '', dosage: '', prescribedDoses: '' });
      setScanned(false);
      onOpenChange(false);
      onAdded();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setScanned(false); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Medicine</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan"><QrCode className="mr-2 h-4 w-4" />QR Scan</TabsTrigger>
            <TabsTrigger value="manual"><PenLine className="mr-2 h-4 w-4" />Manual</TabsTrigger>
          </TabsList>
          <TabsContent value="scan">
            <QrScanner onScan={handleQrScan} onManual={() => setTab('manual')} />
          </TabsContent>
          <TabsContent value="manual">
            <form onSubmit={handleSubmit} className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label>Medicine Name *</Label>
                <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Batch Number</Label>
                <Input value={form.batchNumber} onChange={e => setForm(f => ({ ...f, batchNumber: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Expiry Date *</Label>
                  <Input type="date" required value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Quantity *</Label>
                  <Input type="number" min="0" required value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Dosage (optional)</Label>
                <Input value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))} placeholder="e.g. 1 tablet twice daily" />
              </div>
              <div className="space-y-1">
                <Label>Prescribed Doses (optional)</Label>
                <Input type="number" min="0" value={form.prescribedDoses} onChange={e => setForm(f => ({ ...f, prescribedDoses: e.target.value }))} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Adding...' : 'Add Medicine'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
