"use client";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index"; // Landing Page
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

// Auth Context and Protected Route
import { AuthProvider } from "./hooks/use-auth";
import ProtectedRoute from "./components/ProtectedRoute";

// Service Provider Dashboard Pages
import DashboardOverviewPage from "./pages/DashboardOverviewPage";
import MyServicesListPage from "./pages/MyServicesListPage";
import AddServicePage from "./pages/AddServicePage";
import EditServicePage from "./pages/EditServicePage";
import OrdersPage from "./pages/OrdersPage";
import CalendarPage from "./pages/CalendarPage";
import CustomersPage from "./pages/CustomersPage";
import RatingsReviewsPage from "./pages/RatingsReviewsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import MessageCenterPage from "./pages/MessageCenterPage";
import SupportCenterPage from "./pages/SupportCenterPage";

// Client Home Pages
import ClientHomePage from "./pages/ClientHomePage";
import ClientServiceDetailsPage from "./pages/ClientServiceDetailsPage";
import ClientCreateRequestPage from "./pages/ClientCreateRequestPage";
import ClientOrderServicePage from "./pages/ClientOrderServicePage";

// Other existing routes
import MyRequestsPage from "./pages/MyRequestsPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider> {/* Wrap the entire application with AuthProvider */}
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            {/* Client Home Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['seeker']} layout="client-home" />}>
              <Route path="/client-home" element={<ClientHomePage />} />
              <Route path="/client-home/services/:id" element={<ClientServiceDetailsPage />} />
              <Route path="/client-home/create-request" element={<ClientCreateRequestPage />} />
              <Route path="/client-home/order-service/:id" element={<ClientOrderServicePage />} />
              {/* Client-specific profile/settings if different from provider */}
              <Route path="/client-profile" element={<ProfilePage />} /> {/* Example: Client's own profile */}
              <Route path="/client-settings" element={<SettingsPage />} /> {/* Example: Client's own settings */}
              <Route path="/client-notifications" element={<NotificationsPage />} /> {/* Example: Client's own notifications */}
              <Route path="/client-requests" element={<MyRequestsPage />} /> {/* Client's requests */}
            </Route>

            {/* Service Provider Dashboard Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['provider']} layout="dashboard" />}>
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
              {/* Provider-specific profile/notifications if different from client */}
              <Route path="/provider-profile" element={<ProfilePage />} /> {/* Example: Provider's own profile */}
              <Route path="/provider-notifications" element={<NotificationsPage />} /> {/* Example: Provider's own notifications */}
            </Route>

            {/* Generic/Unprotected Routes that might use Auth Context for conditional rendering */}
            <Route path="/profile" element={<ProfilePage />} /> {/* Can be generic, or redirect based on role */}
            <Route path="/notifications" element={<NotificationsPage />} /> {/* Can be generic, or redirect based on role */}
            <Route path="/requests" element={<MyRequestsPage />} /> {/* Can be generic, or redirect based on role */}
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;