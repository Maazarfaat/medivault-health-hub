import { useNavigate, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import HospitalOverview from './hospital/HospitalOverview';
import HospitalInventory from './hospital/HospitalInventory';
import HospitalAdherence from './hospital/HospitalAdherence';
import HospitalSettings from './hospital/HospitalSettings';

export default function HospitalDashboard() {
  const navigate = useNavigate();
  const { user, profile, role, signOut } = useAuth();

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const dashboardUser = {
    id: user?.id || '', name: profile?.name || 'Hospital', email: profile?.email || '',
    mobileNumber: profile?.mobile_number || '', mobileVerified: profile?.mobile_verified || false,
    role: (role || 'hospital') as any, profileCompletion: profile?.profile_completion || 0,
  };

  return (
    <DashboardLayout user={dashboardUser} onLogout={handleLogout}>
      <Routes>
        <Route index element={<HospitalOverview />} />
        <Route path="inventory" element={<HospitalInventory />} />
        <Route path="adherence" element={<HospitalAdherence />} />
        <Route path="settings" element={<HospitalSettings />} />
        <Route path="*" element={<HospitalOverview />} />
      </Routes>
    </DashboardLayout>
  );
}
