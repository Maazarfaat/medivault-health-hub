import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface StatusTrackerProps {
  currentStatus: string;
  type: 'booking' | 'restock';
}

const bookingSteps = ['pending', 'offer_sent', 'confirmed', 'processing', 'completed'];
const restockSteps = ['pending', 'offer_sent', 'confirmed', 'processing', 'delivered', 'fulfilled'];

export function StatusTracker({ currentStatus, type }: StatusTrackerProps) {
  const { t } = useLanguage();
  const steps = type === 'booking' ? bookingSteps : restockSteps;
  
  if (currentStatus === 'rejected') {
    return (
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-destructive" />
        <span className="text-sm font-medium text-destructive">{t('rejected')}</span>
      </div>
    );
  }

  const currentIndex = steps.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step} className="flex items-center gap-1">
            <div className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors",
              isCompleted && "bg-primary text-primary-foreground",
              isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary/30",
              !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
            )}>
              {isCompleted ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={cn("h-0.5 w-4", i < currentIndex ? "bg-primary" : "bg-muted")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
