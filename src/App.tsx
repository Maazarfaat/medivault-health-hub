import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/dashboard/UserDashboard";
import PharmacyDashboard from "./pages/dashboard/PharmacyDashboard";
import HospitalDashboard from "./pages/dashboard/HospitalDashboard";
import BloodTestCentreDashboard from "./pages/dashboard/BloodTestCentreDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* User Dashboard */}
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/dashboard/medicines" element={<UserDashboard />} />
          <Route path="/dashboard/book-test" element={<UserDashboard />} />
          <Route path="/dashboard/adherence" element={<UserDashboard />} />
          
          {/* Pharmacy Dashboard */}
          <Route path="/pharmacy" element={<PharmacyDashboard />} />
          <Route path="/pharmacy/inventory" element={<PharmacyDashboard />} />
          <Route path="/pharmacy/sell" element={<PharmacyDashboard />} />
          <Route path="/pharmacy/csv" element={<PharmacyDashboard />} />
          <Route path="/pharmacy/restock" element={<PharmacyDashboard />} />
          
          {/* Hospital Dashboard */}
          <Route path="/hospital" element={<HospitalDashboard />} />
          <Route path="/hospital/inventory" element={<HospitalDashboard />} />
          <Route path="/hospital/adherence" element={<HospitalDashboard />} />
          
          {/* Blood Test Centre Dashboard */}
          <Route path="/blood-test-centre" element={<BloodTestCentreDashboard />} />
          <Route path="/blood-test-centre/bookings" element={<BloodTestCentreDashboard />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
