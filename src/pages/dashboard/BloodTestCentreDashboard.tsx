import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TestTube, Clock, CheckCircle, Calendar, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables, Database } from '@/integrations/supabase/types';

type Booking = Tables<'blood_test_bookings'>;
type BookingStatus = Database['public']['Enums']['booking_status'];

export default function BloodTestCentreDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, role, signOut } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('blood_test_bookings').select('*').order('appointment_date', { ascending: true });
    setBookings(data || []);
  }, [user]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const handleUpdateStatus = async (bookingId: string, status: BookingStatus) => {
    await supabase.from('blood_test_bookings').update({ status }).eq('id', bookingId);
    toast({ title: 'Booking Updated', description: `Status changed to ${status}` });
    fetchBookings();
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
            <CardTitle>Blood Test Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No bookings yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test Type</TableHead>
                    <TableHead>Appointment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.test_type}</TableCell>
                      <TableCell>{new Date(booking.appointment_date).toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {booking.status === 'pending' && (
                            <>
                              <Button size="sm" variant="safe" onClick={() => handleUpdateStatus(booking.id, 'accepted')}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(booking.id, 'completed')}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {booking.status === 'accepted' && (
                            <Button size="sm" onClick={() => handleUpdateStatus(booking.id, 'completed')}>Mark Complete</Button>
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
