import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

interface DeliverMedicineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicineName: string;
  quantity: number;
  onDeliver: (details: {
    batchNumber: string;
    manufacturingDate: string;
    expiryDate: string;
    quantity: number;
  }) => void;
}

export function DeliverMedicineDialog({ open, onOpenChange, medicineName, quantity, onDeliver }: DeliverMedicineDialogProps) {
  const { t } = useLanguage();
  const [batchNumber, setBatchNumber] = useState('');
  const [manufacturingDate, setManufacturingDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [deliveredQty, setDeliveredQty] = useState(quantity);

  const handleSubmit = () => {
    if (!batchNumber || !manufacturingDate || !expiryDate || deliveredQty <= 0) return;
    onDeliver({ batchNumber, manufacturingDate, expiryDate, quantity: deliveredQty });
    setBatchNumber('');
    setManufacturingDate('');
    setExpiryDate('');
    setDeliveredQty(quantity);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deliver Medicine Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t('medicineName')}</Label>
            <Input value={medicineName} disabled />
          </div>
          <div>
            <Label>{t('batchNumber')}</Label>
            <Input value={batchNumber} onChange={e => setBatchNumber(e.target.value)} placeholder="e.g. BATCH-2026-001" />
          </div>
          <div>
            <Label>Manufacturing Date</Label>
            <Input type="date" value={manufacturingDate} onChange={e => setManufacturingDate(e.target.value)} />
          </div>
          <div>
            <Label>{t('expiryDate')}</Label>
            <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
          </div>
          <div>
            <Label>{t('quantity')}</Label>
            <Input type="number" min={1} value={deliveredQty} onChange={e => setDeliveredQty(Number(e.target.value))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!batchNumber || !manufacturingDate || !expiryDate || deliveredQty <= 0}>
            Confirm Delivery
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
