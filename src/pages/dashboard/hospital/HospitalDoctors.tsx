import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, UserPlus, ShieldAlert, Key, Edit, ToggleLeft, ToggleRight, UserCheck } from 'lucide-react';

interface DoctorData {
  id: string;
  name: string;
  email: string;
  mobile_number: string | null;
  doctor_id: string;
  department: string;
  specialization: string;
  employee_id: string;
  is_active: boolean;
}

export default function HospitalDoctors() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  
  // Active doctor states for editing
  const [activeDoctor, setActiveDoctor] = useState<DoctorData | null>(null);
  
  // Form fields
  const [docName, setDocName] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docPassword, setDocPassword] = useState('');
  const [docPhone, setDocPhone] = useState('');
  const [docId, setDocId] = useState('');
  const [docDept, setDocDept] = useState('');
  const [docSpec, setDocSpec] = useState('');
  const [docEmpId, setDocEmpId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Patient assignment states
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);

  // Fetch doctors list
  const fetchDoctors = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get all doctors for this hospital
      const { data: docRecords, error: docError } = await supabase
        .from('doctors')
        .select('*')
        .eq('hospital_id', user.id);
        
      if (docError) throw docError;
      
      if (docRecords && docRecords.length > 0) {
        const docIds = docRecords.map(d => d.id);
        
        // Get user profiles for these doctors
        const { data: profileRecords, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', docIds);
          
        if (profileError) throw profileError;
        
        // Merge profiles with doctor details
        const mergedDocs = docRecords.map(doc => {
          const prof = profileRecords?.find(p => p.user_id === doc.id);
          return {
            id: doc.id,
            name: prof?.name || '',
            email: prof?.email || '',
            mobile_number: prof?.mobile_number || '',
            doctor_id: doc.doctor_id,
            department: doc.department,
            specialization: doc.specialization,
            employee_id: doc.employee_id,
            is_active: doc.is_active
          };
        });
        
        setDoctors(mergedDocs);
      } else {
        setDoctors([]);
      }
    } catch (error: any) {
      toast({ title: 'Error fetching doctors', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Handle Add Doctor
  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      // Create non-persisted client to sign up the doctor
      const tempClient = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
      });
      
      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: docEmail,
        password: docPassword,
        options: {
          data: {
            name: docName,
            role: 'doctor'
          }
        }
      });
      
      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');
      
      const doctorUid = authData.user.id;
      
      // Insert doctor record
      const { error: docTableError } = await supabase
        .from('doctors')
        .insert({
          id: doctorUid,
          hospital_id: user.id,
          doctor_id: docId,
          department: docDept,
          specialization: docSpec,
          employee_id: docEmpId,
          is_active: true
        });
        
      if (docTableError) throw docTableError;
      
      // Update profile phone number
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ mobile_number: docPhone } as any)
        .eq('user_id', doctorUid);
        
      if (profileError) throw profileError;
      
      toast({ title: t('doctorAdded') || 'Doctor Added', description: 'Doctor account has been created successfully.' });
      setAddOpen(false);
      resetAddForm();
      fetchDoctors();
    } catch (error: any) {
      toast({ title: 'Registration Failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit Doctor
  const handleEditDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoctor) return;
    
    setLoading(true);
    try {
      const { error: docError } = await supabase
        .from('doctors')
        .update({
          doctor_id: docId,
          department: docDept,
          specialization: docSpec,
          employee_id: docEmpId
        })
        .eq('id', activeDoctor.id);
        
      if (docError) throw docError;
      
      const { error: profError } = await supabase
        .from('profiles')
        .update({
          name: docName,
          mobile_number: docPhone
        } as any)
        .eq('user_id', activeDoctor.id);
        
      if (profError) throw profError;
      
      toast({ title: 'Profile Updated', description: 'Doctor profile details have been saved.' });
      setEditOpen(false);
      fetchDoctors();
    } catch (error: any) {
      toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoctor) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_reset_doctor_password', {
        _doctor_id: activeDoctor.id,
        _new_password: newPassword
      });
      
      if (error) throw error;
      
      toast({ title: 'Password Reset Successful', description: `Password for ${activeDoctor.name} has been reset.` });
      setPasswordOpen(false);
      setNewPassword('');
    } catch (error: any) {
      toast({ title: 'Reset Failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Toggle Doctor Active Status
  const toggleDoctorStatus = async (doctor: DoctorData) => {
    try {
      const { error } = await supabase
        .from('doctors')
        .update({ is_active: !doctor.is_active })
        .eq('id', doctor.id);
        
      if (error) throw error;
      
      toast({ 
        title: doctor.is_active ? 'Doctor Deactivated' : 'Doctor Activated', 
        description: `${doctor.name} status updated successfully.` 
      });
      fetchDoctors();
    } catch (error: any) {
      toast({ title: 'Failed to update status', description: error.message, variant: 'destructive' });
    }
  };

  // Delete Doctor
  const handleDeleteDoctor = async (doctor: DoctorData) => {
    if (!window.confirm(`Are you sure you want to delete Doctor ${doctor.name}? This will remove their role and credentials.`)) return;
    
    try {
      // Deleting user roles and doctors records
      await supabase.from('doctors').delete().eq('id', doctor.id);
      await supabase.from('user_roles').delete().eq('user_id', doctor.id).eq('role', 'doctor');
      
      toast({ title: 'Doctor Deleted', description: 'Doctor record and dashboard access removed.' });
      fetchDoctors();
    } catch (error: any) {
      toast({ title: 'Deletion Failed', description: error.message, variant: 'destructive' });
    }
  };

  // Open Assign Patients Dialog
  const openAssignPatients = async (doctor: DoctorData) => {
    setActiveDoctor(doctor);
    setAssignOpen(true);
    
    try {
      // Fetch all patients (users with role 'user')
      const { data: roleUsers, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'user');
        
      if (roleError) throw roleError;
      
      const userIds = roleUsers?.map(r => r.user_id) || [];
      
      if (userIds.length > 0) {
        const { data: patientsData, error: patientError } = await supabase
          .from('profiles')
          .select('user_id, name, email, mobile_number')
          .in('user_id', userIds);
          
        if (patientError) throw patientError;
        setPatients(patientsData || []);
      } else {
        setPatients([]);
      }
      
      // Fetch currently assigned patients
      const { data: assignments, error: assignError } = await supabase
        .from('doctor_patient_assignments')
        .select('patient_id')
        .eq('doctor_id', doctor.id);
        
      if (assignError) throw assignError;
      setSelectedPatients(assignments?.map(a => a.patient_id) || []);
      
    } catch (error: any) {
      toast({ title: 'Failed to load patient data', description: error.message, variant: 'destructive' });
    }
  };

  // Handle Save Patient Assignments
  const handleSaveAssignments = async () => {
    if (!activeDoctor) return;
    
    setLoading(true);
    try {
      // Delete existing assignments for this doctor
      const { error: deleteError } = await supabase
        .from('doctor_patient_assignments')
        .delete()
        .eq('doctor_id', activeDoctor.id);
        
      if (deleteError) throw deleteError;
      
      // Insert new assignments
      if (selectedPatients.length > 0) {
        const insertData = selectedPatients.map(patientId => ({
          doctor_id: activeDoctor.id,
          patient_id: patientId,
          status: 'active'
        }));
        
        const { error: insertError } = await supabase
          .from('doctor_patient_assignments')
          .insert(insertData);
          
        if (insertError) throw insertError;
      }
      
      toast({ title: 'Assignments Saved', description: 'Patient list updated for this doctor.' });
      setAssignOpen(false);
    } catch (error: any) {
      toast({ title: 'Failed to save assignments', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePatientCheckboxChange = (patientId: string, checked: boolean) => {
    if (checked) {
      setSelectedPatients(prev => [...prev, patientId]);
    } else {
      setSelectedPatients(prev => prev.filter(id => id !== patientId));
    }
  };

  // Form Resetters
  const resetAddForm = () => {
    setDocName('');
    setDocEmail('');
    setDocPassword('');
    setDocPhone('');
    setDocId('');
    setDocDept('');
    setDocSpec('');
    setDocEmpId('');
  };

  const openEditDialog = (doctor: DoctorData) => {
    setActiveDoctor(doctor);
    setDocName(doctor.name);
    setDocPhone(doctor.mobile_number || '');
    setDocId(doctor.doctor_id);
    setDocDept(doctor.department);
    setDocSpec(doctor.specialization);
    setDocEmpId(doctor.employee_id);
    setEditOpen(true);
  };

  const openPasswordDialog = (doctor: DoctorData) => {
    setActiveDoctor(doctor);
    setPasswordOpen(true);
  };

  const filteredDoctors = doctors.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.doctor_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('manageDoctors')}</h1>
          <p className="text-muted-foreground">Add and manage medical professionals and assign patients</p>
        </div>
        
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/95 text-white gap-2">
              <UserPlus className="h-4 w-4" /> {t('addDoctor')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('addDoctor')}</DialogTitle>
              <DialogDescription>Create a new doctor account with login credentials</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-name">{t('name')} *</Label>
                  <Input id="add-name" required value={docName} onChange={e => setDocName(e.target.value)} placeholder="Dr. John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-phone">{t('mobile')} *</Label>
                  <Input id="add-phone" required value={docPhone} onChange={e => setDocPhone(e.target.value)} placeholder="+91..." />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="add-email">{t('email')} *</Label>
                <Input id="add-email" type="email" required value={docEmail} onChange={e => setDocEmail(e.target.value)} placeholder="doctor@medivault.com" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="add-password">Password *</Label>
                <Input id="add-password" type="password" required value={docPassword} onChange={e => setDocPassword(e.target.value)} placeholder="••••••••" minLength={8} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-docid">{t('doctorId')} *</Label>
                  <Input id="add-docid" required value={docId} onChange={e => setDocId(e.target.value)} placeholder="DOC-2026-001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-empid">{t('employeeId')} *</Label>
                  <Input id="add-empid" required value={docEmpId} onChange={e => setDocEmpId(e.target.value)} placeholder="EMP-442" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-dept">{t('department')} *</Label>
                  <Input id="add-dept" required value={docDept} onChange={e => setDocDept(e.target.value)} placeholder="Cardiology" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-spec">{t('specialization')} *</Label>
                  <Input id="add-spec" required value={docSpec} onChange={e => setDocSpec(e.target.value)} placeholder="Heart Failure Spec." />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>{t('cancel')}</Button>
                <Button type="submit" disabled={loading}>{t('submit')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="Search doctors by name, ID, department..." 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)} 
          className="pl-9 bg-card border-border max-w-md"
        />
      </div>

      {/* Doctors Table */}
      <Card className="border border-border shadow-elevated">
        <CardContent className="p-0">
          {loading && doctors.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">{t('loading')}</div>
          ) : filteredDoctors.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No doctors found. Add doctors to begin managing.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('doctorId')}</TableHead>
                  <TableHead>{t('department')}</TableHead>
                  <TableHead>{t('specialization')}</TableHead>
                  <TableHead>{t('mobile')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDoctors.map(doctor => (
                  <TableRow key={doctor.id} className={!doctor.is_active ? 'opacity-60 bg-muted/20' : ''}>
                    <TableCell className="font-semibold">{doctor.name}</TableCell>
                    <TableCell>{doctor.doctor_id}</TableCell>
                    <TableCell>{doctor.department}</TableCell>
                    <TableCell>{doctor.specialization}</TableCell>
                    <TableCell>{doctor.mobile_number || t('notSet')}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${doctor.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {doctor.is_active ? t('active') : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" title={t('assignPatients')} onClick={() => openAssignPatients(doctor)}>
                          <UserCheck className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button size="icon" variant="ghost" title={t('edit')} onClick={() => openEditDialog(doctor)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title={t('resetPassword')} onClick={() => openPasswordDialog(doctor)}>
                          <Key className="h-4 w-4 text-amber-600" />
                        </Button>
                        <Button size="icon" variant="ghost" title={doctor.is_active ? t('deactivateDoctor') : t('activateDoctor')} onClick={() => toggleDoctorStatus(doctor)}>
                          {doctor.is_active ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" title={t('deleteDoctor')} onClick={() => handleDeleteDoctor(doctor)}>
                          <ShieldAlert className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Doctor Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('editDoctor')}</DialogTitle>
            <DialogDescription>Modify doctor account and professional details</DialogDescription>
          </DialogHeader>
          {activeDoctor && (
            <form onSubmit={handleEditDoctor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">{t('name')} *</Label>
                  <Input id="edit-name" required value={docName} onChange={e => setDocName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">{t('mobile')} *</Label>
                  <Input id="edit-phone" required value={docPhone} onChange={e => setDocPhone(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-docid">{t('doctorId')} *</Label>
                  <Input id="edit-docid" required value={docId} onChange={e => setDocId(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-empid">{t('employeeId')} *</Label>
                  <Input id="edit-empid" required value={docEmpId} onChange={e => setDocEmpId(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-dept">{t('department')} *</Label>
                  <Input id="edit-dept" required value={docDept} onChange={e => setDocDept(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-spec">{t('specialization')} *</Label>
                  <Input id="edit-spec" required value={docSpec} onChange={e => setDocSpec(e.target.value)} />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('cancel')}</Button>
                <Button type="submit" disabled={loading}>{t('save')}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('resetPassword')}</DialogTitle>
            <DialogDescription>Reset password for {activeDoctor?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-newpwd">New Password *</Label>
              <Input id="reset-newpwd" type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" minLength={8} />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setPasswordOpen(false)}>{t('cancel')}</Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white" disabled={loading}>Reset Password</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Patients Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('assignPatients')}</DialogTitle>
            <DialogDescription>Select patients to assign to Dr. {activeDoctor?.name}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-2">
            <p className="text-sm font-semibold text-muted-foreground border-b pb-2">Registered Patients</p>
            {patients.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No patients registered in MediVault.</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {patients.map(patient => (
                  <div key={patient.user_id} className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <Checkbox 
                      id={`p-${patient.user_id}`} 
                      checked={selectedPatients.includes(patient.user_id)}
                      onCheckedChange={(checked) => handlePatientCheckboxChange(patient.user_id, !!checked)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`p-${patient.user_id}`} className="font-semibold text-sm cursor-pointer block">{patient.name}</Label>
                      <span className="text-xs text-muted-foreground block">{patient.email} | Mobile: {patient.mobile_number || t('notSet')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>{t('cancel')}</Button>
            <Button type="button" onClick={handleSaveAssignments} disabled={loading}>{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
