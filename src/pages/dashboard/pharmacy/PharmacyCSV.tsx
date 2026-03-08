import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CSVUploadDialog } from '@/components/pharmacy/CSVUploadDialog';

export default function PharmacyCSV() {
  const { t } = useLanguage();
  const [csvOpen, setCsvOpen] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('csvUpload')}</h1>
      <p className="text-muted-foreground">Upload billing CSV files to bulk-add inventory or sales records.</p>
      <Button className="gap-2" onClick={() => setCsvOpen(true)}>
        <FileSpreadsheet className="h-5 w-5" />{t('csvUpload')}
      </Button>
      <CSVUploadDialog open={csvOpen} onOpenChange={setCsvOpen} onUploaded={() => {}} />
    </div>
  );
}
