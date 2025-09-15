'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { isSuperAdmin } from '@/lib/auth';
import Logo from '@/components/Logo';

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSuper, setIsSuper] = useState(false);

  useEffect(() => {
    setIsSuper(isSuperAdmin());
  }, []);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const navLinks = [
    { href: '/venues', label: 'Browse Venues' },
    { href: '/dress-shops', label: 'Dress Shops' },
    { href: '/vendors', label: 'Vendors' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Logo size="md" />
            {isSuper && (
              <span className="ml-3 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">
                🔑 SUPER ADMIN
              </span>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-medium transition ${
                  isActive(link.href)
                    ? 'text-pink-600 border-b-2 border-pink-600 pb-1'
                    : 'text-gray-700 hover:text-pink-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className={`font-medium transition ${
                isActive('/login')
                  ? 'text-pink-600'
                  : 'text-gray-700 hover:text-pink-600'
              }`}
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md font-medium transition"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-pink-600 focus:outline-none focus:text-pink-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition ${
                    isActive(link.href)
                      ? 'text-pink-600 bg-pink-50'
                      : 'text-gray-700 hover:text-pink-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                className={`block px-3 py-2 rounded-md text-base font-medium transition ${
                  isActive('/login')
                    ? 'text-pink-600 bg-pink-50'
                    : 'text-gray-700 hover:text-pink-600 hover:bg-gray-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="block px-3 py-2 mx-3 mt-2 bg-pink-600 hover:bg-pink-700 text-white rounded-md text-base font-medium text-center transition"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
