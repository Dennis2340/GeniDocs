"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface GitHubPluginInstallerProps {
  repositoryId: string;
  repositoryFullName: string;
}

export default function GitHubPluginInstaller({ repositoryId, repositoryFullName, repository }: GitHubPluginInstallerProps & { repository?: any }) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Check if the plugin is already installed when the component mounts
  useEffect(() => {
    const checkPluginStatus = async () => {
      try {
        // If repository data was passed as a prop
        if (repository) {
          // Check metadata field first (after migration)
          if (repository.metadata && repository.metadata.pluginInstalled) {
            setIsInstalled(true);
          } 
          // Fallback to checking description (before migration)
          else if (repository.description && repository.description.includes('[PLUGIN_STATUS:installed]')) {
            setIsInstalled(true);
          }
          setIsLoading(false);
          return;
        }
        
        // Otherwise fetch repository data
        const response = await fetch(`/api/repos/${repositoryId}`);
        if (response.ok) {
          const data = await response.json();
          // Check metadata field first (after migration)
          if (data.metadata && data.metadata.pluginInstalled) {
            setIsInstalled(true);
          } 
          // Fallback to checking description (before migration)
          else if (data.description && data.description.includes('[PLUGIN_STATUS:installed]')) {
            setIsInstalled(true);
          }
        }
      } catch (error) {
        console.error('Error checking plugin status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkPluginStatus();
  }, [repositoryId, repository]);
  
  // GitHub plugin installation URL (replace with your actual plugin URL)
  const pluginInstallUrl = `https://github.com/apps/genidocs-plugin/installations/new?state=${encodeURIComponent(repositoryId)}`;
  
  // Function to mark the plugin as installed (this would typically be called after verification)
  const markAsInstalled = async () => {
    try {
      // You might want to verify the installation with your backend
      const response = await fetch(`/api/repos/${repositoryId}/plugin-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ installed: true }),
      });
      
      if (response.ok) {
        setIsInstalled(true);
        router.refresh();
      }
    } catch (error) {
      console.error('Error updating plugin status:', error);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">GeniDocs GitHub Plugin</h3>
      
      <p className="mb-4">
        Install our GitHub plugin to automatically track code changes and keep your documentation up-to-date.
      </p>
      
      {isInstalled ? (
        <div className="bg-green-50 p-4 rounded-md text-green-700 mb-4">
          <p className="font-medium">Plugin installed successfully!</p>
          <p className="text-sm mt-2">
            Your documentation will now be automatically updated when code changes are detected.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col space-y-4">
            <a 
              href={pluginInstallUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700"
            >
              Install GitHub Plugin
            </a>
            
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              {showInstructions ? 'Hide installation instructions' : 'Show installation instructions'}
            </button>
          </div>
          
          {showInstructions && (
            <div className="bg-gray-50 p-4 rounded-md text-sm">
              <h4 className="font-medium mb-2">Installation Instructions:</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Click the "Install GitHub Plugin" button above</li>
                <li>You'll be redirected to GitHub to authorize the GeniDocs plugin</li>
                <li>Select the repository: <strong>{repositoryFullName}</strong></li>
                <li>Click "Install" to complete the process</li>
                <li>Return to this page and click "I've installed the plugin" below</li>
              </ol>
            </div>
          )}
          
          <button
            onClick={markAsInstalled}
            className="px-4 py-2 mt-4 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            I've installed the plugin
          </button>
        </div>
      )}
      
      {isInstalled && (
        <div className="mt-4">
          <button
            onClick={() => router.push(`/dashboard/generate-docs/${repositoryId}`)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Generate Documentation
          </button>
        </div>
      )}
    </div>
  );
}
