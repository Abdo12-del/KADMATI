"use client";

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import DashboardLayout from '@/components/DashboardLayout'; // Assuming provider dashboard uses this
import ClientHomeHeader from '@/components/ClientHomeHeader'; // Assuming client home uses this header
import Footer from '@/components/Footer'; // Assuming all pages use this footer
import { toast } from 'sonner'; // Import toast

interface ProtectedRouteProps {
  allowedRoles?: ('seeker' | 'provider')[];
  redirectPath?: string;
  layout?: 'dashboard' | 'client-home' | 'none'; // New prop for layout
}

const ProtectedRoute = ({ allowedRoles, redirectPath = '/login', layout = 'none' }: ProtectedRouteProps) => {
  const { isLoggedIn, userRole, isLoading } = useAuth(); // Get isLoading

  // If authentication state is still loading, render nothing or a loading spinner
  if (isLoading) {
    return null; // Or a loading component: <LoadingSpinner />
  }

  if (!isLoggedIn) {
    return <Navigate to={redirectPath} replace />;
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    // Redirect to a generic unauthorized page or home if role doesn't match
    toast.error('ليس لديك الصلاحية للوصول إلى هذه الصفحة.');
    return <Navigate to="/" replace />;
  }

  const renderContent = () => {
    switch (layout) {
      case 'dashboard':
        return (
          <DashboardLayout>
            <Outlet />
          </DashboardLayout>
        );
      case 'client-home':
        return (
          <div className="min-h-screen flex flex-col bg-brand-background">
            <ClientHomeHeader />
            <main className="flex-grow container mx-auto px-8 py-10">
              <Outlet />
            </main>
            <Footer />
          </div>
        );
      case 'none':
      default:
        return <Outlet />;
    }
  };

  return renderContent();
};

export default ProtectedRoute;