import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Briefcase, Package, MessageSquare, Calendar, Users, Star, BarChart, Settings, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
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
    <div className={cn("flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-4", className)}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold font-montserrat text-sidebar-primary">لوحة التحكم</h2>
      </div>
      <nav className="flex-grow space-y-2">
        {navItems.map((item) => (
          <Link key={item.label} to={item.href}>
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;