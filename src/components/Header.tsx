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

const Header = () => {
  return (
    <header className="bg-sky-blue-light text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold font-montserrat">
          Service Platform
        </Link>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/" className={navigationMenuTriggerStyle()}>
                  الرئيسية
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/dashboard" className={navigationMenuTriggerStyle()}>
                  لوحة التحكم
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/requests" className={navigationMenuTriggerStyle()}>
                  طلباتي
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/profile" className={navigationMenuTriggerStyle()}>
                  الملف الشخصي
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/settings" className={navigationMenuTriggerStyle()}>
                  الإعدادات
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <div>
          <Link to="/login">
            <Button variant="ghost" className="text-white hover:bg-sky-blue-light/80">
              تسجيل الدخول
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-orange-button hover:bg-orange-button/90 text-white ml-2">
              إنشاء حساب
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;