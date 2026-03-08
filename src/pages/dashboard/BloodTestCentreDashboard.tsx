import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  TestTube,
  Clock, 
  CheckCircle,
  Calendar,
  Check,
  X
} from 'lucide-react';
import { mockUsers, mockBloodTestBookings } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { BookingStatus } from '@/types';

export default function BloodTestCentreDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState(mockBloodTestBookings);

  const user = mockUsers[3]; // Blood Test Centre user

  const stats = {
    totalBookings: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    accepted: bookings.filter(b => b.status === 'accepted').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/');
    toast({ title: 'Logged out successfully' });
  };

  const handleUpdateStatus = (bookingId: string, status: BookingStatus) => {
    setBookings(prev => prev.map(b => 
      b.id === bookingId ? { ...b, status } : b
    ));
    toast({
      title: 'Booking Updated',
      description: `Booking status changed to ${status}`,
    });
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
    <DashboardLayout user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold">Diagnostic Centre Dashboard</h1>
          <p className="text-muted-foreground">Manage blood test bookings</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={<TestTube className="h-6 w-6" />}
            variant="primary"
          />
          <StatsCard
            title="Pending"
            value={stats.pending}
            icon={<Clock className="h-6 w-6" />}
            variant="warning"
          />
          <StatsCard
            title="Accepted"
            value={stats.accepted}
            icon={<Calendar className="h-6 w-6" />}
            variant="default"
          />
          <StatsCard
            title="Completed"
            value={stats.completed}
            icon={<CheckCircle className="h-6 w-6" />}
            variant="safe"
          />
        </div>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Blood Test Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Test Type</TableHead>
                  <TableHead>Appointment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.userName}</TableCell>
                    <TableCell>{booking.testType}</TableCell>
                    <TableCell>
                      {new Date(booking.appointmentDate).toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {booking.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="safe"
                              onClick={() => handleUpdateStatus(booking.id, 'accepted')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleUpdateStatus(booking.id, 'completed')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {booking.status === 'accepted' && (
                          <Button 
                            size="sm"
                            onClick={() => handleUpdateStatus(booking.id, 'completed')}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
