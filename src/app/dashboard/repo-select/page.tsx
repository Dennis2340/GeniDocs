"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RepoSelect() {
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchRepos() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/repos');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch repositories');
        }
        
        const data = await response.json();
        setRepos(data);
      } catch (err: any) {
        console.error('Error fetching repositories:', err);
        setError(err.message || 'An error occurred while fetching repositories');
      } finally {
        setLoading(false);
      }
    }
    fetchRepos();
  }, []);

  const handleSubmit = async () => {
    if (selectedRepos.length === 0) {
      setError('Please select at least one repository');
      return;
    }
    
    try {
      setSaving(true);
      const response = await fetch('/api/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoIds: selectedRepos }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save selection');
      }
      
      const result = await response.json();
      console.log('Selection saved:', result);
      
      // Redirect to dashboard or confirmation page
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error saving selection:', err);
      setError(err.message || 'An error occurred while saving your selection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-2">
          <h1 className="text-2xl font-bold">Select Repositories</h1>
          <Link 
            href="/dashboard"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Back to Dashboard
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-100 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
          </div>
        ) : repos.length > 0 ? (
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-4">
              Select the repositories you want to generate documentation for:
            </p>
            
            <div className="grid gap-2 mb-6">
              {repos.map((repo) => (
                <div 
                  key={repo.id}
                  className="flex items-center p-3 bg-gray-700/50 rounded hover:bg-gray-700 transition-colors"
                >
                  <input
                    type="checkbox"
                    id={repo.id}
                    checked={selectedRepos.includes(repo.id)}
                    onChange={(e) =>
                      setSelectedRepos(
                        e.target.checked
                          ? [...selectedRepos, repo.id]
                          : selectedRepos.filter((id) => id !== repo.id)
                      )
                    }
                    className="mr-3 h-4 w-4"
                  />
                  <div className="flex-1">
                    <label htmlFor={repo.id} className="font-medium cursor-pointer">
                      {repo.fullName || repo.name}
                    </label>
                    {repo.description && (
                      <p className="text-xs text-gray-400 mt-1">{repo.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end">
              <button 
                onClick={handleSubmit}
                disabled={saving || selectedRepos.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></span>
                    Saving...
                  </>
                ) : (
                  'Save Selection'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">No Repositories Found</h2>
            <p className="text-sm text-gray-400 mb-4">
              We couldn't find any repositories associated with your GitHub account.
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