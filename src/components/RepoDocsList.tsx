'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Repository {
  owner: string;
  repo: string;
}

/**
 * Component that displays a list of repositories with available documentation
 */
export default function RepoDocsList() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch the list of repositories with documentation
  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/docs/list');
        
        if (!response.ok) {
          throw new Error('Failed to fetch repositories');
        }
        
        const data = await response.json();
        setRepositories(data.repositories || []);
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching repositories');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRepositories();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded relative" role="alert">
        <p>No documentation available yet. Generate documentation for a repository to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {repositories.map((repo) => (
        <div 
          key={`${repo.owner}/${repo.repo}`}
          className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h3 className="text-lg font-medium">{repo.repo}</h3>
            <p className="text-sm text-gray-500">{repo.owner}</p>
          </div>
          <div className="p-4">
            <p className="text-sm mb-4">
              Browse the generated documentation for this repository.
            </p>
            <div className="flex justify-between items-center">
              <Link 
                href={`/docs/${repo.owner}/${repo.repo}`}
                className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium"
              >
                View Documentation
              </Link>
              <a 
                href={`https://github.com/${repo.owner}/${repo.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-800"
              >
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 