import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { MedicineCard } from '@/components/medicine/MedicineCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Pill, 
  AlertTriangle, 
  Clock, 
  Package, 
  Leaf, 
  Plus, 
  QrCode, 
  FileSpreadsheet,
  PenLine 
} from 'lucide-react';
import { mockUsers, mockUserMedicines } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [medicines] = useState(mockUserMedicines);

  // Demo user
  const user = mockUsers[0];

  const stats = {
    totalMedicines: medicines.length,
    expiringSoon: medicines.filter(m => m.status === 'expiring').length,
    expired: medicines.filter(m => m.status === 'expired').length,
    lowStock: medicines.filter(m => m.quantity <= 5 && m.quantity > 0).length,
    savedFromExpiry: 42,
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/');
    toast({ title: 'Logged out successfully' });
  };

  const handleRestock = (medicineName: string) => {
    toast({
      title: 'Restock Request Sent',
      description: `Request for ${medicineName} sent to nearby pharmacies.`,
    });
  };

  return (
    <DashboardLayout user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user.name.split(' ')[0]}!</h1>
          <p className="text-muted-foreground">Here's your medicine overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="Total Medicines"
            value={stats.totalMedicines}
            icon={<Pill className="h-6 w-6" />}
            variant="primary"
          />
          <StatsCard
            title="Expiring Soon"
            value={stats.expiringSoon}
            icon={<Clock className="h-6 w-6" />}
            variant="warning"
          />
          <StatsCard
            title="Expired"
            value={stats.expired}
            icon={<AlertTriangle className="h-6 w-6" />}
            variant="expired"
          />
          <StatsCard
            title="Low Stock"
            value={stats.lowStock}
            icon={<Package className="h-6 w-6" />}
            variant="warning"
          />
          <StatsCard
            title="Saved from Expiry"
            value={stats.savedFromExpiry}
            icon={<Leaf className="h-6 w-6" />}
            variant="safe"
            description="Healthcare impact"
          />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Medicine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                <QrCode className="h-5 w-5" />
                <span className="text-xs">Scan QR</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                <PenLine className="h-5 w-5" />
                <span className="text-xs">Manual Entry</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                <FileSpreadsheet className="h-5 w-5" />
                <span className="text-xs">From Bill</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                <Plus className="h-5 w-5" />
                <span className="text-xs">Pharmacy Sale</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Medicine List */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">My Medicines</h2>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {medicines.map((medicine) => (
              <MedicineCard
                key={medicine.id}
                medicine={medicine}
                onRestock={() => handleRestock(medicine.name)}
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
