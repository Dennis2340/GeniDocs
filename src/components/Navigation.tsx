'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  const isActive = (path: string) => {
    return pathname === path ? 'bg-blue-700' : '';
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              GeniDocs
            </Link>
            
            {session && (
              <div className="hidden md:flex ml-10 space-x-4">
                <Link href="/" className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 ${isActive('/')}`}>
                  Dashboard
                </Link>
                <Link href="/repositories" className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 ${isActive('/repositories')}`}>
                  Repositories
                </Link>
                <Link href="/documentation" className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 ${isActive('/documentation')}`}>
                  Documentation
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            {loading ? (
              <div className="animate-pulse bg-blue-700 px-4 py-2 rounded-md">
                Loading...
              </div>
            ) : session ? (
              <div className="flex items-center space-x-4">
                <div className="hidden md:block">
                  <span className="text-sm">{session.user?.name}</span>
                </div>
                <div className="relative group">
                  <button className="flex items-center space-x-2 bg-blue-700 px-4 py-2 rounded-md">
                    <span className="md:hidden">Menu</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                    <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Settings
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => signIn('github')}
                className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100"
              >
                Sign in with GitHub
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
