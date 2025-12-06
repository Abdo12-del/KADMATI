import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-6xl font-bold mb-4 text-sky-blue-light font-montserrat">404</h1>
          <p className="text-2xl text-gray-800 mb-6 font-open-sans">عذراً! الصفحة غير موجودة</p>
          <Link to="/">
            <Button className="bg-orange-button hover:bg-orange-button/90 text-white text-lg px-6 py-3 rounded-md">
              العودة إلى الرئيسية
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;