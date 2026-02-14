import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import PartnerDashboard from "./pages/PartnerDashboard";
import Maps from "./pages/Maps";
import Assistant from "./pages/Assistant";
import EcoAdmin from "./pages/EcoAdmin";
import { useAuth } from "./context/AuthContext";
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/" replace />;
  return children;
};

const DashboardWrapper = () => {
  const { user } = useAuth();
  if (user?.role === "Partner") return <PartnerDashboard />;
  return <Dashboard />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardWrapper /></ProtectedRoute>} />
          <Route path="/maps" element={<ProtectedRoute><Maps /></ProtectedRoute>} />
          <Route path="/assistant" element={<ProtectedRoute><Assistant /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><EcoAdmin /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster 
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
