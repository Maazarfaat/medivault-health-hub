import { Pill, Calendar, Package, AlertTriangle, RefreshCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserMedicine } from '@/types';
import { cn } from '@/lib/utils';

interface MedicineCardProps {
  medicine: UserMedicine;
  onRestock?: () => void;
  showAdherence?: boolean;
}

export function MedicineCard({ medicine, onRestock, showAdherence = true }: MedicineCardProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'safe': return 'safe';
      case 'expiring': return 'warning';
      case 'expired': return 'expired';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'safe': return 'Safe';
      case 'expiring': return 'Expiring Soon';
      case 'expired': return 'Expired';
      default: return status;
    }
  };

  const adherenceScore = medicine.prescribedDoses && medicine.dosesTaken
    ? Math.round((medicine.dosesTaken / medicine.prescribedDoses) * 100)
    : null;

  const isLowStock = medicine.quantity <= 5 && medicine.quantity > 0;
  const needsRestock = medicine.quantity === 0;

  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-elevated",
      medicine.status === 'expired' && "opacity-75"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              medicine.status === 'safe' && "bg-safe/10 text-safe",
              medicine.status === 'expiring' && "bg-warning/10 text-warning",
              medicine.status === 'expired' && "bg-expired/10 text-expired"
            )}>
              <Pill className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{medicine.name}</h3>
              <p className="text-xs text-muted-foreground">Batch: {medicine.batchNumber}</p>
            </div>
          </div>
          <Badge variant={getStatusVariant(medicine.status)}>
            {getStatusLabel(medicine.status)}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className={cn(
              (isLowStock || needsRestock) && "text-warning font-medium"
            )}>
              {medicine.quantity} units
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(medicine.expiryDate).toLocaleDateString()}</span>
          </div>
        </div>

        {medicine.dosage && (
          <p className="mt-3 text-xs text-muted-foreground">
            Dosage: {medicine.dosage}
          </p>
        )}

        {/* Adherence Score */}
        {showAdherence && adherenceScore !== null && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Adherence</span>
              <span className={cn(
                "font-medium",
                adherenceScore >= 80 && "text-safe",
                adherenceScore >= 50 && adherenceScore < 80 && "text-warning",
                adherenceScore < 50 && "text-expired"
              )}>
                {adherenceScore}%
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  adherenceScore >= 80 && "bg-safe",
                  adherenceScore >= 50 && adherenceScore < 80 && "bg-warning",
                  adherenceScore < 50 && "bg-expired"
                )}
                style={{ width: `${adherenceScore}%` }}
              />
            </div>
          </div>
        )}

        {/* Warnings and Actions */}
        {(isLowStock || needsRestock) && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-warning/10 p-2">
            <div className="flex items-center gap-2 text-sm text-warning">
              <AlertTriangle className="h-4 w-4" />
              <span>{needsRestock ? 'Out of stock' : 'Low stock'}</span>
            </div>
            {onRestock && (
              <Button size="sm" variant="warning" onClick={onRestock}>
                <RefreshCcw className="mr-1 h-3 w-3" />
                Restock
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
