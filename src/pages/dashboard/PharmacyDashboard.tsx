import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, AlertTriangle, Clock, DollarSign, QrCode, Search, ShoppingCart, FileSpreadsheet, RefreshCcw, Plus, MapPin, ExternalLink, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getMedicineStatus } from '@/lib/medicineStatus';
import { calculateDistance, formatDistance, getGoogleMapsLink } from '@/lib/geolocation';
import { AddInventoryDialog } from '@/components/pharmacy/AddInventoryDialog';
import { SellMedicineDialog } from '@/components/pharmacy/SellMedicineDialog';
import { CSVUploadDialog } from '@/components/pharmacy/CSVUploadDialog';
import { SendOfferDialog } from '@/components/offer/SendOfferDialog';
import { StatusTracker } from '@/components/offer/StatusTracker';
import { Tables } from '@/integrations/supabase/types';
import { SaveLocationButton } from '@/components/location/SaveLocationButton';

type Inventory = Tables<'pharmacy_inventory'>;
type RestockReq = Tables<'restock_requests'>;

interface RestockWithProfile extends RestockReq {
  userName?: string;
  userMobile?: string;
  distanceKm?: number | null;
  userAddress?: string | null;
  userLat?: number | null;
  userLng?: number | null;
}

export default function PharmacyDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, profile, role, signOut } = useAuth();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [restockRequests, setRestockRequests] = useState<RestockWithProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [restockView, setRestockView] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [inv, restock] = await Promise.all([
      supabase.from('pharmacy_inventory').select('*').eq('pharmacy_id', user.id).order('created_at', { ascending: false }),
      supabase.from('restock_requests').select('*').order('request_date', { ascending: false }),
    ]);
    setInventory(inv.data || []);

    const requests = restock.data || [];
    if (requests.length > 0) {
      const userIds = [...new Set(requests.map(r => r.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, name, mobile_number').in('user_id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const pharmacyLat = profile?.latitude;
      const pharmacyLng = profile?.longitude;

      const enriched: RestockWithProfile[] = requests.map(r => {
        const userLat = r.user_latitude;
        const userLng = r.user_longitude;
        let dist: number | null = null;
        if (pharmacyLat && pharmacyLng && userLat && userLng) {
          dist = calculateDistance(pharmacyLat, pharmacyLng, userLat, userLng);
        }
        return {
          ...r,
          userName: profileMap.get(r.user_id)?.name || 'Unknown',
          userMobile: profileMap.get(r.user_id)?.mobile_number || 'N/A',
          distanceKm: dist,
          userAddress: (r as any).user_address || null,
          userLat: userLat,
          userLng: userLng,
        };
      });
      enriched.sort((a, b) => {
        if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
        if (a.distanceKm != null) return -1;
        return 1;
      });
      setRestockRequests(enriched);
    } else {
      setRestockRequests([]);
    }
  }, [user, profile]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const handleSendOffer = async (offer: { price: number; discount: number; finalPrice: number; estimatedTime: string; notes: string }) => {
    if (!selectedRequestId || !user) return;
    await supabase.from('restock_requests').update({
      status: 'offer_sent' as any,
      pharmacy_id: user.id,
      offer_price: offer.price,
      offer_discount: offer.discount,
      offer_final_price: offer.finalPrice,
      estimated_time: offer.estimatedTime,
      provider_notes: offer.notes,
      provider_name: profile?.name || 'Pharmacy',
    } as any).eq('id', selectedRequestId);
    toast({ title: t('offerSent') });
    fetchData();
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    await supabase.from('restock_requests').update({ status } as any).eq('id', id);
    toast({ title: t('statusUpdated') });
    fetchData();
  };

  const filteredInventory = inventory.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const activeRestocks = restockRequests.filter(r => r.status !== 'fulfilled' && r.status !== 'rejected');

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
      case 'safe': return <Badge variant="safe">{t('safe')}</Badge>;
      case 'expiring': return <Badge variant="warning">{t('expiring')}</Badge>;
      case 'expired': return <Badge variant="expired">{t('expired')}</Badge>;
    }
  };

  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="warning">{t('pending')}</Badge>;
      case 'offer_sent': return <Badge className="bg-blue-500 text-white">{t('offerSent')}</Badge>;
      case 'confirmed': return <Badge variant="safe">{t('confirmed')}</Badge>;
      case 'processing': return <Badge variant="default">{t('processing')}</Badge>;
      case 'rejected': return <Badge variant="expired">{t('rejected')}</Badge>;
      case 'fulfilled': return <Badge variant="safe">{t('fulfilled')}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout user={dashboardUser} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('pharmacyDashboard')}</h1>
            <p className="text-muted-foreground">{t('manageInventory')}</p>
          </div>
          <SaveLocationButton />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title={t('totalItems')} value={stats.totalItems} icon={<Package className="h-6 w-6" />} variant="primary" />
          <StatsCard title={t('expiringSoon')} value={stats.expiringSoon} icon={<Clock className="h-6 w-6" />} variant="warning" />
          <StatsCard title={t('expired')} value={stats.expired} icon={<AlertTriangle className="h-6 w-6" />} variant="expired" />
          <StatsCard title={t('inventoryValue')} value={`₹${stats.totalValue.toLocaleString()}`} icon={<DollarSign className="h-6 w-6" />} variant="safe" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button className="h-auto flex-col gap-2 py-6" onClick={() => setSellOpen(true)}>
            <ShoppingCart className="h-6 w-6" /><span>{t('sellMedicine')}</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-6" onClick={() => setAddOpen(true)}>
            <QrCode className="h-6 w-6" /><span>{t('addInventory')}</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-6" onClick={() => setCsvOpen(true)}>
            <FileSpreadsheet className="h-6 w-6" /><span>{t('csvUpload')}</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-6" onClick={() => setRestockView(!restockView)}>
            <RefreshCcw className="h-6 w-6" /><span>{t('restockRequests')} ({activeRestocks.length})</span>
          </Button>
        </div>

        {restockView && activeRestocks.length > 0 && (
          <Card>
            <CardHeader><CardTitle>{t('restockRequests')}</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('medicineName')}</TableHead>
                    <TableHead>{t('userName')}</TableHead>
                    <TableHead>{t('mobile')}</TableHead>
                    <TableHead>{t('quantity')}</TableHead>
                    <TableHead>{t('distance')}</TableHead>
                    <TableHead>{t('location')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('orderTracking')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeRestocks.map(req => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.medicine_name}</TableCell>
                      <TableCell>{req.userName}</TableCell>
                      <TableCell>{req.userMobile}</TableCell>
                      <TableCell>{req.requested_quantity}</TableCell>
                      <TableCell>
                        {req.distanceKm != null ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {formatDistance(req.distanceKm)}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {req.userLat && req.userLng ? (
                          <div className="space-y-1">
                            {req.userAddress && (
                              <p className="text-xs text-muted-foreground max-w-[200px] truncate" title={req.userAddress}>
                                {req.userAddress}
                              </p>
                            )}
                            <a
                              href={getGoogleMapsLink(req.userLat, req.userLng)}
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
                      <TableCell>{getRequestStatusBadge(req.status)}</TableCell>
                      <TableCell><StatusTracker currentStatus={req.status} type="restock" /></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {req.status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => { setSelectedRequestId(req.id); setOfferDialogOpen(true); }}>
                                <Send className="mr-1 h-3 w-3" />{t('sendOffer')}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(req.id, 'rejected')}>
                                {t('reject')}
                              </Button>
                            </>
                          )}
                          {req.status === 'confirmed' && (
                            <Button size="sm" onClick={() => handleStatusUpdate(req.id, 'processing')}>
                              {t('processing')}
                            </Button>
                          )}
                          {req.status === 'processing' && (
                            <Button size="sm" variant="safe" onClick={() => handleStatusUpdate(req.id, 'fulfilled')}>
                              {t('fulfill')}
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
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('inventory')}</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={t('searchMedicines')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 pl-9" />
              </div>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />{t('addItem')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredInventory.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">{t('noInventory')}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('medicineName')}</TableHead>
                    <TableHead>{t('batchNumber')}</TableHead>
                    <TableHead>{t('expiryDate')}</TableHead>
                    <TableHead>{t('quantity')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
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
      <SendOfferDialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen} onSubmit={handleSendOffer} title={t('sendRestockOffer')} />
    </DashboardLayout>
  );
}
