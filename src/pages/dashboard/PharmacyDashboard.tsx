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
  DollarSign,
  Plus,
  QrCode,
  Search,
  ShoppingCart,
  FileSpreadsheet,
  RefreshCcw
} from 'lucide-react';
import { mockUsers, mockPharmacyInventory, mockRestockRequests } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

export default function PharmacyDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inventory] = useState(mockPharmacyInventory);
  const [restockRequests] = useState(mockRestockRequests);
  const [searchTerm, setSearchTerm] = useState('');

  const user = mockUsers[1]; // Pharmacy user

  const stats = {
    totalItems: inventory.length,
    expiringSoon: inventory.filter(m => m.status === 'expiring').length,
    expired: inventory.filter(m => m.status === 'expired').length,
    totalValue: inventory.reduce((sum, m) => sum + m.quantity * 10, 0), // Demo calculation
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
          <h1 className="text-2xl font-bold">Pharmacy Dashboard</h1>
          <p className="text-muted-foreground">Manage your inventory and sales</p>
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
            title="Inventory Value"
            value={`$${stats.totalValue.toLocaleString()}`}
            icon={<DollarSign className="h-6 w-6" />}
            variant="safe"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button className="h-auto flex-col gap-2 py-6" onClick={() => navigate('/pharmacy/sell')}>
            <ShoppingCart className="h-6 w-6" />
            <span>Sell Medicine</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-6">
            <QrCode className="h-6 w-6" />
            <span>Scan & Add</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-6" onClick={() => navigate('/pharmacy/csv')}>
            <FileSpreadsheet className="h-6 w-6" />
            <span>CSV Upload</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-6" onClick={() => navigate('/pharmacy/restock')}>
            <RefreshCcw className="h-6 w-6" />
            <span>Restock Requests ({restockRequests.filter(r => r.status === 'pending').length})</span>
          </Button>
        </div>

        {/* Inventory Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Inventory</CardTitle>
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
                      <Button size="sm" variant="ghost">
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
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
