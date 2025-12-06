import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index"; // Landing Page
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

// Service Provider Dashboard Pages
import DashboardOverviewPage from "./pages/DashboardOverviewPage";
import MyServicesListPage from "./pages/MyServicesListPage";
import AddServicePage from "./pages/AddServicePage";
import EditServicePage from "./pages/EditServicePage";
import OrdersPage from "./pages/OrdersPage";
import MessageCenterPage from "./pages/MessageCenterPage";
import CalendarPage from "./pages/CalendarPage";
import CustomersPage from "./pages/CustomersPage";
import RatingsReviewsPage from "./pages/RatingsReviewsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import SupportCenterPage from "./pages/SupportCenterPage";

// Client Dashboard Pages
import ClientDashboardOverviewPage from "./pages/ClientDashboardOverviewPage";
import ClientMyOrdersPage from "./pages/ClientMyOrdersPage";
import ClientServicesCatalogPage from "./pages/ClientServicesCatalogPage";
import ClientServiceDetailsPage from "./pages/ClientServiceDetailsPage";
import ClientMessagesPage from "./pages/ClientMessagesPage";
import ClientFavoritesPage from "./pages/ClientFavoritesPage";
import ClientPaymentsPage from "./pages/ClientPaymentsPage";
import ClientReviewsRatingsPage from "./pages/ClientReviewsRatingsPage";
import ClientSettingsPage from "./pages/ClientSettingsPage";
import ClientSupportPage from "./pages/ClientSupportPage";

// Other existing routes
import ServiceDetailsPage from "./pages/ServiceDetailsPage"; // Generic service details
import MyRequestsPage from "./pages/MyRequestsPage"; // General requests page
import ProfilePage from "./pages/ProfilePage"; // General profile page
import NotificationsPage from "./pages/NotificationsPage"; // صفحة الإشعارات الجديدة
import NotFound from "./pages/NotFound";

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
          
          {/* Service Provider Dashboard Routes */}
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

          {/* Client Dashboard Routes */}
          <Route path="/client-dashboard" element={<ClientDashboardOverviewPage />} />
          <Route path="/client-dashboard/orders" element={<ClientMyOrdersPage />} />
          <Route path="/client-dashboard/services" element={<ClientServicesCatalogPage />} />
          <Route path="/client-dashboard/services/:id" element={<ClientServiceDetailsPage />} />
          <Route path="/client-dashboard/messages" element={<ClientMessagesPage />} />
          <Route path="/client-dashboard/favorites" element={<ClientFavoritesPage />} />
          <Route path="/client-dashboard/payments" element={<ClientPaymentsPage />} />
          <Route path="/client-dashboard/reviews" element={<ClientReviewsRatingsPage />} />
          <Route path="/client-dashboard/settings" element={<ClientSettingsPage />} />
          <Route path="/client-dashboard/support" element={<ClientSupportPage />} />

          {/* Other existing routes (consider if they are generic or need client/provider specific versions) */}
          <Route path="/service/:id" element={<ServiceDetailsPage />} /> {/* Generic service details */}
          <Route path="/requests" element={<MyRequestsPage />} /> {/* General requests page */}
          <Route path="/profile" element={<ProfilePage />} /> {/* General profile page */}
          <Route path="/notifications" element={<NotificationsPage />} /> {/* مسار صفحة الإشعارات الجديدة */}
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;