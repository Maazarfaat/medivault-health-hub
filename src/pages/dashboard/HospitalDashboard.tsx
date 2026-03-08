import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Package, 
  AlertTriangle, 
  Clock, 
  Users,
  Plus,
  QrCode,
  Search,
  TrendingUp,
  Pill
} from 'lucide-react';
import { mockUsers, mockHospitalInventory } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

export default function HospitalDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inventory] = useState(mockHospitalInventory);
  const [searchTerm, setSearchTerm] = useState('');

  const user = mockUsers[2]; // Hospital user

  const stats = {
    totalItems: inventory.length,
    expiringSoon: inventory.filter(m => m.status === 'expiring').length,
    expired: inventory.filter(m => m.status === 'expired').length,
    patientsTracked: 156,
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/');
    toast({ title: 'Logged out successfully' });
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'safe': return <Badge variant="safe">Safe</Badge>;
      case 'expiring': return <Badge variant="warning">Expiring</Badge>;
      case 'expired': return <Badge variant="expired">Expired</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold">Hospital Dashboard</h1>
          <p className="text-muted-foreground">Manage inventory and patient adherence</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Items"
            value={stats.totalItems}
            icon={<Package className="h-6 w-6" />}
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
            title="Patients Tracked"
            value={stats.patientsTracked}
            icon={<Users className="h-6 w-6" />}
            variant="safe"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Button className="h-auto flex-col gap-2 py-6">
            <QrCode className="h-6 w-6" />
            <span>Scan & Add Medicine</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-6">
            <Pill className="h-6 w-6" />
            <span>Manual Entry</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-6" onClick={() => navigate('/hospital/adherence')}>
            <TrendingUp className="h-6 w-6" />
            <span>Patient Adherence</span>
          </Button>
        </div>

        {/* Inventory Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Medicine Inventory</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search medicines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-9"
                />
              </div>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.batchNumber}</TableCell>
                    <TableCell>{new Date(item.expiryDate).toLocaleDateString()}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost">Edit</Button>
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
