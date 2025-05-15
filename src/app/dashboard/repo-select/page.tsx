"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  private: boolean;
  updatedAt: string;
  language: string | null;
  stars: number;
  forks: number;
}

export default function RepoSelect() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/repos');
        if (!response.ok) {
          throw new Error('Failed to fetch repositories');
        }
        const data = await response.json();
        setRepos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch repositories');
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.accessToken) {
      fetchRepos();
    }
  }, [session]);

  const handleRepoSelect = (repoId: string) => {
    setSelectedRepos((prev) =>
      prev.includes(repoId)
        ? prev.filter((id) => id !== repoId)
        : [...prev, repoId]
    );
  };

  const handleSave = async () => {
    if (selectedRepos.length === 0) {
      setError('Please select at least one repository');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoIds: selectedRepos }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save repositories');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save repositories');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRepos = searchTerm 
    ? repos.filter(repo => 
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : repos;

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-gray-700">Loading repositories...</h2>
          <p className="text-gray-500 mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Repositories</h1>
            <p className="text-gray-600">Choose repositories to generate documentation for</p>
          </div>
          <Link 
            href="/dashboard"
            className="mt-4 md:mt-0 bg-white text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-lg border border-gray-300 shadow-sm transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-1 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          {repos.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-200">
              <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No repositories found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                We couldn't find any repositories associated with your GitHub account.
              </p>
              <button onClick={() => router.refresh()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Refresh Repositories
              </button>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
                <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Select repositories to generate documentation</h3>
                  <p className="mt-1 text-sm text-blue-700">
                    Choose the repositories you want to generate documentation for. 
                    You can select multiple repositories.
                  </p>
                </div>
              </div>
              
              {/* Search and filter */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search repositories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="grid gap-4">
                {filteredRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className={`bg-white rounded-xl shadow-sm border p-4 transition-all duration-200 cursor-pointer ${
                      selectedRepos.includes(repo.id) 
                        ? 'border-blue-300 ring-1 ring-blue-300' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleRepoSelect(repo.id)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedRepos.includes(repo.id)}
                          onChange={() => {}} // Handled by div click
                          className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {repo.name}
                            </h3>
                            {repo.private && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Private
                              </span>
                            )}
                          </div>
                          <a
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-500"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {repo.description || 'No description available'}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          {repo.language && (
                            <span className="flex items-center">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5"></span>
                              {repo.language}
                            </span>
                          )}
                          <span className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-1 text-amber-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {repo.stars}
                          </span>
                          <span className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {repo.forks} forks
                          </span>
                          <span className="text-gray-400">
                            Updated {new Date(repo.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="sticky bottom-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center">
                <span className="font-medium text-gray-900">
                  {selectedRepos.length} {selectedRepos.length === 1 ? 'repository' : 'repositories'} selected
                </span>
                {selectedRepos.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    (Click to toggle selection)
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={selectedRepos.length === 0 || isSaving}
                  className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    (selectedRepos.length === 0 || isSaving) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Save Selection</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
