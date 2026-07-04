import { useState, useEffect, useCallback } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Clock, AlertTriangle, Users, HeartPulse, Sparkles, AlertCircle, FileSpreadsheet, Stethoscope, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { getMedicineStatus } from '@/lib/medicineStatus';
import { useNavigate } from 'react-router-dom';

interface LowAdherencePatient {
  id: string;
  name: string;
  mobile: string;
  adherence: number;
  doctorName: string;
}

export default function HospitalOverview() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Inventory stats
  const [invStats, setInvStats] = useState({ totalItems: 0, expiringSoon: 0, expired: 0, totalQty: 0 });
  
  // HMS analytics
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);
  const [avgAdherence, setAvgAdherence] = useState(0);
  const [criticalPatientsCount, setCriticalPatientsCount] = useState(0);
  const [todayUploads, setTodayUploads] = useState(0);
  const [lowAdherenceList, setLowAdherenceList] = useState<LowAdherencePatient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHMSAnalytics = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch Inventory Stats
      const { data: invData } = await supabase.from('hospital_inventory').select('*').eq('hospital_id', user.id);
      const inventory = invData || [];
      const totalItems = inventory.length;
      const expiringSoon = inventory.filter(m => getMedicineStatus(m.expiry_date) === 'expiring').length;
      const expired = inventory.filter(m => getMedicineStatus(m.expiry_date) === 'expired').length;
      const totalQty = inventory.reduce((acc, c) => acc + (c.quantity || 0), 0);
      setInvStats({ totalItems, expiringSoon, expired, totalQty });

      // Doctor/patient analytics disabled (feature not available)
      setTotalDoctors(0);
      setTotalPatients(0);
      setAvgAdherence(0);
      setCriticalPatientsCount(0);
      setTodayUploads(0);
      setLowAdherenceList([]);

    } catch (error) {
      console.error('Error fetching HMS analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    fetchHMSAnalytics();
  }, [fetchHMSAnalytics]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('hospitalDashboard')}</h1>
        <p className="text-muted-foreground">HMS Admin Panel - Monitor doctors, patients, inventory, and adherence</p>
      </div>

      {/* Hospital Metrics Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title={t('totalDoctors')} value={totalDoctors} icon={<Stethoscope className="h-6 w-6" />} variant="primary" />
        <StatsCard title={t('totalPatients')} value={totalPatients} icon={<Users className="h-6 w-6" />} variant="primary" />
        <StatsCard title={t('averageAdherence')} value={`${avgAdherence}%`} icon={<HeartPulse className="h-6 w-6" />} variant={avgAdherence >= 90 ? 'primary' : avgAdherence >= 70 ? 'warning' : 'expired'} />
        <StatsCard title={t('criticalPatients')} value={criticalPatientsCount} icon={<AlertCircle className="h-6 w-6" />} variant="expired" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title={t('todayUploads')} value={todayUploads} icon={<Sparkles className="h-6 w-6" />} variant="primary" />
        <StatsCard title="Inventory Items" value={invStats.totalItems} icon={<Package className="h-6 w-6" />} variant="primary" />
        <StatsCard title={t('medicineExpiryAlerts')} value={invStats.expiringSoon + invStats.expired} icon={<Clock className="h-6 w-6" />} variant="warning" />
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Button className="h-auto flex-col gap-2 py-6 bg-primary hover:bg-primary/95 text-white" onClick={() => navigate('/hospital/doctors')}>
          <Stethoscope className="h-6 w-6" /><span>{t('manageDoctors')}</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 py-6 border-border bg-card" onClick={() => navigate('/hospital/inventory')}>
          <Package className="h-6 w-6 text-primary" /><span>{t('medicineInventory')}</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 py-6 border-border bg-card" onClick={() => navigate('/hospital/adherence')}>
          <HeartPulse className="h-6 w-6 text-primary" /><span>{t('patientAdherence')}</span>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Patients with Low Adherence */}
        <Card className="border border-border shadow-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">{t('lowAdherencePatients')}</CardTitle>
              <CardDescription>Patients with medication adherence below 70%</CardDescription>
            </div>
            <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 font-semibold px-2 py-1 rounded-full">
              Alerts
            </span>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-6 text-muted-foreground">{t('loading')}</p>
            ) : lowAdherenceList.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground">All patients have excellent adherence.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead>Adherence</TableHead>
                    <TableHead>Assigned Doctor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowAdherenceList.map(pat => (
                    <TableRow key={pat.id}>
                      <TableCell className="font-semibold">{pat.name}</TableCell>
                      <TableCell className="text-red-600 font-bold">{pat.adherence}%</TableCell>
                      <TableCell className="text-muted-foreground">{pat.doctorName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Hospital Inventory Summary */}
        <Card className="border border-border shadow-elevated">
          <CardHeader>
            <CardTitle className="text-lg">{t('inventorySummary')}</CardTitle>
            <CardDescription>Overview of medicine stocks inside the hospital</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-secondary/50 p-4 border border-border">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Total Stock Quantity</p>
                <p className="text-2xl font-bold text-primary mt-1">{invStats.totalQty}</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-4 border border-border">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Inventory Alert Items</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{invStats.expiringSoon + invStats.expired}</p>
              </div>
            </div>
            
            <div className="border border-border rounded-lg p-4 space-y-2 bg-card">
              <p className="font-semibold text-sm">Expired Medicines: <span className="text-destructive font-bold">{invStats.expired}</span></p>
              <p className="font-semibold text-sm">Expiring Soon: <span className="text-amber-500 font-bold">{invStats.expiringSoon}</span></p>
              <p className="font-semibold text-sm text-muted-foreground">Keep inventory current by restocking expiring medicines.</p>
              <Button size="sm" variant="ghost" className="text-xs text-primary font-semibold p-0 flex items-center gap-1 hover:bg-transparent" onClick={() => navigate('/hospital/inventory')}>
                View Inventory <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
