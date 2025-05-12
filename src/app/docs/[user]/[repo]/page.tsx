"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DocsViewerPage({ params }: { params: { user: string; repo: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentation, setDocumentation] = useState<any>(null);

  useEffect(() => {
    async function fetchDocumentation() {
      try {
        setLoading(true);
        setError(null);
        
        // In a real implementation, you would fetch the documentation from your backend
        // For now, we'll simulate a successful response
        setTimeout(() => {
          setDocumentation({
            title: `${params.repo} Documentation`,
            description: `Auto-generated documentation for ${params.user}/${params.repo}`,
            sections: [
              {
                title: 'Introduction',
                content: 'This documentation was generated using GeniDocs, an AI-powered documentation generator.'
              },
              {
                title: 'Getting Started',
                content: 'To use this project, clone the repository and follow the setup instructions.'
              },
              {
                title: 'API Reference',
                content: 'The API documentation will be available here once generated.'
              }
            ]
          });
          setLoading(false);
        }, 1500);
        
      } catch (err: any) {
        console.error('Error fetching documentation:', err);
        setError(err.message || 'An error occurred while fetching documentation');
        setLoading(false);
      }
    }
    
    fetchDocumentation();
  }, [params.user, params.repo]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-2">
          <h1 className="text-2xl font-bold">
            {loading ? 'Loading Documentation...' : documentation?.title || 'Documentation'}
          </h1>
          <Link 
            href="/dashboard"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Back to Dashboard
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-100 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
          </div>
        ) : documentation ? (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="mb-6">
              <p className="text-gray-400 mb-4">{documentation.description}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">
                  {params.user}/{params.repo}
                </span>
                <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">
                  Generated with AI
                </span>
              </div>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="md:col-span-1 bg-gray-700/50 p-4 rounded">
                <h3 className="text-lg font-semibold mb-3">Contents</h3>
                <ul className="space-y-2">
                  {documentation.sections.map((section: any, index: number) => (
                    <li key={index}>
                      <a 
                        href={`#section-${index}`}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="md:col-span-3">
                {documentation.sections.map((section: any, index: number) => (
                  <div 
                    key={index} 
                    id={`section-${index}`}
                    className="mb-8"
                  >
                    <h2 className="text-xl font-bold mb-3 border-b border-gray-700 pb-2">
                      {section.title}
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p>{section.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">No Documentation Found</h2>
            <p className="text-sm text-gray-400 mb-4">
              We couldn't find documentation for this repository.
            </p>
            <Link 
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded inline-block"
            >
              Return to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
