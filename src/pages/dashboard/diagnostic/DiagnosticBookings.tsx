import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, ExternalLink, Send, Star, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculateDistance, formatDistance, getGoogleMapsLink } from '@/lib/geolocation';
import { SendOfferDialog } from '@/components/offer/SendOfferDialog';
import { StatusTracker } from '@/components/offer/StatusTracker';
import { UploadReportDialog } from '@/components/report/UploadReportDialog';
import { Tables } from '@/integrations/supabase/types';

type Booking = Tables<'blood_test_bookings'>;

interface BookingWithProfile extends Booking {
  userName?: string;
  userMobile?: string;
  distanceKm?: number | null;
  userAddress?: string | null;
  userLat?: number | null;
  userLng?: number | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  userName?: string;
}

export default function DiagnosticBookings() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<BookingWithProfile[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadBookingId, setUploadBookingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('blood_test_bookings').select('*').order('appointment_date', { ascending: true });

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(b => b.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, name, mobile_number').in('user_id', userIds);
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
          userLat, userLng,
        };
      });
      setBookings(enriched);
    } else {
      setBookings([]);
    }

    const { data: reviewData } = await supabase.from('reviews' as any).select('*').eq('provider_id', user.id);
    if (reviewData && (reviewData as any[]).length > 0) {
      const reviewUserIds = [...new Set((reviewData as any[]).map(r => r.user_id))];
      const { data: reviewProfiles } = await supabase.from('profiles').select('user_id, name').in('user_id', reviewUserIds);
      const rpMap = new Map(reviewProfiles?.map(p => [p.user_id, p]) || []);
      setReviews((reviewData as any[]).map(r => ({ ...r, userName: rpMap.get(r.user_id)?.name || 'User' })));
    }
  }, [user, profile]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

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

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('bookingRequests')}</h1>

      <Card>
        <CardHeader><CardTitle>{t('bookingRequests')}</CardTitle></CardHeader>
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
                          <MapPin className="h-3 w-3" />{formatDistance(booking.distanceKm)}
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {booking.userLat && booking.userLng ? (
                        <div className="space-y-1">
                          {booking.userAddress && (
                            <p className="text-xs text-muted-foreground max-w-[200px] truncate" title={booking.userAddress}>{booking.userAddress}</p>
                          )}
                          <a href={getGoogleMapsLink(booking.userLat, booking.userLng)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            <ExternalLink className="h-3 w-3" />{t('viewLocation')}
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
                          <>
                            <Button size="sm" variant="outline" onClick={() => { setUploadBookingId(booking.id); setUploadDialogOpen(true); }}>
                              <Upload className="mr-1 h-3 w-3" />Upload Report
                            </Button>
                            {booking.report_url && (
                              <Button size="sm" variant="default" onClick={() => handleStatusUpdate(booking.id, 'completed')}>
                                {t('complete')}
                              </Button>
                            )}
                          </>
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
                  <TableHead>Report</TableHead>
                  <TableHead>{t('status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedBookings.map(b => (
                  <TableRow key={b.id}>
                    <TableCell>{b.userName}</TableCell>
                    <TableCell>{b.test_type}</TableCell>
                    <TableCell>{new Date(b.appointment_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {b.report_url ? (
                        <a href={b.report_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View Report</a>
                      ) : '—'}
                    </TableCell>
                    <TableCell><Badge variant="safe">{t('completed')}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />Reviews Received
              {avgRating && <Badge variant="safe">⭐ {avgRating}/5</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{r.userName}</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <SendOfferDialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen} onSubmit={handleSendOffer} title={t('sendTestOffer')} />
      {uploadBookingId && (
        <UploadReportDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} bookingId={uploadBookingId} onUploaded={fetchBookings} />
      )}
    </div>
  );
}
