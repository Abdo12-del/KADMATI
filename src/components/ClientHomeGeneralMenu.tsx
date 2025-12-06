"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, UserCircle, Settings, Heart, CreditCard, HelpCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const ClientHomeGeneralMenu = () => {
  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-brand-text-dark hover:bg-brand-background rounded-full">
          <Menu className="h-5 w-5" />
          <span className="sr-only">القائمة العامة</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 rounded-xl shadow-soft bg-brand-card-bg p-2" align="end">
        <DropdownMenuItem asChild className="p-2 text-right">
          <Link to="/client-dashboard/settings" className="flex items-center space-x-2 rtl:space-x-reverse text-brand-text-dark hover:bg-brand-background rounded-lg font-ibm-plex-arabic">
            <UserCircle className="ml-2 h-4 w-4" />
            الملف الشخصي
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="p-2 text-right">
          <Link to="/client-dashboard/settings" className="flex items-center space-x-2 rtl:space-x-reverse text-brand-text-dark hover:bg-brand-background rounded-lg font-ibm-plex-arabic">
            <Settings className="ml-2 h-4 w-4" />
            الإعدادات
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="p-2 text-right">
          <Link to="/client-dashboard/favorites" className="flex items-center space-x-2 rtl:space-x-reverse text-brand-text-dark hover:bg-brand-background rounded-lg font-ibm-plex-arabic">
            <Heart className="ml-2 h-4 w-4" />
            المفضلة
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="p-2 text-right">
          <Link to="/client-dashboard/payments" className="flex items-center space-x-2 rtl:space-x-reverse text-brand-text-dark hover:bg-brand-background rounded-lg font-ibm-plex-arabic">
            <CreditCard className="ml-2 h-4 w-4" />
            الدفع والمعاملات
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem asChild className="p-2 text-right">
          <Link to="/client-dashboard/support" className="flex items-center space-x-2 rtl:space-x-reverse text-brand-text-dark hover:bg-brand-background rounded-lg font-ibm-plex-arabic">
            <HelpCircle className="ml-2 h-4 w-4" />
            الدعم والمساعدة
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem asChild className="p-2 text-right">
          <Link to="/login" className="flex items-center space-x-2 rtl:space-x-reverse text-brand-danger hover:bg-brand-danger/10 rounded-lg font-ibm-plex-arabic">
            <LogOut className="ml-2 h-4 w-4" />
            تسجيل الخروج
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};