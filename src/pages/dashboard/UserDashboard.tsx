import { useNavigate, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import UserOverview from './user/UserOverview';
import UserMedicines from './user/UserMedicines';
import UserReminders from './user/UserReminders';
import UserRestockRequests from './user/UserRestockRequests';
import UserBloodTests from './user/UserBloodTests';
import UserNotifications from './user/UserNotifications';
import UserProfile from './user/UserProfile';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, profile, role, signOut } = useAuth();

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const dashboardUser = {
    id: user?.id || '', name: profile?.name || 'User', email: profile?.email || '',
    mobileNumber: profile?.mobile_number || '', mobileVerified: profile?.mobile_verified || false,
    role: (role || 'user') as any, profileCompletion: profile?.profile_completion || 0,
  };

  return (
    <DashboardLayout user={dashboardUser} onLogout={handleLogout}>
      <Routes>
        <Route index element={<UserOverview />} />
        <Route path="medicines" element={<UserMedicines />} />
        <Route path="reminders" element={<UserReminders />} />
        <Route path="restock" element={<UserRestockRequests />} />
        <Route path="book-test" element={<UserBloodTests />} />
        <Route path="notifications" element={<UserNotifications />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="*" element={<UserOverview />} />
      </Routes>
    </DashboardLayout>
  );
}
