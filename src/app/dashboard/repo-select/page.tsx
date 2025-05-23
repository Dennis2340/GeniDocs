"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

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
      <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
        {/* Dynamic background elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-indigo-600/20 to-blue-600/20 blur-[100px] animate-[float_15s_ease-in-out_infinite]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-[100px] animate-[float_20s_ease-in-out_infinite_reverse]"></div>
          
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] z-0"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-blue-900/30 border border-blue-500/30 shadow-glow"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 font-space-grotesk">Loading Repositories</h2>
          <p className="text-gray-400 max-w-md mx-auto">Fetching your GitHub repositories. This may take a moment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Dynamic background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-indigo-600/20 to-blue-600/20 blur-[100px] animate-[float_15s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-[100px] animate-[float_20s_ease-in-out_infinite_reverse]"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] z-0"></div>
        
        {/* Animated orbs */}
        <div className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full bg-blue-500 opacity-70 animate-ping-slow"></div>
        <div className="absolute top-2/3 left-1/3 w-3 h-3 rounded-full bg-indigo-500 opacity-60 animate-ping-slow animation-delay-1000"></div>
        <div className="absolute bottom-1/4 right-1/2 w-2 h-2 rounded-full bg-purple-500 opacity-70 animate-ping-slow animation-delay-2000"></div>
      </div>
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-white/10">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 font-space-grotesk">Select Repositories</h1>
            <p className="text-gray-400">Choose repositories to generate documentation for</p>
          </div>
          <Link 
            href="/dashboard"
            className="mt-4 md:mt-0 glass-effect text-white hover:bg-indigo-600/20 px-4 py-2 rounded-xl border border-white/10 hover:border-indigo-400/30 shadow-glow-sm transition-all duration-300 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 shadow-glow-sm">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-300">Error</h3>
                <div className="mt-1 text-sm text-red-400">{error}</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          {repos.length === 0 ? (
            <div className="glass-card rounded-xl shadow-glow p-8 text-center border border-white/10 backdrop-blur-sm">
              <div className="mx-auto w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center mb-4 border border-blue-500/30 shadow-glow">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2 font-space-grotesk">No repositories found</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                We couldn't find any repositories associated with your GitHub account.
              </p>
              <button onClick={() => router.refresh()} className="glass-effect hover:bg-indigo-600/20 text-white px-4 py-2 rounded-xl transition-all duration-300 inline-flex items-center gap-2 shadow-glow border border-white/10 hover:border-indigo-400/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Refresh Repositories
              </button>
            </div>
          ) : (
            <>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 flex items-start shadow-glow-sm">
                <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-300 font-space-grotesk">Select repositories to generate documentation</h3>
                  <p className="mt-1 text-sm text-blue-400">
                    Choose the repositories you want to generate documentation for. 
                    You can select multiple repositories.
                  </p>
                </div>
              </div>
              
              {/* Search and filter */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-xl bg-white/5 shadow-glow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-white placeholder-gray-500 backdrop-blur-sm"
                  placeholder="Search repositories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="grid gap-4">
                {filteredRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className={`glass-card rounded-xl shadow-glow border p-4 transition-all duration-300 cursor-pointer backdrop-blur-sm ${
                      selectedRepos.includes(repo.id) 
                        ? 'border-indigo-500/50 ring-1 ring-indigo-500/30 bg-indigo-900/10' 
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    onClick={() => handleRepoSelect(repo.id)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedRepos.includes(repo.id)}
                          onChange={() => {}} // Handled by div click
                          className="h-5 w-5 text-indigo-500 rounded border-gray-700 bg-black/50 focus:ring-indigo-500/50"
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-medium text-white font-space-grotesk">
                              {repo.name}
                            </h3>
                            {repo.private && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                                Private
                              </span>
                            )}
                          </div>
                          <a
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-gray-300 transition-colors duration-300"
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
                        <p className="mt-1 text-sm text-gray-400 line-clamp-2">
                          {repo.description || 'No description available'}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-400">
                          {repo.language && (
                            <span className="flex items-center">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 mr-1.5 shadow-glow-xs"></span>
                              {repo.language}
                            </span>
                          )}
                          <span className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-1 text-amber-300"
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

          <div className="sticky bottom-4 glass-card rounded-xl shadow-glow border border-white/10 p-4 z-10 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center">
                <span className="font-medium text-white font-space-grotesk">
                  {selectedRepos.length} {selectedRepos.length === 1 ? 'repository' : 'repositories'} selected
                </span>
                {selectedRepos.length > 0 && (
                  <span className="ml-2 text-sm text-gray-400">
                    (Click to toggle selection)
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="glass-effect text-white hover:bg-white/5 border border-white/10 px-4 py-2 rounded-xl transition-all duration-300 hover:border-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={selectedRepos.length === 0 || isSaving}
                  className={`glass-effect hover:bg-indigo-600/20 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 border border-white/10 hover:border-indigo-400/30 shadow-glow-sm ${
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
