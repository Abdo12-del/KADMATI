import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ShoppingCart, LayoutList, MessageSquare, Heart, CreditCard, Star, Settings, HelpCircle, UserCircle, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientDashboardMenuContentProps {
  onLinkClick?: () => void; // لإغلاق النافذة المنبثقة عند النقر على رابط
}

const ClientDashboardMenuContent = ({ onLinkClick }: ClientDashboardMenuContentProps) => {
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
    { icon: UserCircle, label: 'الملف الشخصي', href: '/profile' }, // إضافة رابط للملف الشخصي
  ];

  return (
    <div className="flex flex-col h-full text-brand-text-dark p-2">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold font-cairo text-brand-primary">لوحة العميل</h2>
      </div>
      <nav className="flex-grow space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link key={item.label} to={item.href} onClick={onLinkClick}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-end text-brand-text-dark hover:bg-brand-primary-light/20 hover:text-brand-primary rounded-lg py-3 transition-all duration-200",
                  isActive && "bg-brand-primary-light/30 text-brand-primary font-semibold shadow-soft"
                )}
              >
                <span className="ml-3 font-ibm-plex-arabic text-lg">{item.label}</span>
                <item.icon className="h-5 w-5" />
              </Button>
            </Link>
          );
        })}
        <div className="pt-4 border-t border-border mt-4">
          <Link to="/login" onClick={onLinkClick}>
            <Button
              variant="destructive"
              className="w-full justify-end bg-brand-danger hover:bg-brand-danger/90 text-white rounded-lg py-3 shadow-soft font-ibm-plex-arabic"
            >
              <span className="ml-3 text-lg">تسجيل الخروج</span>
              <LogOut className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default ClientDashboardMenuContent;