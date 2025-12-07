"use client";

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
import CalendarPage from "./pages/CalendarPage";
import CustomersPage from "./pages/CustomersPage";
import RatingsReviewsPage from "./pages/RatingsReviewsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import SupportCenterPage from "./pages/SupportCenterPage";

// New Client Home Page
import ClientHomePage from "./pages/ClientHomePage"; // استيراد الصفحة الرئيسية الجديدة
import ClientServiceDetailsPage from "./pages/ClientServiceDetailsPage"; // استيراد صفحة تفاصيل خدمة العميل الجديدة
import ClientCreateRequestPage from "./pages/ClientCreateRequestPage"; // استيراد صفحة إضافة طلب خدمة جديد

// Other existing routes
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
          
          {/* مسار الصفحة الرئيسية الجديدة لطالب الخدمة */}
          <Route path="/client-home" element={<ClientHomePage />} />
          <Route path="/client-home/services/:id" element={<ClientServiceDetailsPage />} /> {/* مسار تفاصيل خدمة العميل */}
          <Route path="/client-home/create-request" element={<ClientCreateRequestPage />} /> {/* مسار إضافة طلب خدمة جديد */}
          
          {/* Service Provider Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardOverviewPage />} />
          <Route path="/dashboard/services" element={<MyServicesListPage />} />
          <Route path="/dashboard/services/add" element={<AddServicePage />} />
          <Route path="/dashboard/services/edit/:id" element={<EditServicePage />} />
          <Route path="/dashboard/orders" element={<OrdersPage />} />
          {/* <Route path="/dashboard/messages" element={<MessageCenterPage />} /> */} {/* تم إزالة هذا المسار */}
          <Route path="/dashboard/calendar" element={<CalendarPage />} />
          <Route path="/dashboard/customers" element={<CustomersPage />} />
          <Route path="/dashboard/ratings" element={<RatingsReviewsPage />} />
          <Route path="/dashboard/reports" element={<ReportsPage />} />
          <Route path="/dashboard/settings" element={<SettingsPage />} />
          <Route path="/dashboard/support" element={<SupportCenterPage />} />

          {/* Other existing routes (consider if they are generic or need client/provider specific versions) */}
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