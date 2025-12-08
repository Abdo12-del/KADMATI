import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
// import Header from '@/components/Header'; // Removed
// import Footer from '@/components/Footer'; // Removed
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      {/* <Header /> */} {/* Removed */}
      <main className="flex-grow flex items-center justify-center">
        <Card className="text-center p-8 bg-brand-card-bg rounded-2xl shadow-soft">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-6xl font-cairo text-brand-primary mb-4">404</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl text-brand-text-dark mb-6 font-ibm-plex-arabic">عذراً! الصفحة غير موجودة</p>
            <Link to="/">
              <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white text-lg px-6 py-3 rounded-xl shadow-soft font-ibm-plex-arabic">
                العودة إلى الرئيسية
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
      {/* <Footer /> */} {/* Removed */}
    </div>
  );
};

export default NotFound;