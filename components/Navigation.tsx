"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navigation = () => {
  const pathname = usePathname();
  
  return (
    <nav className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-b border-border z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-semibold">PhishyBusiness</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className={`nav-link transition-colors duration-200 hover:text-blue-500 ${
                pathname === '/' ? 'text-blue-500' : 'text-foreground/60'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/data" 
              className={`nav-link transition-colors duration-200 hover:text-blue-500 ${
                pathname === '/data' ? 'text-blue-500' : 'text-foreground/60'
              }`}
            >
              Data
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 