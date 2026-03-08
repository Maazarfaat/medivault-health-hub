import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';

interface SendOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (offer: { price: number; discount: number; finalPrice: number; estimatedTime: string; notes: string }) => void;
  title: string;
}

export function SendOfferDialog({ open, onOpenChange, onSubmit, title }: SendOfferDialogProps) {
  const { t } = useLanguage();
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [notes, setNotes] = useState('');

  const numPrice = parseFloat(price) || 0;
  const numDiscount = parseFloat(discount) || 0;
  const finalPrice = Math.max(0, numPrice - numDiscount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ price: numPrice, discount: numDiscount, finalPrice, estimatedTime, notes });
    setPrice('');
    setDiscount('0');
    setEstimatedTime('');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>{t('price')} (₹) *</Label>
            <Input type="number" min="0" step="0.01" required value={price} onChange={e => setPrice(e.target.value)} placeholder="500" />
          </div>
          <div className="space-y-1">
            <Label>{t('discount')} (₹)</Label>
            <Input type="number" min="0" step="0.01" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" />
          </div>
          <div className="rounded-md bg-muted p-3">
            <p className="text-sm font-medium">{t('finalPrice')}: <span className="text-lg text-primary">₹{finalPrice.toFixed(2)}</span></p>
          </div>
          <div className="space-y-1">
            <Label>{t('estimatedTime')} *</Label>
            <Input required value={estimatedTime} onChange={e => setEstimatedTime(e.target.value)} placeholder={t('estimatedTimePlaceholder')} />
          </div>
          <div className="space-y-1">
            <Label>{t('additionalNotes')}</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder={t('offerNotesPlaceholder')} />
          </div>
          <Button type="submit" className="w-full" disabled={!price || !estimatedTime}>
            {t('sendOffer')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
