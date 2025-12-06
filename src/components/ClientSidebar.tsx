import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ShoppingCart, LayoutList, MessageSquare, Heart, CreditCard, Star, Settings, HelpCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientSidebarProps {
  className?: string;
}

const ClientSidebar = ({ className }: ClientSidebarProps) => {
  const navItems = [
    { icon: Home, label: 'نظرة عامة', href: '/client-dashboard' },
    { icon: ShoppingCart, label: 'طلباتي', href: '/client-dashboard/orders' },
    { icon: LayoutList, label: 'كتالوج الخدمات', href: '/client-dashboard/services' },
    { icon: MessageSquare, label: 'الرسائل', href: '/client-dashboard/messages' },
    { icon: Heart, label: 'المفضلة', href: '/client-dashboard/favorites' },
    { icon: CreditCard, label: 'الدفع والمعاملات', href: '/client-dashboard/payments' },
    { icon: Star, label: 'تقييماتي', href: '/client-dashboard/reviews' },
    { icon: Settings, label: 'الإعدادات', href: '/client-dashboard/settings' },
    { icon: HelpCircle, label: 'الدعم والمساعدة', href: '/client-dashboard/support' },
  ];

  return (
    <div className={cn("flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-4", className)}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold font-montserrat text-sidebar-primary">لوحة تحكم العميل</h2>
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

export default ClientSidebar;