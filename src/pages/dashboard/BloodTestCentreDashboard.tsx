import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TestTube, Clock, CheckCircle, Calendar, Check, X, Ban } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables, Database } from '@/integrations/supabase/types';

type Booking = Tables<'blood_test_bookings'>;
type BookingStatus = Database['public']['Enums']['booking_status'];

interface BookingWithProfile extends Booking {
  userName?: string;
  userMobile?: string;
  preferred_time?: string;
}

export default function BloodTestCentreDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, role, signOut } = useAuth();
  const [bookings, setBookings] = useState<BookingWithProfile[]>([]);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('blood_test_bookings')
      .select('*')
      .order('appointment_date', { ascending: true });

    if (data && data.length > 0) {
      // Fetch user profiles for each booking
      const userIds = [...new Set(data.map(b => b.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, mobile_number')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const enriched: BookingWithProfile[] = data.map(b => ({
        ...b,
        userName: profileMap.get(b.user_id)?.name || 'Unknown',
        userMobile: profileMap.get(b.user_id)?.mobile_number || 'N/A',
      }));
      setBookings(enriched);
    } else {
      setBookings([]);
    }
  }, [user]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const handleUpdateStatus = async (bookingId: string, status: BookingStatus) => {
    const { error } = await supabase.from('blood_test_bookings').update({ status }).eq('id', bookingId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Booking Updated', description: `Status changed to ${status}` });
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
      case 'pending': return <Badge variant="warning">Pending</Badge>;
      case 'accepted': return <Badge variant="default">Accepted</Badge>;
      case 'completed': return <Badge variant="safe">Completed</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout user={dashboardUser} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Diagnostic Centre Dashboard</h1>
          <p className="text-muted-foreground">Manage blood test bookings</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Bookings" value={stats.totalBookings} icon={<TestTube className="h-6 w-6" />} variant="primary" />
          <StatsCard title="Pending" value={stats.pending} icon={<Clock className="h-6 w-6" />} variant="warning" />
          <StatsCard title="Accepted" value={stats.accepted} icon={<Calendar className="h-6 w-6" />} variant="default" />
          <StatsCard title="Completed" value={stats.completed} icon={<CheckCircle className="h-6 w-6" />} variant="safe" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Booking Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No bookings yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Test Type</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.userName}</TableCell>
                      <TableCell>{booking.userMobile}</TableCell>
                      <TableCell>{booking.test_type}</TableCell>
                      <TableCell>{new Date(booking.appointment_date).toLocaleDateString()}</TableCell>
                      <TableCell>{(booking as any).preferred_time || '—'}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{booking.notes || '—'}</TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {booking.status === 'pending' && (
                            <>
                              <Button size="sm" variant="default" onClick={() => handleUpdateStatus(booking.id, 'accepted')}>
                                <Check className="mr-1 h-4 w-4" />Accept
                              </Button>
                            </>
                          )}
                          {booking.status === 'accepted' && (
                            <Button size="sm" onClick={() => handleUpdateStatus(booking.id, 'completed')}>
                              <CheckCircle className="mr-1 h-4 w-4" />Complete
                            </Button>
                          )}
                          {booking.status === 'completed' && (
                            <span className="text-sm text-muted-foreground">Done</span>
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
