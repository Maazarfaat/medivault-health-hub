import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/dashboard/UserDashboard";
import PharmacyDashboard from "./pages/dashboard/PharmacyDashboard";
import HospitalDashboard from "./pages/dashboard/HospitalDashboard";
import BloodTestCentreDashboard from "./pages/dashboard/BloodTestCentreDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole?: string }) {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && role !== allowedRole) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function RoleRedirect() {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  switch (role) {
    case 'pharmacy': return <Navigate to="/pharmacy" replace />;
    case 'hospital': return <Navigate to="/hospital" replace />;
    case 'bloodTestCentre': return <Navigate to="/blood-test-centre" replace />;
    default: return <UserDashboard />;
  }
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    
    <Route path="/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
    <Route path="/dashboard/*" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
    
    <Route path="/pharmacy" element={<ProtectedRoute allowedRole="pharmacy"><PharmacyDashboard /></ProtectedRoute>} />
    <Route path="/pharmacy/*" element={<ProtectedRoute allowedRole="pharmacy"><PharmacyDashboard /></ProtectedRoute>} />
    
    <Route path="/hospital" element={<ProtectedRoute allowedRole="hospital"><HospitalDashboard /></ProtectedRoute>} />
    <Route path="/hospital/*" element={<ProtectedRoute allowedRole="hospital"><HospitalDashboard /></ProtectedRoute>} />
    
    <Route path="/blood-test-centre" element={<ProtectedRoute allowedRole="bloodTestCentre"><BloodTestCentreDashboard /></ProtectedRoute>} />
    <Route path="/blood-test-centre/*" element={<ProtectedRoute allowedRole="bloodTestCentre"><BloodTestCentreDashboard /></ProtectedRoute>} />
    
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <AppRoutes />
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
