import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const testTypes = [
  'Complete Blood Count (CBC)',
  'Lipid Profile',
  'HbA1c',
  'Thyroid Function Test',
  'Liver Function Test',
  'Kidney Function Test',
  'Vitamin D Test',
  'Vitamin B12 Test',
  'Iron Studies',
  'Blood Glucose Fasting',
];

interface BookTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBooked: () => void;
}

export function BookTestDialog({ open, onOpenChange, onBooked }: BookTestDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testType, setTestType] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from('blood_test_bookings').insert({
      user_id: user.id,
      test_type: testType,
      appointment_date: new Date(appointmentDate).toISOString(),
    });

    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Test Booked', description: 'Your appointment has been scheduled.' });
      setTestType('');
      setAppointmentDate('');
      onOpenChange(false);
      onBooked();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book Blood Test</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Test Type *</Label>
            <Select value={testType} onValueChange={setTestType}>
              <SelectTrigger><SelectValue placeholder="Select test type" /></SelectTrigger>
              <SelectContent>
                {testTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Appointment Date & Time *</Label>
            <Input type="datetime-local" required value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !testType}>
            {loading ? 'Booking...' : 'Book Appointment'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
