import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  ArrowLeft, User, Pill, Activity, Calendar, FileText, 
  Sparkles, CheckCircle2, AlertTriangle, Clock, Save, Info
} from 'lucide-react';
import { getMedicineStatus } from '@/lib/medicineStatus';

interface PatientProfile {
  name: string;
  email: string;
  mobile: string;
  language: string;
}

interface MedicineLog {
  id: string;
  medicine_name: string;
  action: string;
  logged_at: string;
}

export default function DoctorPatientProfile() {
  const { patientId } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  
  // Medicines states
  const [currentMedicines, setCurrentMedicines] = useState<any[]>([]);
  const [completedMedicines, setCompletedMedicines] = useState<any[]>([]);
  
  // Logs & Adherence states
  const [logs, setLogs] = useState<MedicineLog[]>([]);
  const [weeklyAdherence, setWeeklyAdherence] = useState(100);
  const [monthlyAdherence, setMonthlyAdherence] = useState(100);
  const [overallAdherence, setOverallAdherence] = useState(100);
  const [adherenceData, setAdherenceData] = useState<any[]>([]);
  const [missedCount, setMissedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  // Notes & Diagnosis states
  const [diagnosis, setDiagnosis] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // External records
  const [bloodTests, setBloodTests] = useState<any[]>([]);
  const [aiReports, setAiReports] = useState<any[]>([]);

  // Fetch patient profile, medicines, logs, and external records
  const fetchPatientProfile = useCallback(async () => {
    if (!patientId || !user) return;
    setLoading(true);
    try {
      // 1. Fetch Profile
      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', patientId)
        .single();
      
      if (profError) throw profError;
      setPatient({
        name: prof.name,
        email: prof.email,
        mobile: prof.mobile_number || t('notSet'),
        language: prof.language || 'en'
      });

      // 2. Fetch Assignment (for Diagnosis & Notes)
      const { data: assign } = await supabase
        .from('doctor_patient_assignments')
        .select('*')
        .eq('doctor_id', user.id)
        .eq('patient_id', patientId)
        .single();
      
      if (assign) {
        setDiagnosis(assign.diagnosis || '');
        setDoctorNotes(assign.doctor_notes || '');
      }

      // 3. Fetch Medicines
      const { data: meds, error: medsError } = await supabase
        .from('user_medicines')
        .select('*')
        .eq('user_id', patientId);

      if (medsError) throw medsError;
      
      const active = meds?.filter(m => m.quantity > 0) || [];
      const completed = meds?.filter(m => m.quantity === 0) || [];
      
      setCurrentMedicines(active);
      setCompletedMedicines(completed);

      // 4. Fetch Logs
      const { data: logData } = await supabase
        .from('medicine_logs')
        .select('*')
        .eq('user_id', patientId)
        .order('logged_at', { ascending: false });

      // Build logs mapped to medicine names
      const mappedLogs: MedicineLog[] = (logData || []).map(l => {
        const med = meds?.find(m => m.id === l.medicine_id);
        return {
          id: l.id,
          medicine_name: med?.name || 'Unknown Medicine',
          action: l.action,
          logged_at: new Date(l.logged_at).toLocaleString()
        };
      });
      setLogs(mappedLogs);

      // Calculate statistics
      let totalTaken = 0;
      let totalPrescribed = 0;
      meds?.forEach(m => {
        if (m.prescribed_doses) {
          totalTaken += m.doses_taken || 0;
          totalPrescribed += m.prescribed_doses;
        }
      });
      
      const overallScore = totalPrescribed > 0 ? Math.round((totalTaken / totalPrescribed) * 100) : 100;
      setOverallAdherence(overallScore);

      // Count missed/skipped from logs
      const missed = logData?.filter(l => l.action === 'missed').length || 0;
      const skipped = logData?.filter(l => l.action === 'skipped').length || 0;
      setMissedCount(missed);
      setSkippedCount(skipped);

      // Calculate weekly and monthly adherence
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const weeklyLogs = logData?.filter(l => new Date(l.logged_at) >= oneWeekAgo) || [];
      const monthlyLogs = logData?.filter(l => new Date(l.logged_at) >= oneMonthAgo) || [];

      const weeklyTaken = weeklyLogs.filter(l => l.action === 'taken').length;
      const weeklyTotal = weeklyLogs.length;
      setWeeklyAdherence(weeklyTotal > 0 ? Math.round((weeklyTaken / weeklyTotal) * 100) : 100);

      const monthlyTaken = monthlyLogs.filter(l => l.action === 'taken').length;
      const monthlyTotal = monthlyLogs.length;
      setMonthlyAdherence(monthlyTotal > 0 ? Math.round((monthlyTaken / monthlyTotal) * 100) : 100);

      // Adherence trend data (last 7 days breakdown)
      const trendData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStr = d.toLocaleDateString(undefined, { weekday: 'short' });
        const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

        const dayLogs = logData?.filter(l => {
          const lDate = new Date(l.logged_at);
          return lDate >= startOfDay && lDate <= endOfDay;
        }) || [];

        const dayTaken = dayLogs.filter(l => l.action === 'taken').length;
        const dayTotal = dayLogs.length;
        const dayScore = dayTotal > 0 ? Math.round((dayTaken / dayTotal) * 100) : 100;

        trendData.push({ day: dayStr, Adherence: dayScore });
      }
      setAdherenceData(trendData);

      // 5. Fetch Blood Tests
      const { data: tests } = await supabase
        .from('blood_test_bookings')
        .select('*')
        .eq('user_id', patientId)
        .eq('status', 'completed')
        .order('appointment_date', { ascending: false });
      setBloodTests(tests || []);

      // 6. Fetch AI Reports
      const { data: reports } = await supabase
        .from('ai_report_analyses')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      setAiReports(reports || []);

    } catch (error: any) {
      toast({ title: 'Error loading patient profile', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [patientId, user, toast, t]);

  useEffect(() => {
    fetchPatientProfile();

    if (!patientId) return;

    // Listen for live medication logs changes
    const subscription = supabase
      .channel(`patient-${patientId}-tracker`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'medicine_logs', filter: `user_id=eq.${patientId}` },
        () => {
          fetchPatientProfile();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchPatientProfile, patientId]);

  // Handle Save Notes
  const handleSaveNotes = async () => {
    if (!patientId || !user) return;
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('doctor_patient_assignments')
        .update({
          diagnosis,
          doctor_notes: doctorNotes
        })
        .eq('doctor_id', user.id)
        .eq('patient_id', patientId);

      if (error) throw error;
      toast({ title: 'Notes Saved', description: 'Patient diagnosis and notes updated successfully.' });
    } catch (error: any) {
      toast({ title: 'Save Failed', description: error.message, variant: 'destructive' });
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading && !patient) {
    return <div className="py-12 text-center text-muted-foreground">{t('loading')}</div>;
  }

  if (!patient) {
    return (
      <div className="py-12 text-center text-muted-foreground space-y-4">
        <p>Patient profile not found.</p>
        <Button variant="outline" onClick={() => navigate('/doctor/patients')}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Patients</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/doctor/patients')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{patient.name}</h1>
          <p className="text-muted-foreground">Patient Profile & Clinical Dashboard</p>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-border shadow-sm md:col-span-1">
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
              {patient.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-md">{t('personalInfo')}</CardTitle>
              <CardDescription>Demographics and details</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground uppercase font-semibold">Mobile</span>
              <p className="text-sm font-medium">{patient.mobile}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase font-semibold">Email</span>
              <p className="text-sm font-medium">{patient.email}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase font-semibold">Preferred Language</span>
              <p className="text-sm font-medium capitalize">{patient.language}</p>
            </div>
            <div className="pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Diagnosis Status</span>
              <p className="text-sm font-semibold mt-0.5">{diagnosis || 'None Specified'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Adherence Scores Grid */}
        <Card className="border border-border shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="text-md">Medication Compliance Metrics</CardTitle>
            <CardDescription>Weekly, monthly and overall adherence scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Weekly</span>
                <p className={`text-2xl font-bold mt-1 ${weeklyAdherence >= 90 ? 'text-green-600' : weeklyAdherence >= 70 ? 'text-amber-500' : 'text-red-600'}`}>
                  {weeklyAdherence}%
                </p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Monthly</span>
                <p className={`text-2xl font-bold mt-1 ${monthlyAdherence >= 90 ? 'text-green-600' : monthlyAdherence >= 70 ? 'text-amber-500' : 'text-red-600'}`}>
                  {monthlyAdherence}%
                </p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50 border border-border animate-pulse">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Overall</span>
                <p className={`text-3xl font-extrabold mt-0.5 ${overallAdherence >= 90 ? 'text-green-600' : overallAdherence >= 70 ? 'text-amber-500' : 'text-red-600'}`}>
                  {overallAdherence}%
                </p>
              </div>
            </div>

            {/* Adherence Chart */}
            <div className="h-48 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={adherenceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Adherence" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Medicines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Medicines */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><Pill className="h-5 w-5 text-primary" /> Current Medicines</CardTitle>
              <CardDescription>Medication list currently active for patient</CardDescription>
            </CardHeader>
            <CardContent>
              {currentMedicines.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground">No active medicines found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('medicineName')}</TableHead>
                      <TableHead>Doses Taken</TableHead>
                      <TableHead>Remaining Stock</TableHead>
                      <TableHead>Expiry</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentMedicines.map(med => (
                      <TableRow key={med.id}>
                        <TableCell className="font-semibold">{med.name}</TableCell>
                        <TableCell>{med.doses_taken} / {med.prescribed_doses || 30}</TableCell>
                        <TableCell>
                          <span className={`font-semibold ${med.quantity < 5 ? 'text-red-600' : ''}`}>
                            {med.quantity}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={getMedicineStatus(med.expiry_date) !== 'safe' ? 'text-destructive font-semibold' : ''}>
                            {new Date(med.expiry_date).toLocaleDateString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Completed Medicines */}
          {completedMedicines.length > 0 && (
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600" /> Completed Medicines</CardTitle>
                <CardDescription>Medicines completed or out of stock</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('medicineName')}</TableHead>
                      <TableHead>Total Doses Taken</TableHead>
                      <TableHead>Stock status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedMedicines.map(med => (
                      <TableRow key={med.id} className="opacity-70">
                        <TableCell className="font-semibold">{med.name}</TableCell>
                        <TableCell>{med.doses_taken}</TableCell>
                        <TableCell><span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded">Completed / Empty</span></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Adherence logs / Consumption Timeline */}
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> {t('medicineTimeline')}</CardTitle>
              <CardDescription>Recent dosage consumption timeline</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground">No logs recorded yet.</p>
              ) : (
                <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {logs.slice(0, 10).map(log => (
                    <div key={log.id} className="flex gap-4 relative pl-8">
                      <div className={`absolute left-1.5 top-1 h-3.5 w-3.5 rounded-full border-2 border-background ${log.action === 'taken' ? 'bg-green-600' : log.action === 'skipped' ? 'bg-amber-500' : 'bg-red-600'}`} />
                      <div className="flex-1 bg-secondary/35 border border-border p-3 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{log.medicine_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{log.logged_at}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${log.action === 'taken' ? 'bg-green-100 text-green-800' : log.action === 'skipped' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                          {log.action}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Report Analysis list */}
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> AI Report Analysis History</CardTitle>
              <CardDescription>Extracted blood test analysis reports</CardDescription>
            </CardHeader>
            <CardContent>
              {aiReports.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground">No AI analyses generated yet.</p>
              ) : (
                <div className="space-y-3">
                  {aiReports.map(rep => (
                    <div key={rep.id} className="border border-border p-4 rounded-xl bg-card hover:bg-muted/35 transition-colors">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="font-semibold text-sm">{rep.file_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Analysed on {new Date(rep.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> Summarized
                        </span>
                      </div>
                      
                      <div className="mt-3 text-sm border-t border-border pt-3 space-y-2">
                        <p className="font-semibold">Summary: <span className="font-normal text-muted-foreground">{rep.summary}</span></p>
                        <p className="font-semibold text-red-600">Critical Warnings: <span className="font-normal text-muted-foreground">{rep.critical_values ? JSON.stringify(rep.critical_values) : 'None'}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Notes and Diagnosis */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Clinical Notes</CardTitle>
              <CardDescription>Enter patient diagnosis and general observations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="diagnosis" className="font-semibold">Current Diagnosis</Label>
                <Input 
                  id="diagnosis" 
                  value={diagnosis} 
                  onChange={e => setDiagnosis(e.target.value)} 
                  placeholder="e.g. Type-II Diabetes, Hypertension..." 
                  className="bg-card border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="font-semibold">{t('doctorNotes')}</Label>
                <Textarea 
                  id="notes" 
                  value={doctorNotes} 
                  onChange={e => setDoctorNotes(e.target.value)} 
                  placeholder="Write clinical follow-ups, general notes, medication adjustments..." 
                  rows={8}
                  className="bg-card border-border"
                />
              </div>

              <Button className="w-full gap-2 text-white bg-primary hover:bg-primary/95" onClick={handleSaveNotes} disabled={savingNotes}>
                <Save className="h-4 w-4" /> {savingNotes ? 'Saving...' : 'Save Patient Records'}
              </Button>
            </CardContent>
          </Card>

          {/* Blood test reports lists */}
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Lab Test Bookings</CardTitle>
              <CardDescription>Completed blood test reports</CardDescription>
            </CardHeader>
            <CardContent>
              {bloodTests.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground">No completed lab tests found.</p>
              ) : (
                <div className="space-y-3">
                  {bloodTests.map(test => (
                    <div key={test.id} className="border border-border p-3 rounded-lg bg-card text-sm space-y-1.5">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold">{test.test_type}</p>
                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded font-semibold capitalize">
                          {test.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Test Date: {new Date(test.appointment_date).toLocaleDateString()}</p>
                      {test.report_url && (
                        <a href={test.report_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-semibold hover:underline block mt-1">
                          Open Lab Report File ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
