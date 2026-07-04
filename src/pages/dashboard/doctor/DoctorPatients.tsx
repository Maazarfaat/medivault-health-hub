import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye, AlertCircle, Sparkles } from 'lucide-react';
import { getMedicineStatus } from '@/lib/medicineStatus';

interface PatientData {
  id: string;
  name: string;
  email: string;
  mobile: string;
  assignedDate: string;
  diagnosis: string | null;
  adherenceScore: number;
  status: 'excellent' | 'moderate' | 'poor';
  hasExpiryAlert: boolean;
  hasStockAlert: boolean;
}

export default function DoctorPatients() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch assigned patients and calculate adherence
  const fetchAssignedPatients = useCallback(async () => {
    if (!user) return;
    try {
      // 1. Get assignments
      const { data: assignments, error: assignError } = await supabase
        .from('doctor_patient_assignments')
        .select('*')
        .eq('doctor_id', user.id);

      if (assignError) throw assignError;
      const assignmentList = assignments || [];
      const patientIds = assignmentList.map(a => a.patient_id);

      if (patientIds.length === 0) {
        setPatients([]);
        setLoading(false);
        return;
      }

      // 2. Fetch profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', patientIds);

      if (profileError) throw profileError;

      // 3. Fetch medicines to calculate adherence score and alerts
      const { data: medicines, error: medError } = await supabase
        .from('user_medicines')
        .select('*')
        .in('user_id', patientIds);

      if (medError) throw medError;

      // Group medicines by user_id
      const patientMedsMap: Record<string, typeof medicines> = {};
      patientIds.forEach(id => {
        patientMedsMap[id] = medicines?.filter(m => m.user_id === id) || [];
      });

      // 4. Compile patient data objects
      const compiledPatients: PatientData[] = patientIds.map(pId => {
        const prof = profiles?.find(p => p.user_id === pId);
        const assign = assignmentList.find(a => a.patient_id === pId);
        const meds = patientMedsMap[pId] || [];

        // Adherence score calculations
        let totalTaken = 0;
        let totalPrescribed = 0;
        let hasExpiryAlert = false;
        let hasStockAlert = false;

        meds.forEach(m => {
          if (m.prescribed_doses) {
            totalTaken += m.doses_taken || 0;
            totalPrescribed += m.prescribed_doses;
          }
          if (getMedicineStatus(m.expiry_date) !== 'safe') {
            hasExpiryAlert = true;
          }
          if (m.quantity < 5) {
            hasStockAlert = true;
          }
        });

        const score = totalPrescribed > 0 ? Math.round((totalTaken / totalPrescribed) * 100) : 100;
        
        let status: 'excellent' | 'moderate' | 'poor' = 'excellent';
        if (score < 70) status = 'poor';
        else if (score < 90) status = 'moderate';

        return {
          id: pId,
          name: prof?.name || 'Patient',
          email: prof?.email || '',
          mobile: prof?.mobile_number || t('notSet'),
          assignedDate: new Date(assign?.assigned_date || '').toLocaleDateString(),
          diagnosis: assign?.diagnosis || null,
          adherenceScore: score,
          status,
          hasExpiryAlert,
          hasStockAlert
        };
      });

      setPatients(compiledPatients);
    } catch (error: any) {
      toast({ title: 'Error loading patients', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast, t]);

  useEffect(() => {
    fetchAssignedPatients();

    if (!user) return;

    // Realtime listener for live adherence updates
    const subscription = supabase
      .channel('doctor-adherence-tracker')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_medicines' },
        () => {
          fetchAssignedPatients();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchAssignedPatients, user]);

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.diagnosis && p.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('myPatients')}</h1>
        <p className="text-muted-foreground">Monitor real-time medication compliance and health reports</p>
      </div>

      {/* Alert Header if any Patient is Low Adherence */}
      {patients.some(p => p.status === 'poor') && (
        <div className="bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/50 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-red-800 dark:text-red-300">Adherence Alert</h4>
            <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">
              One or more patients have compliance levels below 70%. Reach out to coordinate intervention.
            </p>
          </div>
        </div>
      )}

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, ID or diagnosis..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 bg-card border-border max-w-md"
        />
      </div>

      {/* Patient List Card Table */}
      <Card className="border border-border shadow-elevated">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">{t('loading')}</div>
          ) : filteredPatients.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No patients assigned. Contact Hospital Admin for assignments.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('patientName')}</TableHead>
                  <TableHead>{t('patientId')}</TableHead>
                  <TableHead>{t('mobile')}</TableHead>
                  <TableHead>{t('assignedDate')}</TableHead>
                  <TableHead>{t('currentDiagnosis')}</TableHead>
                  <TableHead>{t('adherence')}</TableHead>
                  <TableHead>Alerts</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map(patient => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-semibold">{patient.name}</TableCell>
                    <TableCell className="font-mono text-xs">{patient.id.substring(0, 8)}...</TableCell>
                    <TableCell>{patient.mobile}</TableCell>
                    <TableCell>{patient.assignedDate}</TableCell>
                    <TableCell>{patient.diagnosis || <span className="text-muted-foreground text-xs">{t('notSet')}</span>}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${patient.status === 'excellent' ? 'text-green-600' : patient.status === 'moderate' ? 'text-amber-500' : 'text-red-600'}`}>
                          {patient.adherenceScore}%
                        </span>
                        <div className="h-1.5 w-16 bg-secondary rounded-full overflow-hidden hidden sm:block">
                          <div 
                            className={`h-full ${patient.status === 'excellent' ? 'bg-green-600' : patient.status === 'moderate' ? 'bg-amber-500' : 'bg-red-600'}`}
                            style={{ width: `${patient.adherenceScore}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        {patient.hasExpiryAlert && (
                          <span className="inline-flex items-center rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs px-1.5 py-0.5 font-semibold" title="Medication Expired/Expiring">
                            Expiry
                          </span>
                        )}
                        {patient.hasStockAlert && (
                          <span className="inline-flex items-center rounded bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs px-1.5 py-0.5 font-semibold" title="Low Medicine Quantity">
                            Stock Low
                          </span>
                        )}
                        {!patient.hasExpiryAlert && !patient.hasStockAlert && (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="border-border hover:bg-muted gap-1.5" onClick={() => navigate(`/doctor/patient/${patient.id}`)}>
                        <Eye className="h-3.5 w-3.5" /> View Profile
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
