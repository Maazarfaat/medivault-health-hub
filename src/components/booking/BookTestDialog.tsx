import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  const [preferredTime, setPreferredTime] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from('blood_test_bookings').insert({
      user_id: user.id,
      test_type: testType,
      appointment_date: new Date(appointmentDate).toISOString(),
      preferred_time: preferredTime || null,
      notes: notes || null,
    });

    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Blood Test Booking Created Successfully', description: 'Your booking request has been sent to diagnostic centres.' });
      setTestType('');
      setAppointmentDate('');
      setPreferredTime('');
      setNotes('');
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
            <Label>Preferred Date *</Label>
            <Input type="date" required value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Preferred Time</Label>
            <Input type="time" value={preferredTime} onChange={e => setPreferredTime(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Additional Notes</Label>
            <Textarea placeholder="Any special requirements..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !testType || !appointmentDate}>
            {loading ? 'Booking...' : 'Book Appointment'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
