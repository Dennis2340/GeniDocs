'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path ? 'bg-blue-700' : '';
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              GeniDocs
            </Link>
            
            {session && (
              <div className="hidden md:flex ml-10 space-x-1">
                <Link 
                  href="/dashboard" 
                  className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors ${isActive('/dashboard')}`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/dashboard/repo-select" 
                  className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors ${isActive('/dashboard/repo-select')}`}
                >
                  Repositories
                </Link>
                <Link 
                  href="/dashboard" 
                  className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors ${
                    pathname?.includes('/docs/') ? 'bg-blue-700' : ''
                  }`}
                >
                  Documentation
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            {loading ? (
              <div className="animate-pulse bg-blue-700/50 px-4 py-2 rounded-md">
                Loading...
              </div>
            ) : session ? (
              <div className="flex items-center space-x-4">
                <div className="hidden md:block">
                  <span className="text-sm font-medium">{session.user?.name}</span>
                </div>
                <div className="relative">
                  <button 
                    onClick={toggleMenu}
                    className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-md transition-colors"
                  >
                    {session.user?.image && (
                      <img src={session.user.image} alt={session.user?.name || 'User'} className="w-6 h-6 rounded-full" />
                    )}
                    <span className="md:hidden">Menu</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{session.user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                      </div>
                      <Link 
                        href="/dashboard" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 md:hidden"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link 
                        href="/dashboard/repo-select" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 md:hidden"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Repositories
                      </Link>
                      <Link 
                        href="/dashboard" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          signOut();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => signIn('github')}
                className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                Sign in with GitHub
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu for authenticated users */}
      {session && (
        <div className="md:hidden">
          <div className={`${isMenuOpen ? 'block' : 'hidden'} bg-blue-800 px-2 pt-2 pb-3 space-y-1`}>
            <Link 
              href="/dashboard" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/dashboard') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-700 hover:text-white'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              href="/dashboard/repo-select" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/dashboard/repo-select') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-700 hover:text-white'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Repositories
            </Link>
            <Link 
              href="/dashboard" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${pathname?.includes('/docs/') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-700 hover:text-white'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Documentation
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
