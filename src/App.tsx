import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth-context";
import { Navbar } from "@/components/Navbar";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PadariaLayout } from "@/components/padaria/PadariaLayout";
import Index from "./pages/Index";
import Sorteios from "./pages/Sorteios";
import Participantes from "./pages/Participantes";
import Padarias from "./pages/Padarias";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";
import RelatorioSorteios from "./pages/RelatorioSorteios";
import SorteiosLive from "./pages/SorteiosLive";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Perfil from "./pages/Perfil";
import { LoginPadaria } from "./pages/padaria/Login";
import { PadariaDashboard } from "./pages/padaria/Dashboard";
import { PadariaSorteio } from "./pages/padaria/Sorteio";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <Routes>
          {/* Admin Routes */}
          <Route
            path="/"
            element={
              <DashboardLayout>
                <Index />
              </DashboardLayout>
            }
          />
          <Route
            path="/participantes"
            element={
              <DashboardLayout>
                <Participantes />
              </DashboardLayout>
            }
          />
          <Route
            path="/padarias"
            element={
              <DashboardLayout>
                <Padarias />
              </DashboardLayout>
            }
          />
          <Route
            path="/sorteios"
            element={
              <DashboardLayout>
                <Sorteios />
              </DashboardLayout>
            }
          />
          <Route
            path="/relatorios"
            element={
              <DashboardLayout>
                <Relatorios />
              </DashboardLayout>
            }
          />
          <Route
            path="/relatorios/sorteios"
            element={<RelatorioSorteios />}
          />
          <Route
            path="/sorteios/live"
            element={<SorteiosLive />}
          />
          <Route
            path="/configuracoes"
            element={
              <DashboardLayout>
                <Configuracoes />
              </DashboardLayout>
            }
          />

          {/* Auth Routes */}
          <Route path="/entrar" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/perfil" element={<Perfil />} />

          {/* Padaria Routes */}
          <Route path="/padaria/login" element={<LoginPadaria />} />
          <Route
            path="/padaria/dashboard"
            element={
              <PadariaLayout>
                <PadariaDashboard />
              </PadariaLayout>
            }
          />
          <Route
            path="/padaria/sorteio"
            element={
              <PadariaLayout>
                <PadariaSorteio />
              </PadariaLayout>
            }
          />
          
          <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
