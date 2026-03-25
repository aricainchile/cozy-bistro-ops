import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/UsersPage";
import Tables from "./pages/Tables";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import CashRegister from "./pages/CashRegister";
import Inventory from "./pages/Inventory";
import Printing from "./pages/Printing";
import Delivery from "./pages/Delivery";
import Loyalty from "./pages/Loyalty";
import Staff from "./pages/Staff";
import POS from "./pages/POS";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import { AppModule } from "@/lib/permissions";
import { ReactNode } from "react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ module, children }: { module: AppModule; children: ReactNode }) => {
  const { hasAccess } = useAuth();
  if (!hasAccess(module)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <Login />;

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/usuarios" element={<ProtectedRoute module="usuarios"><UsersPage /></ProtectedRoute>} />
          <Route path="/mesas" element={<ProtectedRoute module="mesas"><Tables /></ProtectedRoute>} />
          <Route path="/productos" element={<ProtectedRoute module="productos"><Products /></ProtectedRoute>} />
          <Route path="/pedidos" element={<ProtectedRoute module="pedidos"><Orders /></ProtectedRoute>} />
          <Route path="/caja" element={<ProtectedRoute module="caja"><CashRegister /></ProtectedRoute>} />
          <Route path="/inventario" element={<ProtectedRoute module="inventario"><Inventory /></ProtectedRoute>} />
          <Route path="/impresion" element={<ProtectedRoute module="impresion"><Printing /></ProtectedRoute>} />
          <Route path="/delivery" element={<ProtectedRoute module="delivery"><Delivery /></ProtectedRoute>} />
          <Route path="/fidelizacion" element={<ProtectedRoute module="fidelizacion"><Loyalty /></ProtectedRoute>} />
          <Route path="/personal" element={<ProtectedRoute module="personal"><Staff /></ProtectedRoute>} />
          <Route path="/pos" element={<ProtectedRoute module="pos"><POS /></ProtectedRoute>} />
          <Route path="/analisis" element={<ProtectedRoute module="analisis"><Analytics /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
