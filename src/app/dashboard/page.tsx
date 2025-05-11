import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/utils/db';
import { authOptions } from '../api/auth/[...nextauth]/route';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! },
    include: {
      organization: {
        include: {
          repositories: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-2">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard/repo-select"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded transition-colors"
            >
              Select Repositories
            </Link>
            <span className="text-sm text-gray-400">Welcome, {session.user?.name}</span>
            <a
              href="/api/auth/signout"
              className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded transition-colors"
            >
              Sign Out
            </a>
          </div>
        </div>

        {user?.organization ? (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2 inline-block">
                Organization: {user.organization.name}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {user.organization.repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className="bg-gray-700 p-3 rounded-lg flex flex-col justify-between h-full"
                  >
                    <div>
                      <h3 className="text-base font-medium mb-1 truncate">
                        {typeof repo.name === 'string' ? repo.name : 'Unnamed Repo'}
                      </h3>
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                        {repo.description || 'No description available'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <a
                        href={repo.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline truncate"
                      >
                        View on GitHub
                      </a>
                      <Link 
                        href={`/dashboard/generate-docs/${repo.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded transition-colors inline-block text-center"
                      >
                        Generate Docs
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <h2 className="text-lg font-semibold mb-2">No Organization Found</h2>
            <p className="text-sm text-gray-400 mb-3">
              You need to create or join an organization to start generating documentation.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1 rounded-lg transition-colors">
              Create Organization
            </button>
          </div>
        )}
      </div>
    </div>
  );
}