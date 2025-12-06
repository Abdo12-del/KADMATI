import React from 'react';
import { MadeWithDyad } from '@/components/made-with-dyad';

const Footer = () => {
  return (
    <footer className="bg-brand-card-bg text-brand-text-muted p-6 mt-12 border-t border-border shadow-soft">
      <div className="container mx-auto text-center text-sm font-ibm-plex-arabic">
        <p>&copy; {new Date().getFullYear()} منصة الخدمات. جميع الحقوق محفوظة.</p>
        <MadeWithDyad />
      </div>
    </footer>
  );
};

export default Footer;