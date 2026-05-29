import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TRPCProvider } from "@/providers/trpc";
import { AuthProvider } from "@/context/AuthContext";
import { ContentProvider } from "@/context/ContentContext";
import HomePage from "@/pages/HomePage";
import DashboardPage from "@/pages/DashboardPage";
import DirectorioPage from "@/pages/DirectorioPage";
import NotFound from "@/pages/NotFound";
import Login from "./pages/Login";

const App = () => (
  <TRPCProvider>
    <AuthProvider>
      <ContentProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/directorio" element={<DirectorioPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ContentProvider>
    </AuthProvider>
  </TRPCProvider>
);

export default App;
