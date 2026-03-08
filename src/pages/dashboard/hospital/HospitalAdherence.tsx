import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Pill } from 'lucide-react';

export default function HospitalAdherence() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('patientAdherence')}</h1>
      <Card>
        <CardHeader><CardTitle>{t('patientAdherence')}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Pill className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Patient adherence tracking will show patients who have given consent to share their medication data.</p>
            <p className="text-sm text-muted-foreground mt-2">This feature requires explicit patient consent for data sharing.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
