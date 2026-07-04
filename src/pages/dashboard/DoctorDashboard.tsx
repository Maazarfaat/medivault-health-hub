import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import DoctorPatients from './doctor/DoctorPatients';
import DoctorPatientProfile from './doctor/DoctorPatientProfile';
import DoctorAnalysis from './doctor/DoctorAnalysis';

// Inline simple DoctorOverview
function DoctorOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary/10 to-accent/5 rounded-2xl p-6 border border-border">
        <h1 className="text-3xl font-bold text-primary">Doctor Workspace</h1>
        <p className="text-muted-foreground mt-2 max-w-lg">
          Welcome to your MediVault professional dashboard. Review assigned patients, monitor real-time adherence levels, and run AI-assisted report analysis.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/doctor/patients')}>
          <h2 className="font-bold text-lg text-primary">My Patients</h2>
          <p className="text-sm text-muted-foreground mt-1">Monitor assigned patient profiles and medication adherence history.</p>
          <div className="text-primary text-xs font-semibold mt-4 flex items-center gap-1">Open Patient Roster →</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/doctor/analysis')}>
          <h2 className="font-bold text-lg text-primary">Report Analysis</h2>
          <p className="text-sm text-muted-foreground mt-1">Upload patient lab reports and generate structured AI summaries.</p>
          <div className="text-primary text-xs font-semibold mt-4 flex items-center gap-1">Analyze Laboratory Reports →</div>
        </div>
      </div>
    </div>
  );
}

// Inline simple Settings
function DoctorSettings() {
  const { user, profile } = useAuth();
  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your doctor account details</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-semibold uppercase">Full Name</label>
          <p className="text-sm font-medium">{profile?.name}</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-semibold uppercase">Email Address</label>
          <p className="text-sm font-medium">{profile?.email}</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-semibold uppercase">Mobile Number</label>
          <p className="text-sm font-medium">{profile?.mobile_number || 'Not Set'}</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-semibold uppercase">Workspace Role</label>
          <p className="text-sm font-medium">Licensed Medical Professional</p>
        </div>
      </div>
    </div>
  );
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { user, profile, role, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const dashboardUser = {
    id: user?.id || '',
    name: profile?.name || 'Doctor',
    email: profile?.email || '',
    mobileNumber: profile?.mobile_number || '',
    mobileVerified: profile?.mobile_verified || false,
    role: (role || 'doctor') as any,
    profileCompletion: profile?.profile_completion || 0,
  };

  return (
    <DashboardLayout user={dashboardUser} onLogout={handleLogout}>
      <Routes>
        <Route index element={<DoctorOverview />} />
        <Route path="patients" element={<DoctorPatients />} />
        <Route path="patient/:patientId" element={<DoctorPatientProfile />} />
        <Route path="analysis" element={<DoctorAnalysis />} />
        <Route path="settings" element={<DoctorSettings />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
