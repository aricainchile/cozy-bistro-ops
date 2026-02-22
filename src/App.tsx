import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");

  const handleLogin = (role: string) => {
    setUserRole(role);
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Login onLogin={handleLogin} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/usuarios" element={<UsersPage />} />
              <Route path="/mesas" element={<Tables />} />
              <Route path="/productos" element={<Products />} />
              <Route path="/pedidos" element={<Orders />} />
              <Route path="/caja" element={<CashRegister />} />
              <Route path="/inventario" element={<Inventory />} />
              <Route path="/impresion" element={<Printing />} />
              <Route path="/delivery" element={<Delivery />} />
              <Route path="/fidelizacion" element={<Loyalty />} />
              <Route path="/personal" element={<Staff />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/analisis" element={<Analytics />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
