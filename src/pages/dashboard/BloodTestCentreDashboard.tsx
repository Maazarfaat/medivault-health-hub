import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TestTube, Clock, CheckCircle, Calendar, MapPin, ExternalLink, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculateDistance, formatDistance, getGoogleMapsLink } from '@/lib/geolocation';
import { SendOfferDialog } from '@/components/offer/SendOfferDialog';
import { StatusTracker } from '@/components/offer/StatusTracker';
import { Tables } from '@/integrations/supabase/types';
import { SaveLocationButton } from '@/components/location/SaveLocationButton';

type Booking = Tables<'blood_test_bookings'>;

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
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

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

  const handleSendOffer = async (offer: { price: number; discount: number; finalPrice: number; estimatedTime: string; notes: string }) => {
    if (!selectedBookingId || !user) return;
    await supabase.from('blood_test_bookings').update({
      status: 'offer_sent' as any,
      centre_id: user.id,
      offer_price: offer.price,
      offer_discount: offer.discount,
      offer_final_price: offer.finalPrice,
      estimated_time: offer.estimatedTime,
      provider_notes: offer.notes,
      provider_name: profile?.name || 'Diagnostic Centre',
    } as any).eq('id', selectedBookingId);
    toast({ title: t('offerSent') });
    fetchBookings();
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    await supabase.from('blood_test_bookings').update({ status } as any).eq('id', id);
    toast({ title: t('statusUpdated') });
    fetchBookings();
  };

  const activeBookings = bookings.filter(b => b.status !== 'completed' && b.status !== 'rejected');
  const completedBookings = bookings.filter(b => b.status === 'completed');

  const stats = {
    totalBookings: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    offersSent: bookings.filter(b => b.status === 'offer_sent').length,
    confirmed: bookings.filter(b => b.status === 'confirmed' || b.status === 'processing').length,
    completed: completedBookings.length,
  };

  const dashboardUser = {
    id: user?.id || '', name: profile?.name || 'Diagnostic Centre', email: profile?.email || '',
    mobileNumber: profile?.mobile_number || '', mobileVerified: profile?.mobile_verified || false,
    role: (role || 'bloodTestCentre') as any, profileCompletion: profile?.profile_completion || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="warning">{t('pending')}</Badge>;
      case 'offer_sent': return <Badge className="bg-blue-500 text-white">{t('offerSent')}</Badge>;
      case 'confirmed': return <Badge variant="safe">{t('confirmed')}</Badge>;
      case 'processing': return <Badge variant="default">{t('processing')}</Badge>;
      case 'completed': return <Badge variant="safe">{t('completed')}</Badge>;
      case 'rejected': return <Badge variant="expired">{t('rejected')}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout user={dashboardUser} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('diagnosticDashboard')}</h1>
            <p className="text-muted-foreground">{t('manageBookings')}</p>
          </div>
          <SaveLocationButton />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title={t('totalBookings')} value={stats.totalBookings} icon={<TestTube className="h-6 w-6" />} variant="primary" />
          <StatsCard title={t('pending')} value={stats.pending} icon={<Clock className="h-6 w-6" />} variant="warning" />
          <StatsCard title={t('offersSent')} value={stats.offersSent} icon={<Send className="h-6 w-6" />} variant="default" />
          <StatsCard title={t('completed')} value={stats.completed} icon={<CheckCircle className="h-6 w-6" />} variant="safe" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('bookingRequests')}</CardTitle>
          </CardHeader>
          <CardContent>
            {activeBookings.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">{t('noBookings')}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('userName')}</TableHead>
                    <TableHead>{t('mobile')}</TableHead>
                    <TableHead>{t('testTypeCol')}</TableHead>
                    <TableHead>{t('requestedDate')}</TableHead>
                    <TableHead>{t('distance')}</TableHead>
                    <TableHead>{t('location')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('orderTracking')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.userName}</TableCell>
                      <TableCell>{booking.userMobile}</TableCell>
                      <TableCell>{booking.test_type}</TableCell>
                      <TableCell>{new Date(booking.appointment_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {booking.distanceKm != null ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {formatDistance(booking.distanceKm)}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {booking.userLat && booking.userLng ? (
                          <div className="space-y-1">
                            {booking.userAddress && (
                              <p className="text-xs text-muted-foreground max-w-[200px] truncate" title={booking.userAddress}>
                                {booking.userAddress}
                              </p>
                            )}
                            <a
                              href={getGoogleMapsLink(booking.userLat, booking.userLng)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {t('viewLocation')}
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">{t('noLocation')}</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell><StatusTracker currentStatus={booking.status} type="booking" /></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {booking.status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => { setSelectedBookingId(booking.id); setOfferDialogOpen(true); }}>
                                <Send className="mr-1 h-3 w-3" />{t('sendOffer')}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(booking.id, 'rejected')}>
                                {t('reject')}
                              </Button>
                            </>
                          )}
                          {booking.status === 'confirmed' && (
                            <Button size="sm" onClick={() => handleStatusUpdate(booking.id, 'processing')}>
                              {t('processing')}
                            </Button>
                          )}
                          {booking.status === 'processing' && (
                            <Button size="sm" variant="safe" onClick={() => handleStatusUpdate(booking.id, 'completed')}>
                              {t('complete')}
                            </Button>
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

        {completedBookings.length > 0 && (
          <Card>
            <CardHeader><CardTitle>{t('completedTests')}</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('userName')}</TableHead>
                    <TableHead>{t('testTypeCol')}</TableHead>
                    <TableHead>{t('requestedDate')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedBookings.map(b => (
                    <TableRow key={b.id}>
                      <TableCell>{b.userName}</TableCell>
                      <TableCell>{b.test_type}</TableCell>
                      <TableCell>{new Date(b.appointment_date).toLocaleDateString()}</TableCell>
                      <TableCell><Badge variant="safe">{t('completed')}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <SendOfferDialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen} onSubmit={handleSendOffer} title={t('sendTestOffer')} />
    </DashboardLayout>
  );
}
