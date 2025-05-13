'use client';

import React, { useState, useEffect } from 'react';
import RepoDocsList from '@/components/RepoDocsList';
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);
  const [result, setResult] = useState<null | {
    success: boolean;
    message?: string;
    error?: string;
    docsUrl?: string;
    documentationId?: string;
  }>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const owner = formData.get('owner')?.toString().trim();
    const repo = formData.get('repo')?.toString().trim();
    
    // Validate required fields
    if (!owner || !repo) {
      setResult({
        success: false,
        error: 'Repository owner and name are required'
      });
      return;
    }
    
    setIsSubmitting(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult({
          success: true,
          message: `Documentation generation started for ${owner}/${repo}!`,
          docsUrl: data.docsUrl,
          documentationId: data.documentationId
        });
        
        // Start polling for status updates if documentationId is available
        if (data.documentationId) {
          startStatusPolling(data.documentationId);
        }
      } else {
        setResult({
          success: false,
          error: data.error || 'Failed to generate documentation'
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to poll for status updates
  const startStatusPolling = (documentationId: string) => {
    if (!documentationId) return;
    
    setPollingStatus('Initializing documentation process...');
    
    const statusInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/generate/status?documentationId=${documentationId}`);
        
        if (!response.ok) {
          // If we get a non-200 response, update status but continue polling
          const errorData = await response.json();
          setPollingStatus(`Status check error: ${errorData.error || 'Unknown error'}`);
          return;
        }
        
        const data = await response.json();
        
        // Update UI based on status
        if (data.status === 'COMPLETED') {
          setPollingStatus('Documentation generation complete!');
          setResult(prev => ({
            ...prev!,
            message: `Documentation generated successfully! View it now.`,
            docsUrl: data.url
          }));
          clearInterval(statusInterval);
        } else if (data.status === 'FAILED') {
          setPollingStatus('Documentation generation failed.');
          setResult(prev => ({
            ...prev!,
            success: false,
            error: 'Documentation generation failed. Please try again.'
          }));
          clearInterval(statusInterval);
        } else if (data.status === 'GENERATING') {
          setPollingStatus('Generating documentation... This may take a few minutes.');
        } else if (data.status === 'PENDING') {
          setPollingStatus('Waiting for documentation generation to start...');
        }
        
      } catch (error) {
        console.error('Error polling for status:', error);
        setPollingStatus('Error checking status. Will retry...');
        // Continue polling even if there's an error
      }
    }, 5000); // Poll every 5 seconds
    
    // Clean up interval when component unmounts
    return () => {
      clearInterval(statusInterval);
      setPollingStatus(null);
    };
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">Documentation Hub</h1>
          <p className="text-xl text-gray-600">
            AI-generated documentation for your repositories
          </p>
          {session?.user && (
            <p className="mt-2 text-blue-600">
              Welcome, {session.user.name || 'GitHub User'}!
            </p>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Available Repositories</h2>
          <RepoDocsList />
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Generate Documentation</h2>
          <p className="mb-4">
            To generate documentation for a new repository, use the form below:
          </p>
          
          {pollingStatus && (
            <div className="p-4 mb-4 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              <p className="font-medium">Status: {pollingStatus}</p>
            </div>
          )}
          
          {result && (
            <div className={`p-4 mb-4 rounded-md ${result.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {result.success ? (
                <>
                  <p className="font-medium">{result.message}</p>
                  {result.docsUrl && (
                    <p className="mt-2">
                      <a 
                        href={result.docsUrl} 
                        className="text-blue-600 hover:text-blue-800 underline"
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        View Documentation
                      </a>
                    </p>
                  )}
                </>
              ) : (
                <p className="font-medium">Error: {result.error}</p>
              )}
            </div>
          )}
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="owner" className="block text-sm font-medium text-gray-700">
                Repository Owner
              </label>
              <input
                type="text"
                id="owner"
                name="owner"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Dennis2340"
                required
                defaultValue={(session?.user?.name || '').split(' ')[0] || ''}
              />
            </div>
            
            <div>
              <label htmlFor="repo" className="block text-sm font-medium text-gray-700">
                Repository Name
              </label>
              <input
                type="text"
                id="repo"
                name="repo"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., ask-repo"
                required
              />
            </div>
            
            {!session?.user && (
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700">
                  GitHub Token (optional)
                </label>
                <input
                  type="password"
                  id="token"
                  name="token"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="For private repositories"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Only required for private repositories. 
                  <a href="/api/auth/signin" className="text-blue-600 hover:text-blue-800">
                    Sign in with GitHub
                  </a> to avoid entering a token.
                </p>
              </div>
            )}
            
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Generating...' : 'Generate Documentation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
