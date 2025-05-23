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
    <div className="min-h-screen bg-gray-50 pt-24"> {/* Increased padding-top to create more space between navbar and content */}
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