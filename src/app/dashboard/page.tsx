import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/utils/db';
import { authOptions } from '@/utils/auth';
import Image from 'next/image';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect('/auth/signin');
  }

  // Try to find the user, if not found, create a new user record
  let user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      organization: {
        include: {
          repositories: true,
        },
      },
    },
  });
  
  // If user doesn't exist in the database but is authenticated, create the user
  if (!user) {
    console.log(`Creating new user record for ${session.user.email}`);
    try {
      // Create a default organization first
      const defaultOrg = await prisma.organization.create({
        data: {
          name: 'My Organization',
          slug: `org-${Date.now()}`,
        },
      });
      
      // Create the user with the default organization
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || 'User',
          image: session.user.image,
          githubId: session.user.id || undefined,
          organizationId: defaultOrg.id,
        },
        include: {
          organization: {
            include: {
              repositories: true,
            },
          },
        },
      });
      
      console.log(`Created new user and organization for ${session.user.email}`);
    } catch (error) {
      console.error('Error creating user record:', error);
    }
  }

  // Fetch documentation status for repositories
  let documentedRepos: any[] = [];
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/docs/list`, {
      cache: 'no-store',
    });
    if (response.ok) {
      const data = await response.json();
      documentedRepos = data.repositories || [];
    }
  } catch (error) {
    console.error('Error fetching documented repositories:', error);
  }

  // Create a map of repo fullName to documentation status
  const docsStatusMap = documentedRepos.reduce((acc, repo) => {
    acc[repo.fullName] = repo;
    return acc;
  }, {} as Record<string, any>);

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
      <div className="container mx-auto px-4 py-16 relative z-10"> {/* Increased top padding to move content down */}
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 font-space-grotesk">Dashboard</h1>
            <p className="text-gray-400">Manage your repositories and documentation</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Link 
              href="/dashboard/repo-select"
              className="glass-effect hover:bg-indigo-600/20 text-white px-5 py-2.5 rounded-xl transition-all duration-300 border border-white/10 hover:border-indigo-400/30 flex items-center gap-2 shadow-glow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Select Repositories
            </Link>
            {/* Removed user profile and signout buttons */}
          </div>
        </div>

        {user?.organization ? (
          <div className="space-y-8">
            {/* Organization Info */}
            <div className="glass-card bg-gradient-to-r from-blue-900/10 to-indigo-900/10 rounded-xl shadow-glow p-6 border border-white/10 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex items-start md:items-center gap-3 mb-4 md:mb-0">
                  <div className="w-12 h-12 rounded-xl bg-blue-900/30 flex items-center justify-center text-blue-300 shrink-0 border border-blue-500/30 shadow-glow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white font-space-grotesk">{user.organization.name}</h2>
                    <p className="text-sm text-blue-300">Organization</p>
                  </div>
                </div>
                <div className="flex space-x-6">
                  <div className="text-center">
                  <div className="text-sm text-blue-300">Repositories</div>
                  <div className="text-2xl font-bold text-white">{user.organization.repositories.length}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-blue-300">Documentation</div>
                    <div className="text-2xl font-bold text-white">{documentedRepos.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Repositories Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 font-space-grotesk">Your Repositories</h2>
                <Link 
                  href="/dashboard/repo-select"
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 font-medium transition-colors duration-300"
                >
                  <span>Manage repositories</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>

              {user.organization.repositories.length === 0 ? (
                <div className="glass-card rounded-xl shadow-glow p-8 text-center border border-white/10 backdrop-blur-sm">
                  <div className="mx-auto w-20 h-20 bg-blue-900/30 rounded-full flex items-center justify-center mb-4 border border-blue-500/30 shadow-glow">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 font-space-grotesk">No repositories found</h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    You haven't selected any repositories yet. Add repositories to start generating documentation.
                  </p>
                  <Link 
                    href="/dashboard/repo-select"
                    className="glass-effect hover:bg-indigo-600/20 text-white px-6 py-3 rounded-xl transition-all duration-300 inline-flex items-center gap-2 shadow-glow border border-white/10 hover:border-indigo-400/30"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Select Repositories
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                  {user.organization.repositories.map((repo: any) => {
                    const repoName = typeof repo.name === 'string' ? repo.name : 'Unnamed Repo';
                    const fullName = repo.fullName || `${user.organization!.name}/${repoName}`;
                    const hasDocumentation = docsStatusMap[fullName];
                    const repoSlug = fullName.replace('/', '-').toLowerCase();
                    
                    return (
                      <div
                        key={repo.id}
                        className="glass-card rounded-xl shadow-glow border border-white/10 overflow-hidden flex flex-col transform transition-all duration-300 hover:shadow-glow-lg hover:border-indigo-400/30 group backdrop-blur-sm"
                      >
                        <div className="p-6 flex-grow">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-bold text-white truncate pr-4 group-hover:text-blue-400 font-space-grotesk transition-colors duration-300">
                              {repoName}
                            </h3>
                            <div className="flex-shrink-0">
                              {repo.private ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                                  Private
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-300 border border-green-700/30">
                                  Public
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                            {repo.description || 'No description available'}
                          </p>
                          <div className="flex justify-between items-center">
                            <div className="flex space-x-3">
                              {repo.language && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <span className="w-3 h-3 rounded-full bg-blue-500 mr-1.5"></span>
                                  <span>{repo.language}</span>
                              </div>
                              )}
                              {typeof repo.stars === 'number' && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                  <span>{repo.stars}</span>
                              </div>
                            )}
                            </div>
                            <div>
                              {hasDocumentation ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-700/30">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Documented
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-300 border border-yellow-700/30">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  No Docs
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-white/5 p-4 bg-white/5 flex justify-between items-center">
                          {hasDocumentation ? (
                            <Link 
                              href={`/docs/${repoSlug}`}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              View Documentation
                            </Link>
                          ) : (
                            <Link 
                              href={`/dashboard/generate-docs/${repo.id}`}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Generate Docs
                            </Link>
                          )}
                          <a 
                            href={repo.url || `https://github.com/${fullName}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-300 text-sm flex items-center transition-colors duration-300"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            GitHub
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Documentation Section - only show if there are documented repos */}
            {documentedRepos.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 font-space-grotesk mb-6">Your Documentation</h2>
                <div className="glass-card rounded-xl shadow-glow border border-white/10 p-6 backdrop-blur-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documentedRepos.map((repo: any) => {
                      const repoSlug = repo.fullName.replace('/', '-').toLowerCase();
                      return (
                        <Link
                          key={repo.id || repo.fullName}
                          href={`/docs/${repoSlug}`}
                          className="p-4 border border-white/10 rounded-lg hover:border-blue-400/30 hover:shadow-glow-sm transition-all flex items-center group glass-effect"
                        >
                          <div className="mr-4 w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-300 flex-shrink-0 border border-blue-500/30 shadow-glow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors duration-300 font-space-grotesk">{repo.name || repo.fullName}</h3>
                            <p className="text-sm text-gray-400">
                              {new Date(repo.updatedAt || Date.now()).toLocaleDateString()}
                            </p>
                  </div>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-auto text-gray-400 group-hover:text-blue-400 transition-colors duration-300" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </Link>
                      );
                    })}
                    </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-200">
            <div className="mx-auto w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 font-space-grotesk">Organization not found</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Please select a repo to get started
            </p>
            <Link 
              href="/api/auth/signout"
              className="glass-effect hover:bg-indigo-600/20 text-white px-6 py-3 rounded-xl transition-all duration-300 inline-flex items-center gap-2 shadow-glow border border-white/10 hover:border-indigo-400/30"
            >
              Sign Out
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}