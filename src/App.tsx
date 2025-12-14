"use client";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom"; // Added Outlet
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
import ClientServicesListPage from "./pages/ClientServicesListPage"; // Import the new page

// Other existing routes
import MyRequestsPage from "./pages/MyRequestsPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import NotFound from "./pages/NotFound";
import Header from "./components/Header"; // Re-import Header for unprotected routes
import Footer from "./components/Footer"; // Re-import Footer for unprotected routes


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider> {/* Wrap the entire application with AuthProvider */}
          <Routes>
            {/* Unprotected routes with Header and Footer */}
            <Route element={<LayoutWithHeaderFooter />}>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="*" element={<NotFound />} /> {/* Catch-all for unprotected */}
            </Route>
            
            {/* Client Home Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['seeker']} layout="client-home" />}>
              <Route path="/client-home" element={<ClientHomePage />} />
              <Route path="/client-home/services" element={<ClientServicesListPage />} /> {/* New route for category filtered services */}
              <Route path="/client-home/services/:id" element={<ClientServiceDetailsPage />} />
              <Route path="/client-home/create-request" element={<ClientCreateRequestPage />} />
              <Route path="/client-home/order-service/:id" element={<ClientOrderServicePage />} />
              <Route path="/client-profile" element={<ProfilePage />} />
              <Route path="/client-settings" element={<SettingsPage />} />
              <Route path="/client-notifications" element={<NotificationsPage />} /> {/* Unified client notifications route */}
              <Route path="/client-requests" element={<MyRequestsPage />} />
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
              <Route path="/provider-profile" element={<ProfilePage />} />
              <Route path="/dashboard/notifications" element={<NotificationsPage />} /> {/* Unified provider notifications route */}
            </Route>

            {/* Generic/Unprotected Routes that might use Auth Context for conditional rendering */}
            {/* These routes will now use the LayoutWithHeaderFooter if accessed directly */}
            {/* If they are accessed via a ProtectedRoute, the ProtectedRoute's layout will apply */}
            {/* <Route path="/profile" element={<ProfilePage />} /> */}
            {/* <Route path="/notifications" element={<NotificationsPage />} /> */}
            {/* <Route path="/requests" element={<MyRequestsPage />} */}
            
            {/* Catch-all route for any other unmatched routes, now handled by the LayoutWithHeaderFooter */}
            {/* <Route path="*" element={<NotFound />} /> */}
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// A simple layout component for routes that need a Header and Footer but are not protected
const LayoutWithHeaderFooter = () => (
  <div className="min-h-screen flex flex-col bg-brand-background">
    <Header />
    <main className="flex-grow container mx-auto px-8 py-10">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default App;