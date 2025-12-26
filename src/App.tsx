import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NovenasPage from "./pages/NovenasPage";
import NovenaPage from "./pages/NovenaPage";
import AuthPage from "./pages/AuthPage";
import TestimonialsPage from "./pages/TestimonialsPage";
import NewTestimonialPage from "./pages/NewTestimonialPage";
import SettingsPage from "./pages/SettingsPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminNovenas from "./pages/admin/AdminNovenas";
import AdminNovenaEditor from "./pages/admin/AdminNovenaEditor";
import AdminTestimonials from "./pages/admin/AdminTestimonials";
import NotFound from "./pages/NotFound";

import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/novenas" element={<NovenasPage />} />
            <Route path="/novena/:slug" element={<NovenaPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/testimonials" element={<TestimonialsPage />} />
            <Route path="/testimonials/new" element={<NewTestimonialPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/novenas" element={<AdminNovenas />} />
            <Route path="/admin/novenas/:id" element={<AdminNovenaEditor />} />
            <Route path="/admin/testimonials" element={<AdminTestimonials />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
