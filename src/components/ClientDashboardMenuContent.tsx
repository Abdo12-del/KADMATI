import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, ShoppingCart, LayoutList, MessageSquare, Heart, CreditCard, Star, Settings, HelpCircle, UserCircle, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientDashboardMenuContentProps {
  onNavigate: (page: string) => void; // لتغيير المحتوى داخل النافذة المنبثقة
  activePage: string; // لتحديد العنصر النشط
  onCloseModal: () => void; // لإغلاق النافذة المنبثقة عند تسجيل الخروج
}

const ClientDashboardMenuContent = ({ onNavigate, activePage, onCloseModal }: ClientDashboardMenuContentProps) => {
  const navItems = [
    { icon: Home, label: 'نظرة عامة', page: 'overview' },
    { icon: ShoppingCart, label: 'طلباتي', page: 'orders' },
    { icon: LayoutList, label: 'كتالوج الخدمات', page: 'services' },
    { icon: MessageSquare, label: 'الرسائل', page: 'messages' },
    { icon: Heart, label: 'المفضلة', page: 'favorites' },
    { icon: CreditCard, label: 'الدفع والمعاملات', page: 'payments' },
    { icon: Star, label: 'تقييماتي', page: 'reviews' },
    { icon: Settings, label: 'الإعدادات', page: 'settings' },
    { icon: HelpCircle, label: 'الدعم والمساعدة', page: 'support' },
    { icon: UserCircle, label: 'الملف الشخصي', page: 'profile' },
  ];

  return (
    <div className="flex flex-col h-full text-brand-text-dark p-2">
      {/* تم إزالة العنوان الداخلي 'لوحة العميل' */}
      <nav className="flex-grow space-y-2">
        {navItems.map((item) => {
          const isActive = activePage === item.page;
          return (
            <Button
              key={item.label}
              onClick={() => onNavigate(item.page)}
              variant="ghost"
              className={cn(
                "w-full justify-end text-brand-text-dark hover:bg-brand-primary-light/20 hover:text-brand-primary rounded-lg py-3 transition-all duration-200",
                isActive && "bg-brand-primary-light/30 text-brand-primary font-semibold shadow-soft"
              )}
            >
              <span className="ml-3 font-ibm-plex-arabic text-lg">{item.label}</span>
              <item.icon className="h-5 w-5" />
            </Button>
          );
        })}
        <div className="pt-4 border-t border-border mt-4">
          <Button
            variant="destructive"
            onClick={onCloseModal}
            className="w-full justify-end bg-brand-danger hover:bg-brand-danger/90 text-white rounded-lg py-3 shadow-soft font-ibm-plex-arabic"
          >
            <span className="ml-3 text-lg">تسجيل الخروج</span>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default ClientDashboardMenuContent;