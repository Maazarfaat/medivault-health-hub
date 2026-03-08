import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { MedicineCard } from '@/components/medicine/MedicineCard';
import { AddMedicineDialog } from '@/components/medicine/AddMedicineDialog';
import { BookTestDialog } from '@/components/booking/BookTestDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pill, AlertTriangle, Clock, Package, Plus, QrCode, PenLine, TestTube } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getMedicineStatus, isLowStock, needsRestock } from '@/lib/medicineStatus';
import { Tables } from '@/integrations/supabase/types';

type UserMedicine = Tables<'user_medicines'>;
type Booking = Tables<'blood_test_bookings'>;

export default function UserDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, role, signOut } = useAuth();
  const [medicines, setMedicines] = useState<UserMedicine[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [addMethod, setAddMethod] = useState<'manual' | 'scan'>('manual');
  const [bookTestOpen, setBookTestOpen] = useState(false);

  const fetchMedicines = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_medicines')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setMedicines(data || []);
    setLoading(false);
  }, [user]);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('blood_test_bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setBookings(data || []);
  }, [user]);

  useEffect(() => { fetchMedicines(); fetchBookings(); }, [fetchMedicines, fetchBookings]);

  const handleRestock = async (med: UserMedicine) => {
    if (!user) return;
    await supabase.from('restock_requests').insert({
      user_id: user.id,
      medicine_name: med.name,
      requested_quantity: med.prescribed_doses || 30,
    });
    toast({ title: 'Restock Request Sent', description: `Request for ${med.name} sent to pharmacies.` });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const stats = {
    total: medicines.length,
    expiring: medicines.filter(m => getMedicineStatus(m.expiry_date) === 'expiring').length,
    expired: medicines.filter(m => getMedicineStatus(m.expiry_date) === 'expired').length,
    lowStock: medicines.filter(m => isLowStock(m.quantity)).length,
  };

  const dashboardUser = {
    id: user?.id || '',
    name: profile?.name || 'User',
    email: profile?.email || '',
    mobileNumber: profile?.mobile_number || '',
    mobileVerified: profile?.mobile_verified || false,
    role: (role || 'user') as any,
    profileCompletion: profile?.profile_completion || 0,
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
          <h1 className="text-2xl font-bold">Welcome back, {profile?.name?.split(' ')[0] || 'User'}!</h1>
          <p className="text-muted-foreground">Here's your medicine overview</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Medicines" value={stats.total} icon={<Pill className="h-6 w-6" />} variant="primary" />
          <StatsCard title="Expiring Soon" value={stats.expiring} icon={<Clock className="h-6 w-6" />} variant="warning" />
          <StatsCard title="Expired" value={stats.expired} icon={<AlertTriangle className="h-6 w-6" />} variant="expired" />
          <StatsCard title="Low Stock" value={stats.lowStock} icon={<Package className="h-6 w-6" />} variant="warning" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => { setAddMethod('scan'); setAddOpen(true); }}>
                <QrCode className="h-5 w-5" /><span className="text-xs">Scan QR</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => { setAddMethod('manual'); setAddOpen(true); }}>
                <PenLine className="h-5 w-5" /><span className="text-xs">Manual Entry</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => setBookTestOpen(true)}>
                <TestTube className="h-5 w-5" /><span className="text-xs">Book Test</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => { setAddMethod('manual'); setAddOpen(true); }}>
                <Plus className="h-5 w-5" /><span className="text-xs">Add Medicine</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* My Blood Test Bookings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">My Blood Test Bookings</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setBookTestOpen(true)}>
                <TestTube className="mr-2 h-4 w-4" />Book Test
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">No blood test bookings yet.</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <p className="font-medium">{booking.test_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.appointment_date).toLocaleDateString()}
                        {(booking as any).preferred_time && ` at ${(booking as any).preferred_time}`}
                      </p>
                      {booking.notes && <p className="text-xs text-muted-foreground">{booking.notes}</p>}
                    </div>
                    <div className="text-right space-y-1">
                      {getStatusBadge(booking.status)}
                      {booking.status === 'accepted' && (
                        <p className="text-xs text-primary">Your blood test appointment has been confirmed.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">My Medicines</h2>
          </div>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : medicines.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <Pill className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No medicines added yet. Add your first medicine to start tracking.</p>
                <Button onClick={() => setAddOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />Add Medicine
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {medicines.map((med) => {
                const status = getMedicineStatus(med.expiry_date);
                const medForCard = {
                  ...med,
                  userId: med.user_id,
                  batchNumber: med.batch_number || '',
                  expiryDate: med.expiry_date,
                  addedMethod: med.added_method as any,
                  status: status,
                  prescribedDoses: med.prescribed_doses ?? undefined,
                  dosesTaken: med.doses_taken ?? undefined,
                };
                return (
                  <MedicineCard
                    key={med.id}
                    medicine={medForCard}
                    onRestock={needsRestock(med.quantity) || isLowStock(med.quantity) ? () => handleRestock(med) : undefined}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AddMedicineDialog open={addOpen} onOpenChange={setAddOpen} onAdded={fetchMedicines} defaultMethod={addMethod} />
      <BookTestDialog open={bookTestOpen} onOpenChange={setBookTestOpen} onBooked={fetchBookings} />
    </DashboardLayout>
  );
}
