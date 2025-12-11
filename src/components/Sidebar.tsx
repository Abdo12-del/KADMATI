// import React from 'react'; // Removed
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Briefcase, Package, MessageSquare, Calendar, Users, Star, BarChart, Settings, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const location = useLocation();
  const { user } = useAuth(); // Get user from auth context

  const navItems = [
    { icon: Home, label: 'نظرة عامة', href: '/dashboard' },
    { icon: Briefcase, label: 'خدماتي', href: '/dashboard/services' },
    { icon: Package, label: 'الطلبات', href: '/dashboard/orders' },
    { icon: MessageSquare, label: 'الرسائل', href: '/dashboard/messages' },
    { icon: Calendar, label: 'التقويم', href: '/dashboard/calendar' },
    { icon: Users, label: 'العملاء', href: '/dashboard/customers' },
    { icon: Star, label: 'التقييمات', href: '/dashboard/ratings' },
    { icon: BarChart, label: 'التقارير', href: '/dashboard/reports' },
    { icon: Settings, label: 'الإعدادات', href: '/dashboard/settings' },
    { icon: HelpCircle, label: 'الدعم', href: '/dashboard/support' },
  ];

  return (
    <div className={cn("flex flex-col h-full bg-brand-card-bg text-brand-text-dark border-l border-border p-6 shadow-soft-lg", className)}>
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold font-cairo text-brand-primary">
          {user?.name || 'مقدم الخدمة'} {/* Display user's name or default */}
        </h2>
      </div>
      <nav className="flex-grow space-y-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link key={item.label} to={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-end text-brand-text-dark hover:bg-brand-primary-light/20 hover:text-brand-primary rounded-xl py-3 transition-all duration-200",
                  isActive && "bg-brand-primary-light/30 text-brand-primary font-semibold shadow-soft"
                )}
              >
                <span className="ml-3 font-ibm-plex-arabic text-lg">{item.label}</span>
                <item.icon className="h-5 w-5" />
              </Button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;