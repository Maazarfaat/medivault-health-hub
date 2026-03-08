import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getUserLocation, reverseGeocode } from '@/lib/geolocation';

export function SaveLocationButton() {
  const { user, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSaveLocation = async () => {
    if (!user) return;
    setLoading(true);
    const location = await getUserLocation();
    if (location) {
      await supabase.from('profiles').update({
        latitude: location.latitude,
        longitude: location.longitude,
      } as any).eq('user_id', user.id);
      await refreshProfile();
      toast({ title: t('locationSaved') });
    } else {
      toast({ title: t('locationDenied'), variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleSaveLocation} disabled={loading}>
      <MapPin className="mr-2 h-4 w-4" />
      {loading ? t('loading') : t('saveLocation')}
    </Button>
  );
}
