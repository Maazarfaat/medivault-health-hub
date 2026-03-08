import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface InventoryItem {
  id: string;
  name: string;
  batch_number: string | null;
  expiry_date: string;
  quantity: number;
}

interface SellMedicineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: InventoryItem[];
  onSold: () => void;
}

export function SellMedicineDialog({ open, onOpenChange, inventory, onSold }: SellMedicineDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customerMobile, setCustomerMobile] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [quantity, setQuantity] = useState('');

  const selectedItem = inventory.find(i => i.id === selectedMedicine);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedItem) return;

    const qty = parseInt(quantity);
    if (qty > selectedItem.quantity) {
      toast({ title: 'Error', description: 'Not enough stock', variant: 'destructive' });
      return;
    }

    setLoading(true);

    // Find customer by mobile
    const { data: customerId } = await supabase.rpc('find_user_by_mobile', { _mobile: customerMobile });

    // Record sale
    await supabase.from('sales_records').insert({
      pharmacy_id: user.id,
      customer_mobile: customerMobile,
      customer_id: customerId || null,
      medicine_name: selectedItem.name,
      batch_number: selectedItem.batch_number,
      expiry_date: selectedItem.expiry_date,
      quantity: qty,
    });

    // Reduce inventory
    await supabase.from('pharmacy_inventory')
      .update({ quantity: selectedItem.quantity - qty })
      .eq('id', selectedItem.id);

    // Add to customer account if found
    if (customerId) {
      await supabase.from('user_medicines').insert({
        user_id: customerId,
        name: selectedItem.name,
        batch_number: selectedItem.batch_number,
        expiry_date: selectedItem.expiry_date,
        quantity: qty,
        added_method: 'pharmacy',
      });
    }

    setLoading(false);
    toast({
      title: 'Sale Recorded',
      description: customerId ? 'Medicine added to customer account.' : 'Customer not found — sale recorded without linking.',
    });
    setCustomerMobile('');
    setSelectedMedicine('');
    setQuantity('');
    onOpenChange(false);
    onSold();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sell Medicine</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Customer Mobile Number *</Label>
            <Input required value={customerMobile} onChange={e => setCustomerMobile(e.target.value)} placeholder="+1234567890" />
          </div>
          <div className="space-y-1">
            <Label>Medicine *</Label>
            <Select value={selectedMedicine} onValueChange={setSelectedMedicine}>
              <SelectTrigger><SelectValue placeholder="Select medicine" /></SelectTrigger>
              <SelectContent>
                {inventory.filter(i => i.quantity > 0).map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} (Stock: {item.quantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Quantity *</Label>
            <Input type="number" min="1" max={selectedItem?.quantity || 999} required value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !selectedMedicine}>
            {loading ? 'Processing...' : 'Complete Sale'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
