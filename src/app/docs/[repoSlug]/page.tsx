"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';

interface SidebarItem {
  file: string;
  label: string;
}

interface DocConfig {
  exists: boolean;
  files: string[];
  apiPath: string;
  fallbackPath: string;
}

interface RepositoryInfo {
  name: string;
  fullName: string;
  description?: string;
}

export default function DocPage({ params }: { params: { repoSlug: string } }) {
  const router = useRouter();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<RepositoryInfo | null>(null);
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  const [activePath, setActivePath] = useState<string>('');
  const [navOpen, setNavOpen] = useState<boolean>(false);
  
  useEffect(() => {
    async function fetchDocumentation() {
      try {
        setLoading(true);
        setError(null);

        // Check if there's a file parameter in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const fileParam = urlParams.get('file');

        // Normalize the repository slug
        const normalizedSlug = params.repoSlug.replace(/\+/g, '-').toLowerCase();

        // Extract owner and repo from the slug
        let owner = '';
        let repo = '';

        if (normalizedSlug.includes('-')) {
          const parts = normalizedSlug.split('-');
          if (parts.length >= 2) {
            owner = parts[0];
            repo = parts.slice(1).join('-');
          }
        }

        // First, fetch the documentation configuration
        const configResponse = await fetch(`/api/docs/config?slug=${normalizedSlug}`);
        if (!configResponse.ok) {
          throw new Error('Failed to load documentation configuration');
        }

        const config: DocConfig = await configResponse.json();

        if (!config.exists) {
          setError(`No documentation found for ${normalizedSlug}`);
          setLoading(false);
          return;
        }

        // Fetch repository information if available
        try {
          // We'll try to find the repository in our database by slug
          const response = await fetch(`/api/docs/repository?slug=${normalizedSlug}`);
          if (response.ok) {
            const data = await response.json();
            setRepoInfo(data);
          }
        } catch (err) {
          console.error('Error fetching repository info:', err);
          // Not critical, so we'll continue
        }

        // Determine which file to fetch (either from URL parameter or default to index.md)
        const fileToFetch = fileParam || 'index.md';
        setActivePath(fileToFetch);

        // Check if the file exists in the available files list
        const fileExists = config.files.some((file: string) => 
          file === fileToFetch || 
          file === `${fileToFetch}.md` || 
          file.toLowerCase() === fileToFetch.toLowerCase() || 
          file.toLowerCase() === `${fileToFetch}.md`.toLowerCase()
        );

        // Try to fetch the requested file
        try {
          if (fileExists) {
            let contentFound = false;
            
            // Try with different file name variations
            const variations = [
              fileToFetch,
              fileToFetch.endsWith('.md') ? fileToFetch : `${fileToFetch}.md`,
              fileToFetch.toLowerCase(),
              fileToFetch.toLowerCase().endsWith('.md') ? fileToFetch.toLowerCase() : `${fileToFetch.toLowerCase()}.md`
            ];
            
            // First try the content API
            for (const variation of variations) {
              if (contentFound) break;
              
              try {
                const contentResponse = await fetch(`/api/docs/content?slug=${normalizedSlug}&file=${variation}`);
                if (contentResponse.ok) {
                  const data = await contentResponse.json();
                  setContent(data.content);
                  contentFound = true;
                  break;
                }
              } catch (err) {
                console.error(`Error fetching content for ${variation}:`, err);
                // Continue to next variation
              }
            }
            
            // If content API failed, try fallback API
            if (!contentFound) {
              for (const variation of variations) {
                if (contentFound) break;
                
                try {
                  const fallbackResponse = await fetch(`/api/docs/fallback?slug=${normalizedSlug}&file=${variation}`);
                  if (fallbackResponse.ok) {
                    const data = await fallbackResponse.json();
                    setContent(data.content);
                    contentFound = true;
                    break;
                  }
                } catch (err) {
                  console.error(`Error fetching fallback for ${variation}:`, err);
                  // Continue to next variation
                }
              }
            }
            
            if (!contentFound) {
              // If all attempts fail but we know the file should exist, show an error
              setError(`Failed to load documentation file: ${fileToFetch}`);
            }
          } else if (fileParam) {
            // If a specific file was requested but doesn't exist
            setError(`Documentation file not found: ${fileParam}`);
          } else {
            // If we're trying to load the index but it doesn't exist, show default content
            setContent(`# ${normalizedSlug} Documentation\n\nWelcome to the documentation for ${normalizedSlug.replace(/-/g, '/')}.

This documentation was generated using GeniDocs, an AI-powered documentation generator.`);
          }
        } catch (err: any) {
          console.error('Error fetching documentation content:', err);
          setError(`Error loading documentation: ${err?.message || 'Unknown error'}`);
          setContent(`# ${normalizedSlug} Documentation\n\nWelcome to the documentation for ${normalizedSlug.replace(/-/g, '/')}.

This documentation was generated using GeniDocs, an AI-powered documentation generator.`);
        }
        
        // Use the configuration to build a sidebar if the API fails
        try {
          // First try with the sidebar API
          const sidebarResponse = await fetch(`/api/docs/sidebar?slug=${normalizedSlug}`);
          if (sidebarResponse.ok) {
            const data = await sidebarResponse.json();
            setSidebarItems(data.items || []);
          } else {
            // If the sidebar API fails, build a sidebar from the file list in the config
            const sidebarItems = config.files.map((file: string) => {
              // Remove .md extension if present
              const displayName = file.endsWith('.md') ? file.slice(0, -3) : file;
              // Convert path separators to spaces and capitalize words
              const label = displayName
                .replace(/[\/-]/g, ' ')
                .replace(/\b\w/g, (c: string) => c.toUpperCase());
              
              return {
                file,
                label
              };
            });
            
            // Sort items alphabetically
            sidebarItems.sort((a: {label: string}, b: {label: string}) => a.label.localeCompare(b.label));
            
            // Put index.md at the top if it exists
            const indexIndex = sidebarItems.findIndex((item: {file: string}) => 
              item.file === 'index.md' || item.file === 'index'
            );
            
            if (indexIndex !== -1) {
              const indexItem = sidebarItems.splice(indexIndex, 1)[0];
              indexItem.label = 'Overview';
              sidebarItems.unshift(indexItem);
            }
            
            setSidebarItems(sidebarItems);
          }
        } catch (err) {
          console.error('Error fetching sidebar:', err);
          // Not critical, so we'll continue with an empty sidebar
          setSidebarItems([]);
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error:', err);
        setError(`Error: ${err?.message || 'Unknown error'}`);
        setLoading(false);
      }
    }

    fetchDocumentation();
  }, [params.repoSlug, router]);

  const handleFileClick = (file: string) => {
    // Navigate to the selected file
    setActivePath(file);
    setNavOpen(false);
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('file', file);
    router.push(`/docs/${params.repoSlug}?${urlParams.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Mobile Header with menu toggle */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-20">
        <div className="flex justify-between items-center">
          <Link 
            href="/dashboard" 
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </Link>
          <h1 className="text-lg font-bold truncate max-w-[50%]">
            {repoInfo ? repoInfo.name : params.repoSlug.replace(/-/g, '/')}
          </h1>
          <button
            onClick={() => setNavOpen(!navOpen)}
            className="p-1.5 rounded-md hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 relative">
        {/* Mobile nav overlay */}
        {navOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setNavOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside 
          className={`
            w-72 bg-gray-50 border-r border-gray-200 p-4 md:p-6 flex-shrink-0 
            md:sticky md:top-0 md:h-screen md:block
            fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
            ${navOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <div className="flex flex-col h-full">
            <div className="mb-6 hidden md:block">
              <h2 className="text-xl font-bold mb-2 truncate">
                {repoInfo ? repoInfo.name : params.repoSlug.replace(/-/g, '/')}
              </h2>
              {repoInfo?.description && (
                <p className="text-sm text-gray-600 mb-4">{repoInfo.description}</p>
              )}
              <Link 
                href="/dashboard" 
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Dashboard
              </Link>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search documentation..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pl-9"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            <nav className="flex-1 overflow-y-auto pb-4">
              <div className="space-y-1">
                {sidebarItems.length > 0 ? (
                  sidebarItems.map((item, index) => (
                    <button 
                      key={index}
                      onClick={() => handleFileClick(item.file)}
                      className={`
                        block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                        ${activePath === item.file ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-200 text-gray-700'}
                      `}
                    >
                      {item.label}
                    </button>
                  ))
                ) : (
                  <div className="text-gray-500 text-center p-4">
                    No sidebar items available
                  </div>
                )}
              </div>
            </nav>
            
            <div className="pt-4 mt-auto border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-2">
                Generated with GeniDocs
              </div>
              <div className="flex items-center justify-between">
                <a 
                  href={`https://github.com/${repoInfo?.fullName || params.repoSlug.replace('-', '/')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 text-sm flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-1.5" viewBox="0 0 16 16">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                  </svg>
                  View on GitHub
                </a>
                
                <button
                  onClick={() => window.print()}
                  className="text-gray-600 hover:text-gray-900 text-sm flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                  </svg>
                  Print
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
          {loading ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <div className="text-gray-600">Loading documentation...</div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-start">
              <svg className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-red-800">Error</h3>
                <p className="mt-1">{error}</p>
                <div className="mt-4">
                  <Link 
                    href="/dashboard"
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Return to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="prose prose-blue max-w-full">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({node, inline, className, children, ...props}) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-lg overflow-hidden"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
