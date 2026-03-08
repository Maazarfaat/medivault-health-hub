import { useNavigate, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import DiagnosticOverview from './diagnostic/DiagnosticOverview';
import DiagnosticBookings from './diagnostic/DiagnosticBookings';
import DiagnosticSettings from './diagnostic/DiagnosticSettings';

export default function BloodTestCentreDashboard() {
  const navigate = useNavigate();
  const { user, profile, role, signOut } = useAuth();

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const dashboardUser = {
    id: user?.id || '', name: profile?.name || 'Diagnostic Centre', email: profile?.email || '',
    mobileNumber: profile?.mobile_number || '', mobileVerified: profile?.mobile_verified || false,
    role: (role || 'bloodTestCentre') as any, profileCompletion: profile?.profile_completion || 0,
  };

  return (
    <DashboardLayout user={dashboardUser} onLogout={handleLogout}>
      <Routes>
        <Route index element={<DiagnosticOverview />} />
        <Route path="bookings" element={<DiagnosticBookings />} />
        <Route path="settings" element={<DiagnosticSettings />} />
        <Route path="*" element={<DiagnosticOverview />} />
      </Routes>
    </DashboardLayout>
  );
}
