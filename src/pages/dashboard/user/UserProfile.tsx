import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SaveLocationButton } from '@/components/location/SaveLocationButton';

export default function UserProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: profile?.name || '',
    mobile_number: profile?.mobile_number || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      name: form.name,
      mobile_number: form.mobile_number,
    }).eq('user_id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('profileUpdated') });
      setEditing(false);
      refreshProfile();
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('profile')}</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />{t('personalInfo')}</CardTitle>
            {!editing && <Button variant="outline" size="sm" onClick={() => setEditing(true)}>{t('edit')}</Button>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="space-y-1">
                <Label>{t('name')}</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>{t('mobile')}</Label>
                <Input value={form.mobile_number} onChange={e => setForm(f => ({ ...f, mobile_number: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>{saving ? t('loading') : t('save')}</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>{t('cancel')}</Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  {profile?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-lg font-semibold">{profile?.name}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />{profile?.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{profile?.mobile_number || t('notSet')}</span>
                {profile?.mobile_verified && <Badge variant="safe">{t('verified')}</Badge>}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{profile?.latitude ? `${profile.latitude.toFixed(4)}, ${profile.longitude?.toFixed(4)}` : t('notSet')}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />{t('location')}</CardTitle></CardHeader>
        <CardContent>
          <SaveLocationButton />
        </CardContent>
      </Card>
    </div>
  );
}
