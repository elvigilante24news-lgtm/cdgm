import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { ContentProvider } from "@/context/ContentContext";
import HomePage from "@/pages/HomePage";
import DashboardPage from "@/pages/DashboardPage";
import DirectorioPage from "@/pages/DirectorioPage";
import PagoResultadoPage from "@/pages/PagoResultadoPage"; // FIX: páginas de retorno de MercadoPago
import NotFound from "@/pages/NotFound";

const App = () => (
  <AuthProvider>
    <ContentProvider>
      <TooltipProvider>
        <Toaster />
        <HashRouter>
          <Routes>
            <Route path="/"                   element={<HomePage />} />
            <Route path="/dashboard"          element={<DashboardPage />} />
            <Route path="/directorio"         element={<DirectorioPage />} />
            {/* FIX: rutas de retorno de MercadoPago Checkout Pro */}
            <Route path="/pago/exitoso"   element={<PagoResultadoPage />} />
            <Route path="/pago/fallido"   element={<PagoResultadoPage />} />
            <Route path="/pago/pendiente" element={<PagoResultadoPage />} />
            <Route path="*"                   element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </ContentProvider>
  </AuthProvider>
);

export default App;
