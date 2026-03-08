import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  onUploaded?: () => void;
}

export function UploadReportDialog({ open, onOpenChange, bookingId, onUploaded }: UploadReportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;
    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const filePath = `${bookingId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('test-reports')
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: 'Upload Error', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('test-reports').getPublicUrl(filePath);

    await supabase.from('blood_test_bookings').update({
      report_url: urlData.publicUrl,
      report_notes: notes || null,
    } as any).eq('id', bookingId);

    setUploading(false);
    toast({ title: 'Report Uploaded', description: 'The test report has been uploaded successfully.' });
    setFile(null);
    setNotes('');
    onOpenChange(false);
    onUploaded?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Upload Test Report</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Report File (PDF or Image) *</Label>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={e => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Report Notes (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes about the report..." rows={2} />
          </div>
          <Button type="submit" className="w-full" disabled={!file || uploading}>
            {uploading ? 'Uploading...' : 'Upload Report'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
