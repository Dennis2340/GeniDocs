'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  showBackButton?: boolean;
  backUrl?: string;
  actions?: ReactNode;
}

export default function PageLayout({
  children,
  title,
  showBackButton = false,
  backUrl = '/dashboard',
  actions,
}: PageLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isDashboard = pathname === '/dashboard';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <svg className="h-8 w-8 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M12 3L4 5V11.09C4 16.14 7.41 20.85 12 22C16.59 20.85 20 16.14 20 11.09V5L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="ml-2 text-xl font-bold text-gray-900">Doc Builder</span>
              </Link>
            </div>
            <nav className="flex items-center space-x-4">
              {!isDashboard && (
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
              )}
              {session?.user && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    {session.user.name}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-medium">
                    {session.user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {showBackButton && (
                <Link
                  href={backUrl}
                  className="mr-4 p-1 rounded-full bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
              )}
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            </div>
            {actions && (
              <div className="flex space-x-3">
                {actions}
              </div>
            )}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
} 