import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminRoute, BakeryRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PadariaLayout } from "@/components/padaria/PadariaLayout";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Sorteios from "./pages/Sorteios";
import Participantes from "./pages/Participantes";
import Padarias from "./pages/Padarias";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";
import RelatorioSorteios from "./pages/RelatorioSorteios";
import SorteiosLive from "./pages/SorteiosLive";
import Campanhas from "./pages/Campanhas";
import { LoginPadaria } from "./pages/padaria/Login";
import { RegisterPadaria } from "./pages/padaria/Register";
import { PadariaDashboard } from "./pages/padaria/Dashboard";
import { PadariaSorteio } from "./pages/padaria/Sorteio";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PWAUpdatePrompt />
        <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes - Protected */}
          <Route
            path="/"
            element={
              <AdminRoute>
                <DashboardLayout>
                  <Index />
                </DashboardLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/participantes"
            element={
              <AdminRoute>
                <DashboardLayout>
                  <Participantes />
                </DashboardLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/padarias"
            element={
              <AdminRoute>
                <DashboardLayout>
                  <Padarias />
                </DashboardLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/sorteios"
            element={
              <AdminRoute>
                <DashboardLayout>
                  <Sorteios />
                </DashboardLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/campanhas"
            element={
              <AdminRoute>
                <DashboardLayout>
                  <Campanhas />
                </DashboardLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <AdminRoute>
                <DashboardLayout>
                  <Relatorios />
                </DashboardLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/relatorios/sorteios"
            element={
              <AdminRoute>
                <RelatorioSorteios />
              </AdminRoute>
            }
          />
          <Route
            path="/sorteios/live"
            element={
              <AdminRoute>
                <SorteiosLive />
              </AdminRoute>
            }
          />
          <Route
            path="/sorteio/live"
            element={
              <AdminRoute>
                <SorteiosLive />
              </AdminRoute>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <AdminRoute>
                <DashboardLayout>
                  <Configuracoes />
                </DashboardLayout>
              </AdminRoute>
            }
          />

          {/* Padaria Routes - Protected */}
          <Route path="/padaria/login" element={<LoginPadaria />} />
          <Route path="/padaria/cadastro" element={<RegisterPadaria />} />
          <Route
            path="/padaria/dashboard"
            element={
              <BakeryRoute>
                <PadariaLayout>
                  <PadariaDashboard />
                </PadariaLayout>
              </BakeryRoute>
            }
          />
          <Route
            path="/padaria/sorteio"
            element={
              <BakeryRoute>
                <PadariaLayout>
                  <PadariaSorteio />
                </PadariaLayout>
              </BakeryRoute>
            }
          />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
