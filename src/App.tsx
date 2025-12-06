import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index"; // Landing Page
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardOverviewPage from "./pages/DashboardOverviewPage"; // Renamed
import ServiceDetailsPage from "./pages/ServiceDetailsPage";
import MyRequestsPage from "./pages/MyRequestsPage";
import AddServicePage from "./pages/AddServicePage";
import EditServicePage from "./pages/EditServicePage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import MyServicesListPage from "./pages/MyServicesListPage";
import OrdersPage from "./pages/OrdersPage";
import MessageCenterPage from "./pages/MessageCenterPage";
import CalendarPage from "./pages/CalendarPage";
import CustomersPage from "./pages/CustomersPage";
import RatingsReviewsPage from "./pages/RatingsReviewsPage";
import ReportsPage from "./pages/ReportsPage";
import SupportCenterPage from "./pages/SupportCenterPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} /> {/* Landing Page */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardOverviewPage />} />
          <Route path="/dashboard/services" element={<MyServicesListPage />} />
          <Route path="/dashboard/services/add" element={<AddServicePage />} />
          <Route path="/dashboard/services/edit/:id" element={<EditServicePage />} />
          <Route path="/dashboard/orders" element={<OrdersPage />} />
          <Route path="/dashboard/messages" element={<MessageCenterPage />} />
          <Route path="/dashboard/calendar" element={<CalendarPage />} />
          <Route path="/dashboard/customers" element={<CustomersPage />} />
          <Route path="/dashboard/ratings" element={<RatingsReviewsPage />} />
          <Route path="/dashboard/reports" element={<ReportsPage />} />
          <Route path="/dashboard/settings" element={<SettingsPage />} />
          <Route path="/dashboard/support" element={<SupportCenterPage />} />

          {/* Other existing routes */}
          <Route path="/service/:id" element={<ServiceDetailsPage />} />
          <Route path="/requests" element={<MyRequestsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;