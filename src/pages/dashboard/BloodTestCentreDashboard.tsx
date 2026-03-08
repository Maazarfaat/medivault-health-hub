import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TestTube, Clock, CheckCircle, Calendar, Check, MapPin, ExternalLink, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculateDistance, , getGoogleMapsLinkformatDistance } from '@/lib/geolocation';
import { Tables, Database } from '@/integrations/supabase/types';

type Booking = Tables<'blood_test_bookings'>;
type BookingStatus = Database['public']['Enums']['booking_status'];

interface BookingWithProfile extends Booking {
  userName?: string;
  userMobile?: string;
  distanceKm?: number | null;
  userAddress?: string | null;
  userLat?: number | null;
  userLng?: number | null;
}

export default function BloodTestCentreDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, profile, role, signOut } = useAuth();
  const [bookings, setBookings] = useState<BookingWithProfile[]>([]);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('blood_test_bookings')
      .select('*')
      .order('appointment_date', { ascending: true });

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(b => b.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, mobile_number')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const centreLat = profile?.latitude;
      const centreLng = profile?.longitude;

      const enriched: BookingWithProfile[] = data.map(b => {
        const userLat = b.user_latitude;
        const userLng = b.user_longitude;
        let dist: number | null = null;
        if (centreLat && centreLng && userLat && userLng) {
          dist = calculateDistance(centreLat, centreLng, userLat, userLng);
        }
        return {
          ...b,
          userName: profileMap.get(b.user_id)?.name || 'Unknown',
          userMobile: profileMap.get(b.user_id)?.mobile_number || 'N/A',
          distanceKm: dist,
          userAddress: (b as any).user_address || null,
          userLat: userLat,
          userLng: userLng,
        };
      });
      setBookings(enriched);
    } else {
      setBookings([]);
    }
  }, [user, profile]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const handleUpdateStatus = async (bookingId: string, status: BookingStatus) => {
    const updateData: any = { status };
    if (status === 'accepted') {
      updateData.centre_id = user?.id;
    }
    const { error } = await supabase.from('blood_test_bookings').update(updateData).eq('id', bookingId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('bookingUpdated'), description: `${t('statusChanged')} ${status}` });
      fetchBookings();
    }
  };

  const stats = {
    totalBookings: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    accepted: bookings.filter(b => b.status === 'accepted').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  const dashboardUser = {
    id: user?.id || '', name: profile?.name || 'Diagnostic Centre', email: profile?.email || '',
    mobileNumber: profile?.mobile_number || '', mobileVerified: profile?.mobile_verified || false,
    role: (role || 'bloodTestCentre') as any, profileCompletion: profile?.profile_completion || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="warning">{t('pending')}</Badge>;
      case 'accepted': return <Badge variant="default">{t('accepted')}</Badge>;
      case 'completed': return <Badge variant="safe">{t('completed')}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout user={dashboardUser} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('diagnosticDashboard')}</h1>
          <p className="text-muted-foreground">{t('manageBookings')}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title={t('totalBookings')} value={stats.totalBookings} icon={<TestTube className="h-6 w-6" />} variant="primary" />
          <StatsCard title={t('pending')} value={stats.pending} icon={<Clock className="h-6 w-6" />} variant="warning" />
          <StatsCard title={t('accepted')} value={stats.accepted} icon={<Calendar className="h-6 w-6" />} variant="default" />
          <StatsCard title={t('completed')} value={stats.completed} icon={<CheckCircle className="h-6 w-6" />} variant="safe" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('bookingRequests')}</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">{t('noBookings')}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('userName')}</TableHead>
                    <TableHead>{t('mobile')}</TableHead>
                    <TableHead>{t('testTypeCol')}</TableHead>
                    <TableHead>{t('requestedDate')}</TableHead>
                    <TableHead>{t('time')}</TableHead>
                    <TableHead>{t('distance')}</TableHead>
                    <TableHead>{t('location')}</TableHead>
                    <TableHead>{t('notes')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.userName}</TableCell>
                      <TableCell>{booking.userMobile}</TableCell>
                      <TableCell>{booking.test_type}</TableCell>
                      <TableCell>{new Date(booking.appointment_date).toLocaleDateString()}</TableCell>
                      <TableCell>{booking.preferred_time || '—'}</TableCell>
                      <TableCell>
                        {booking.distanceKm != null ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {formatDistance(booking.distanceKm)}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">{booking.notes || '—'}</TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {booking.status === 'pending' && (
                            <Button size="sm" variant="default" onClick={() => handleUpdateStatus(booking.id, 'accepted')}>
                              <Check className="mr-1 h-4 w-4" />{t('accept')}
                            </Button>
                          )}
                          {booking.status === 'accepted' && (
                            <Button size="sm" onClick={() => handleUpdateStatus(booking.id, 'completed')}>
                              <CheckCircle className="mr-1 h-4 w-4" />{t('complete')}
                            </Button>
                          )}
                          {booking.status === 'completed' && (
                            <span className="text-sm text-muted-foreground">{t('done')}</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
