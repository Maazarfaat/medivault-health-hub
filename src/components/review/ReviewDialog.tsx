import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  providerType: 'pharmacy' | 'bloodTestCentre';
  requestId: string;
  onReviewed?: () => void;
}

export function ReviewDialog({ open, onOpenChange, providerId, providerType, requestId, onReviewed }: ReviewDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0) return;
    setSubmitting(true);
    await supabase.from('reviews' as any).insert({
      user_id: user.id,
      provider_id: providerId,
      provider_type: providerType,
      request_id: requestId,
      rating,
      comment: comment || null,
    } as any);
    setSubmitting(false);
    toast({ title: 'Review Submitted', description: 'Thank you for your feedback!' });
    setRating(0);
    setComment('');
    onOpenChange(false);
    onReviewed?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHoveredRating(i)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-0.5"
                >
                  <Star className={cn(
                    "h-8 w-8 transition-colors",
                    (hoveredRating || rating) >= i
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  )} />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Comment (optional)</Label>
            <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience..." rows={3} />
          </div>
          <Button type="submit" className="w-full" disabled={rating === 0 || submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
