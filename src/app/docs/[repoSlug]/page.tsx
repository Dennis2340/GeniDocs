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

export default function DocusaurusViewerPage({ params }: { params: { user: string } }) {
  const router = useRouter();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<RepositoryInfo | null>(null);
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);

  useEffect(() => {
    async function fetchDocumentation() {
      try {
        setLoading(true);
        setError(null);

        // Check if there's a file parameter in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const fileParam = urlParams.get('file');

        // Normalize the repository slug
        const normalizedSlug = params.user.replace(/\+/g, '-').toLowerCase();

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
  }, [params.user, router]);

  const handleFileClick = (file: string) => {
    // Navigate to the selected file
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('file', file);
    router.push(`/docs/${params.user}?${urlParams.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white p-4 border-r">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">
            {repoInfo ? repoInfo.name : params.user}
          </h2>
          {repoInfo?.description && (
            <p className="text-sm text-gray-600 mb-4">{repoInfo.description}</p>
          )}
          <Link 
            href="/dashboard" 
            className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
          >
            ← Back to Dashboard
          </Link>
        </div>
        
        <h3 className="font-medium text-gray-700 mb-2">Documentation</h3>
        <ul className="space-y-1">
          {sidebarItems.map((item, index) => (
            <li key={index}>
              <button
                onClick={() => handleFileClick(item.file)}
                className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 text-sm"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <div className="prose max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                //@ts-ignore
                code({node, inline, className, children, ...props}) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                    //@ts-ignore
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
