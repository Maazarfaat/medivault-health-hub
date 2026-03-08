import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, AlertTriangle, Clock, DollarSign, QrCode, Search, ShoppingCart, FileSpreadsheet, RefreshCcw, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getMedicineStatus } from '@/lib/medicineStatus';
import { AddInventoryDialog } from '@/components/pharmacy/AddInventoryDialog';
import { SellMedicineDialog } from '@/components/pharmacy/SellMedicineDialog';
import { CSVUploadDialog } from '@/components/pharmacy/CSVUploadDialog';
import { Tables } from '@/integrations/supabase/types';

type Inventory = Tables<'pharmacy_inventory'>;
type RestockReq = Tables<'restock_requests'>;

export default function PharmacyDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, role, signOut } = useAuth();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [restockRequests, setRestockRequests] = useState<RestockReq[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [restockView, setRestockView] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [inv, restock] = await Promise.all([
      supabase.from('pharmacy_inventory').select('*').eq('pharmacy_id', user.id).order('created_at', { ascending: false }),
      supabase.from('restock_requests').select('*').order('request_date', { ascending: false }),
    ]);
    setInventory(inv.data || []);
    setRestockRequests(restock.data || []);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const handleRestockAction = async (id: string, status: 'accepted' | 'rejected') => {
    await supabase.from('restock_requests').update({ status }).eq('id', id);
    toast({ title: `Request ${status}` });
    fetchData();
  };

  const filteredInventory = inventory.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const pendingRestocks = restockRequests.filter(r => r.status === 'pending');

  const stats = {
    totalItems: inventory.length,
    expiringSoon: inventory.filter(m => getMedicineStatus(m.expiry_date) === 'expiring').length,
    expired: inventory.filter(m => getMedicineStatus(m.expiry_date) === 'expired').length,
    totalValue: inventory.reduce((sum, m) => sum + m.quantity * 10, 0),
  };

  const dashboardUser = {
    id: user?.id || '', name: profile?.name || 'Pharmacy', email: profile?.email || '',
    mobileNumber: profile?.mobile_number || '', mobileVerified: profile?.mobile_verified || false,
    role: (role || 'pharmacy') as any, profileCompletion: profile?.profile_completion || 0,
  };

  const getStatusBadge = (expiryDate: string) => {
    const status = getMedicineStatus(expiryDate);
    switch (status) {
      case 'safe': return <Badge variant="safe">Safe</Badge>;
      case 'expiring': return <Badge variant="warning">Expiring</Badge>;
      case 'expired': return <Badge variant="expired">Expired</Badge>;
    }
  };

  return (
    <DashboardLayout user={dashboardUser} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Pharmacy Dashboard</h1>
          <p className="text-muted-foreground">Manage your inventory and sales</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Items" value={stats.totalItems} icon={<Package className="h-6 w-6" />} variant="primary" />
          <StatsCard title="Expiring Soon" value={stats.expiringSoon} icon={<Clock className="h-6 w-6" />} variant="warning" />
          <StatsCard title="Expired" value={stats.expired} icon={<AlertTriangle className="h-6 w-6" />} variant="expired" />
          <StatsCard title="Inventory Value" value={`$${stats.totalValue.toLocaleString()}`} icon={<DollarSign className="h-6 w-6" />} variant="safe" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button className="h-auto flex-col gap-2 py-6" onClick={() => setSellOpen(true)}>
            <ShoppingCart className="h-6 w-6" /><span>Sell Medicine</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-6" onClick={() => setAddOpen(true)}>
            <QrCode className="h-6 w-6" /><span>Add Inventory</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-6" onClick={() => setCsvOpen(true)}>
            <FileSpreadsheet className="h-6 w-6" /><span>CSV Upload</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-6" onClick={() => setRestockView(!restockView)}>
            <RefreshCcw className="h-6 w-6" /><span>Restock Requests ({pendingRestocks.length})</span>
          </Button>
        </div>

        {restockView && pendingRestocks.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Pending Restock Requests</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRestocks.map(req => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.medicine_name}</TableCell>
                      <TableCell>{req.requested_quantity}</TableCell>
                      <TableCell>{new Date(req.request_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="safe" onClick={() => handleRestockAction(req.id, 'accepted')}>Accept</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRestockAction(req.id, 'rejected')}>Reject</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Inventory</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search medicines..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 pl-9" />
              </div>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredInventory.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No inventory items. Add your first item to get started.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.batch_number || '-'}</TableCell>
                      <TableCell>{new Date(item.expiry_date).toLocaleDateString()}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{getStatusBadge(item.expiry_date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AddInventoryDialog open={addOpen} onOpenChange={setAddOpen} onAdded={fetchData} table="pharmacy_inventory" idField="pharmacy_id" />
      <SellMedicineDialog open={sellOpen} onOpenChange={setSellOpen} inventory={inventory} onSold={fetchData} />
      <CSVUploadDialog open={csvOpen} onOpenChange={setCsvOpen} onUploaded={fetchData} />
    </DashboardLayout>
  );
}
