import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ShoppingCart, LayoutList, MessageSquare, Heart, CreditCard, Star, Settings, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientSidebarProps {
  className?: string;
}

const ClientSidebar = ({ className }: ClientSidebarProps) => {
  const location = useLocation();

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
    <div className={cn("flex flex-col h-full bg-brand-card-bg text-brand-text-dark border-l border-border p-6 shadow-soft-lg", className)}>
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold font-cairo text-brand-primary">لوحة العميل</h2>
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

export default ClientSidebar;