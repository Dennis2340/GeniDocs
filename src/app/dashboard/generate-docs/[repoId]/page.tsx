"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function GenerateDocs() {
  const params = useParams();
  const repoId = params?.repoId as string;
  const [status, setStatus] = useState('Initializing...');
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [repoDetails, setRepoDetails] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('initializing');
  // Tree-sitter is now the default and only implementation
  // Define the type for generation steps
  interface GenerationStep {
    id: string;
    label: string;
    completed: boolean;
    current: boolean;
    error?: boolean;
  }
  
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([
    { id: 'initializing', label: 'Initializing', completed: false, current: true },
    { id: 'analyzing', label: 'Analyzing Repository', completed: false, current: false },
    { id: 'generating', label: 'Generating Documentation', completed: false, current: false },
    { id: 'finalizing', label: 'Finalizing', completed: false, current: false },
    { id: 'completed', label: 'Completed', completed: false, current: false }
  ]);
  const router = useRouter();

  // Fetch repository details
  useEffect(() => {
    if (!repoId) return;

    async function fetchRepoDetails() {
      try {
        const response = await fetch(`/api/repos/${repoId}`);
        if (response.ok) {
          const data = await response.json();
          setRepoDetails(data);
        }
      } catch (err) {
        console.error('Error fetching repository details:', err);
      }
    }

    fetchRepoDetails();
  }, [repoId]);

  useEffect(() => {
    // Ensure repoId is available before proceeding
    if (!repoId) return;
    
    async function generateDocs() {
      try {
        setIsGenerating(true);
        setError(null);
        setLogs([]);
        setProgress(0);
        setCurrentStep('initializing');
        
        // Update UI to show initialization
        setGenerationSteps(prev => prev.map(step => ({
          ...step,
          completed: false,
          current: step.id === 'initializing',
          error: false
        })));
        
        // Using Tree-sitter code structure endpoint
        console.log('Using Tree-sitter code structure endpoint');
        const endpoint = '/api/generate/code-structure';
        
        let response;
        try {
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ repoId }),
          });

          
          if (!response.ok) {
            // Try to get error details from response
            let errorMessage = 'Failed to generate documentation';
            
            // Clone the response before reading it
            const responseClone = response.clone();
            
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } catch (parseError) {
              // If we can't parse JSON, try to get text from the cloned response
              try {
                const errorText = await responseClone.text();
                console.error('Error response (not JSON):', errorText);
                errorMessage = `Server error (${response.status}): ${errorText.substring(0, 100)}...`;
              } catch (textError) {
                console.error('Failed to read response as text:', textError);
                errorMessage = `Server error (${response.status}): Could not parse error response`;
              }
            }
            throw new Error(errorMessage);
          }
        } catch (fetchError: any) {
          console.error('Fetch error:', fetchError);
          throw new Error(`Network error: ${fetchError.message || 'Unknown error'}`);
        }
        
        if (!response) {
          throw new Error('Failed to get response from server');
        }
        
        const data = await response.json();
        setResult(data);
        setStatus('Documentation generation started. This may take a few minutes...');
        
        // Poll for status updates and logs
        const statusCheckInterval = setInterval(async () => {
          try {
            if (!data.documentationId) {
              console.error('Missing documentationId');
              clearInterval(statusCheckInterval);
              setError('Missing documentation ID. Please try again.');
              setIsGenerating(false);
              return;
            }
            
            // Check status
            const statusResponse = await fetch(`/api/generate/status?documentationId=${data.documentationId}`);
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              
              // Update logs if available
              if (statusData.logs && Array.isArray(statusData.logs)) {
                setLogs(statusData.logs);
                
                // Auto-scroll to bottom of logs
                const logsContainer = document.getElementById('logs-container');
                if (logsContainer) {
                  logsContainer.scrollTop = logsContainer.scrollHeight;
                }
              }
              
              // Update progress and estimated time
              if (typeof statusData.progress === 'number') {
                setProgress(statusData.progress);
              }
              
              // Update estimated time remaining if available
              if (statusData.estimatedTimeRemaining) {
                setStatus(`Generating documentation... Estimated time remaining: ${statusData.estimatedTimeRemaining}`);
              }
              
              if (statusData.status === 'COMPLETED') {
                setStatus('Documentation generated successfully!');
                setIsGenerating(false);
                clearInterval(statusCheckInterval);
                setProgress(100);
                
                // Update steps
                setGenerationSteps(prev => prev.map(step => ({
                  ...step,
                  completed: true,
                  current: step.id === 'completed'
                })));
                setCurrentStep('completed');
                
                // Run standardization scripts
                try {
                  await fetch('/api/docs/standardize', { method: 'POST' });
                } catch (err) {
                  console.error('Error running standardization scripts:', err);
                }
                
                // Redirect to docs page after a short delay
                setTimeout(() => {
                  // Use the repository slug from the status data
                  const repoSlug = statusData.repository ? statusData.repository.replace('/', '-').toLowerCase() : '';
                  if (repoSlug) {
                    // Redirect to the Docusaurus server instead of the Next.js route
                    window.location.href = `http://localhost:3001/docs/${repoSlug}`;
                  } else {
                    // Fallback to dashboard if no slug is available
                    router.push('/dashboard');
                    console.error('No repository slug available for redirect');
                  }
                }, 2000);
              } else if (statusData.status === 'FAILED') {
                setStatus('Documentation generation failed.');
                setIsGenerating(false);
                setError('There was an error generating the documentation. Please try again.');
                clearInterval(statusCheckInterval);
                
                // Update steps to show failure
                setGenerationSteps(prev => prev.map(step => ({
                  ...step,
                  completed: step.current ? false : step.completed,
                  error: step.current ? true : false,
                  current: step.current
                })));
              } else {
                // Update progress based on status
                let newProgress = 0;
                let newStep = 'initializing';
                
                if (statusData.status === 'ANALYZING') {
                  newProgress = 25;
                  newStep = 'analyzing';
                } else if (statusData.status === 'GENERATING') {
                  newProgress = 50;
                  newStep = 'generating';
                } else if (statusData.status === 'FINALIZING') {
                  newProgress = 75;
                  newStep = 'finalizing';
                }
                
                setProgress(newProgress);
                setStatus(`Status: ${statusData.status}`);
                
                // Update current step
                if (newStep !== currentStep) {
                  setCurrentStep(newStep);
                  setGenerationSteps(prev => prev.map(step => ({
                    ...step,
                    completed: step.id === currentStep ? true : step.completed,
                    current: step.id === newStep
                  })));
                }
              }
            } else {
              console.error('Error response from status endpoint:', await statusResponse.text());
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
  }, [repoId, router]);

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
            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 font-space-grotesk">Generate Documentation</h1>
            <p className="text-gray-400">
              {repoDetails ? (
                <>Generating documentation for <span className="font-medium text-white">{repoDetails.name}</span></>
              ) : (
                'Processing repository...'  
              )}
            </p>
            
            <div className="mt-4 flex items-center">
              <div className="text-sm text-gray-400 flex items-center">
                <svg className="h-5 w-5 text-blue-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Using Tree-sitter for enhanced code structure analysis</span>
              </div>
            </div>
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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-xl shadow-glow p-8 border border-white/10 backdrop-blur-sm">
              {error ? (
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
              ) : null}
              
              <div className="text-center py-8">
                {isGenerating ? (
                  <>
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-blue-900/30 mx-auto flex items-center justify-center border border-blue-500/30 shadow-glow">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent"></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <h2 className="text-2xl font-semibold text-white mt-6 mb-2 font-space-grotesk">{status}</h2>
                    <p className="text-gray-400 text-base max-w-lg mx-auto">
                      We're analyzing the repository and generating comprehensive documentation.
                      This process may take a few minutes depending on the size of the codebase.
                    </p>
                    
                    {/* Helpful tips during generation */}
                    <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 max-w-lg mx-auto text-left shadow-glow-sm">
                      <h3 className="text-sm font-medium text-blue-300 mb-2 font-space-grotesk">While you wait</h3>
                      <ul className="text-sm text-blue-400 space-y-2">
                        <li className="flex items-start">
                          <svg className="h-5 w-5 text-blue-400 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Tree-sitter is extracting code structure and grouping files by features</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="h-5 w-5 text-blue-500 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Well-commented code will result in more detailed documentation</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="h-5 w-5 text-blue-500 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>You'll be redirected to your documentation when complete</span>
                        </li>
                      </ul>
                      <p className="text-sm mt-1">Logs will appear here as the documentation is generated</p>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          
          {/* Repository Info */}
          <div>
            {repoDetails && (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 mt-6 p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Repository Details</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">Name</div>
                    <div className="font-medium">{repoDetails.name}</div>
                  </div>
                  {repoDetails.description && (
                    <div>
                      <div className="text-sm text-gray-500">Description</div>
                      <div>{repoDetails.description}</div>
                    </div>
                  )}
                  {repoDetails.language && (
                    <div>
                      <div className="text-sm text-gray-500">Primary Language</div>
                      <div className="flex items-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5"></span>
                        {repoDetails.language}
                      </div>
                    </div>
                  )}
                  <div>
                    <a 
                      href={repoDetails.githubUrl || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 mt-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                      View on GitHub
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}