import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: 'default' | 'primary' | 'safe' | 'warning' | 'expired';
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  description, 
  trend,
  variant = 'default' 
}: StatsCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <p className={cn(
                "mt-2 text-xs font-medium",
                trend.positive ? "text-safe" : "text-expired"
              )}>
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% from last month
              </p>
            )}
          </div>
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            variant === 'default' && "bg-secondary text-foreground",
            variant === 'primary' && "bg-primary/10 text-primary",
            variant === 'safe' && "bg-safe/10 text-safe",
            variant === 'warning' && "bg-warning/10 text-warning",
            variant === 'expired' && "bg-expired/10 text-expired"
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
