import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/utils/db';
import { authOptions } from '../api/auth/[...nextauth]/route';

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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Manage your repositories and documentation</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Link 
              href="/dashboard/repo-select"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Select Repositories
            </Link>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {session.user?.name?.charAt(0) || 'U'}
              </div>
              <span className="text-gray-700">{session.user?.name}</span>
            </div>
            <a
              href="/api/auth/signout"
              className="text-gray-600 hover:text-red-600 transition-colors"
              title="Sign Out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </a>
          </div>
        </div>

        {user?.organization ? (
          <div className="space-y-8">
            {/* Organization Info */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{user.organization.name}</h2>
                    <p className="text-sm text-gray-500">Organization</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Repositories</div>
                  <div className="text-2xl font-bold text-gray-900">{user.organization.repositories.length}</div>
                </div>
              </div>
            </div>

            {/* Repositories Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Your Repositories</h2>
                <Link 
                  href="/dashboard/repo-select"
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  <span>Manage repositories</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>

              {user.organization.repositories.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-200">
                  <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No repositories found</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    You haven't selected any repositories yet. Add repositories to start generating documentation.
                  </p>
                  <Link 
                    href="/dashboard/repo-select"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Select Repositories
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {user.organization.repositories.map((repo: any) => {
                    const repoName = typeof repo.name === 'string' ? repo.name : 'Unnamed Repo';
                    const fullName = repo.fullName || `${user.organization!.name}/${repoName}`;
                    const hasDocumentation = docsStatusMap[fullName];
                    
                    return (
                      <div
                        key={repo.id}
                        className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col h-full transition-all duration-200 hover:shadow-lg"
                      >
                        <div className="p-6 flex-grow">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">
                              {repoName}
                            </h3>
                            <div className="flex-shrink-0">
                              {repo.private ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Private
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Public
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10">
                            {repo.description || 'No description available'}
                          </p>
                          
                          {/* Documentation Status */}
                          <div className="mb-4">
                            {hasDocumentation ? (
                              <div className="flex items-center text-green-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">Documentation Available</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-11a1 1 0 112 0v4a1 1 0 11-2 0V7zm1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm">No documentation yet</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-200 bg-gray-50 p-4 flex flex-col items-center justify-center">
                          <a
                            href={repo.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            <span>GitHub</span>
                          </a>
                          <div className="space-x-2">
                            {hasDocumentation && (
                              <Link
                                href={`/docs/${fullName}`}
                                className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded text-sm transition-colors inline-block"
                              >
                                View Docs
                              </Link>
                            )}
                            <Link 
                              href={`/dashboard/generate-docs/${repo.id}`}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors inline-block"
                            >
                              {hasDocumentation ? 'Update Docs' : 'Generate Docs'}
                            </Link>
                            <Link 
                              href={`/dashboard/repository/${repo.id}`}
                              className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 rounded text-sm transition-colors inline-block"
                            >
                              Manage
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Documentation Section */}
            {documentedRepos.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Documentation</h2>
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repository</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {documentedRepos.slice(0, 5).map((repo: any, index: number) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{repo.fullName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {repo.updatedAt ? new Date(repo.updatedAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Available
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link href={`/docs/${repo.fullName}`} className="text-blue-600 hover:text-blue-900 mr-4">View</Link>
                              <Link href={`/dashboard/generate-docs/${repo.id}`} className="text-blue-600 hover:text-blue-900">Update</Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {documentedRepos.length > 5 && (
                    <div className="mt-4 text-center">
                      <Link href="/docs" className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center">
                        <span>View all documentation</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-200">
            <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Organization Found</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              You need to create or join an organization to start generating documentation for your repositories.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create Organization
            </button>
          </div>
        )}
      </div>
    </div>
  );
}