'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const isActive = (path: string) => {
    return pathname === path ? 'bg-indigo-600/50 border-indigo-400/50' : '';
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'backdrop-blur-xl bg-black/90 shadow-lg shadow-indigo-500/10' : 'bg-black/80'}`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold flex items-center group">
              <div className="relative mr-3 w-9 h-9 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-blue-400 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity duration-300 glow-effect"></div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white relative z-10" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gradient font-space font-bold">GeniDocs</span>
            </Link>
            
            {session && (
              <div className="hidden md:flex ml-10 space-x-2">
                <Link 
                  href="/dashboard" 
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border border-transparent hover:border-indigo-400/30 hover:bg-indigo-600/30 ${isActive('/dashboard')}`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/dashboard/repo-select" 
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border border-transparent hover:border-indigo-400/30 hover:bg-indigo-600/30 ${isActive('/dashboard/repo-select')}`}
                >
                  Repositories
                </Link>
                <Link 
                  href="/dashboard" 
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border border-transparent hover:border-indigo-400/30 hover:bg-indigo-600/30 ${
                    pathname?.includes('/docs/') ? 'bg-indigo-600/50 border-indigo-400/50' : ''
                  }`}
                >
                  Documentation
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            {loading ? (
              <div className="glass-effect px-4 py-2 rounded-xl animate-pulse">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-indigo-400/50 mr-2"></div>
                  <div className="h-4 w-16 bg-indigo-400/50 rounded"></div>
                </div>
              </div>
            ) : session ? (
              <div className="flex items-center space-x-4">
                <div className="hidden md:block">
                  <span className="text-sm font-medium text-white/90">{session.user?.name}</span>
                </div>
                <div className="relative">
                  <button 
                    onClick={toggleMenu}
                    className="flex items-center space-x-2 glass-effect hover:bg-indigo-600/20 px-4 py-2 rounded-xl transition-all duration-300 border border-white/10 hover:border-indigo-400/30"
                  >
                    {session.user?.image && (
                      <img src={session.user.image} alt={session.user?.name || 'User'} className="w-6 h-6 rounded-full ring-2 ring-indigo-400/30" />
                    )}
                    <span className="md:hidden">Menu</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/70" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 glass-effect backdrop-blur-xl bg-black/70 rounded-xl shadow-lg py-1 z-10 border border-indigo-500/20">
                      <div className="px-4 py-3 border-b border-indigo-500/20">
                        <p className="text-sm font-medium text-white truncate">{session.user?.name}</p>
                        <p className="text-xs text-indigo-300/70 truncate">{session.user?.email}</p>
                      </div>
                      <Link 
                        href="/dashboard" 
                        className="block px-4 py-2 text-sm text-white/90 hover:bg-indigo-600/30 md:hidden"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link 
                        href="/dashboard/repo-select" 
                        className="block px-4 py-2 text-sm text-white/90 hover:bg-indigo-600/30 md:hidden"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Repositories
                      </Link>
                      <Link 
                        href="/dashboard" 
                        className="block px-4 py-2 text-sm text-white/90 hover:bg-indigo-600/30"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          signOut();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-indigo-600/30"
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
                className="ai-button group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="mr-2" viewBox="0 0 16 16">
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
          <div className={`${isMenuOpen ? 'block' : 'hidden'} glass-effect backdrop-blur-xl px-4 pt-2 pb-3 space-y-1 border-t border-indigo-500/20`}>
            <Link 
              href="/dashboard" 
              className={`block px-3 py-2 rounded-lg text-base font-medium ${isActive('/dashboard') ? 'bg-indigo-600/50 text-white' : 'text-white/90 hover:bg-indigo-600/30'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              href="/dashboard/repo-select" 
              className={`block px-3 py-2 rounded-lg text-base font-medium ${isActive('/dashboard/repo-select') ? 'bg-indigo-600/50 text-white' : 'text-white/90 hover:bg-indigo-600/30'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Repositories
            </Link>
            <Link 
              href="/dashboard" 
              className={`block px-3 py-2 rounded-lg text-base font-medium ${pathname?.includes('/docs/') ? 'bg-indigo-600/50 text-white' : 'text-white/90 hover:bg-indigo-600/30'}`}
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
