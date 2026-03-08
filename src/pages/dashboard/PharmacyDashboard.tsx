import { useNavigate, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import PharmacyOverview from './pharmacy/PharmacyOverview';
import PharmacyInventory from './pharmacy/PharmacyInventory';
import PharmacySell from './pharmacy/PharmacySell';
import PharmacyCSV from './pharmacy/PharmacyCSV';
import PharmacyRestock from './pharmacy/PharmacyRestock';
import PharmacySettings from './pharmacy/PharmacySettings';

export default function PharmacyDashboard() {
  const navigate = useNavigate();
  const { user, profile, role, signOut } = useAuth();

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const dashboardUser = {
    id: user?.id || '', name: profile?.name || 'Pharmacy', email: profile?.email || '',
    mobileNumber: profile?.mobile_number || '', mobileVerified: profile?.mobile_verified || false,
    role: (role || 'pharmacy') as any, profileCompletion: profile?.profile_completion || 0,
  };

  return (
    <DashboardLayout user={dashboardUser} onLogout={handleLogout}>
      <Routes>
        <Route index element={<PharmacyOverview />} />
        <Route path="inventory" element={<PharmacyInventory />} />
        <Route path="sell" element={<PharmacySell />} />
        <Route path="csv" element={<PharmacyCSV />} />
        <Route path="restock" element={<PharmacyRestock />} />
        <Route path="settings" element={<PharmacySettings />} />
        <Route path="*" element={<PharmacyOverview />} />
      </Routes>
    </DashboardLayout>
  );
}
