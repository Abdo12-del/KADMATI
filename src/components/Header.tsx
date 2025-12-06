import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Bell, UserCircle } from 'lucide-react'; // Using Lucide for icons

const Header = () => {
  return (
    <header className="bg-brand-card-bg text-brand-text-dark p-4 shadow-soft border-b border-border">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold font-cairo text-brand-primary">
          منصة الخدمات
        </Link>
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/" className={`${navigationMenuTriggerStyle()} text-brand-text-dark hover:text-brand-primary font-ibm-plex-arabic rounded-lg`}>
                  الرئيسية
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/client-dashboard" className={`${navigationMenuTriggerStyle()} text-brand-text-dark hover:text-brand-primary font-ibm-plex-arabic rounded-lg`}>
                  لوحة العميل
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/dashboard" className={`${navigationMenuTriggerStyle()} text-brand-text-dark hover:text-brand-primary font-ibm-plex-arabic rounded-lg`}>
                  لوحة مقدم الخدمة
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="relative text-brand-text-dark hover:bg-brand-background rounded-full">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-brand-danger border-2 border-brand-card-bg" />
          </Button>
          <Link to="/profile">
            <Button variant="ghost" size="icon" className="text-brand-text-dark hover:bg-brand-background rounded-full">
              <UserCircle className="h-6 w-6" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-lg font-ibm-plex-arabic px-4 py-2">
              تسجيل الدخول
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg font-ibm-plex-arabic px-4 py-2">
              إنشاء حساب
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;