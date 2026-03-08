import { differenceInDays } from 'date-fns';

export type MedicineStatusType = 'safe' | 'expiring' | 'expired';

export function getMedicineStatus(expiryDate: string): MedicineStatusType {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = differenceInDays(expiry, today);
  
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'expiring';
  return 'safe';
}

export function isLowStock(quantity: number): boolean {
  return quantity > 0 && quantity <= 5;
}

export function needsRestock(quantity: number): boolean {
  return quantity === 0;
}
