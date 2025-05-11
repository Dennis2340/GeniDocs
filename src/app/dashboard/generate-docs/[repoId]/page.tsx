"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function GenerateDocs({ params }: { params: { repoId: string } }) {
  const [status, setStatus] = useState('Initializing...');
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function generateDocs() {
      try {
        setIsGenerating(true);
        setError(null);
        
        const response = await fetch(`/api/generate?repoId=${params.repoId}`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate documentation');
        }
        
        const data = await response.json();
        setResult(data);
        setStatus('Documentation generation started. This may take a few minutes...');
        
        // Poll for status updates (in a real app, you might use WebSockets)
        const statusCheckInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`/api/generate/status?documentationId=${data.documentationId}`);
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              
              if (statusData.status === 'COMPLETED') {
                setStatus('Documentation generated successfully!');
                setIsGenerating(false);
                clearInterval(statusCheckInterval);
                
                // Redirect to docs page after a short delay
                setTimeout(() => {
                  router.push(`/docs/${data.user}/${data.repo}`);
                }, 2000);
              } else if (statusData.status === 'FAILED') {
                setStatus('Documentation generation failed.');
                setIsGenerating(false);
                setError('There was an error generating the documentation. Please try again.');
                clearInterval(statusCheckInterval);
              } else {
                setStatus(`Status: ${statusData.status}`);
              }
            }
          } catch (err) {
            console.error('Error checking status:', err);
          }
        }, 5000); // Check every 5 seconds
        
        // Clean up interval on component unmount
        return () => clearInterval(statusCheckInterval);
        
      } catch (err: any) {
        console.error('Error generating documentation:', err);
        setError(err.message || 'An error occurred while generating documentation');
        setIsGenerating(false);
        setStatus('Failed');
      }
    }
    
    generateDocs();
  }, [params.repoId, router]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-2">
          <h1 className="text-2xl font-bold">Generate Documentation</h1>
          <Link 
            href="/dashboard"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Back to Dashboard
          </Link>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          {error ? (
            <div className="bg-red-900/50 border border-red-700 text-red-100 px-4 py-3 rounded mb-4">
              {error}
            </div>
          ) : null}
          
          <div className="text-center py-8">
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold mb-2">{status}</h2>
                <p className="text-gray-400 text-sm max-w-md mx-auto">
                  We're analyzing the repository and generating comprehensive documentation.
                  This process may take a few minutes depending on the size of the codebase.
                </p>
              </>
            ) : (
              <>
                <div className="text-green-400 text-5xl mb-4">✓</div>
                <h2 className="text-xl font-semibold mb-2">{status}</h2>
                {result && (
                  <div className="mt-4">
                    <p className="text-gray-400 mb-4">
                      Documentation for <span className="font-semibold">{result.repository?.fullName}</span> has been generated.
                    </p>
                    <Link
                      href={`/docs/${result.user}/${result.repo}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors inline-block"
                    >
                      View Documentation
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
