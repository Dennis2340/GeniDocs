import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/utils/db';
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from 'react';

export default async function Dashboard() {
  const session = await getServerSession();

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
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">Welcome, {session.user?.name}</span>
            <a
              href="/api/auth/signout"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Sign Out
            </a>
          </div>
        </div>

        {user?.organization ? (
          <div className="space-y-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Organization: {user.organization.name}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.organization.repositories.map((repo: { id: Key | null | undefined; name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; description: any; githubUrl: string | undefined; }) => (
                  <div
                    key={repo.id}
                    className="bg-gray-700 p-4 rounded-lg"
                  >
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {repo.name}
                    </h3>
                    <p className="text-gray-300 text-sm mb-4">
                      {repo.description || 'No description available'}
                    </p>
                    <div className="flex justify-between items-center">
                      <a
                        href={repo.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline text-sm"
                      >
                        View on GitHub
                      </a>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors">
                        Generate Docs
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-white mb-4">
              No Organization Found
            </h2>
            <p className="text-gray-300 mb-4">
              You need to create or join an organization to start generating documentation.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
              Create Organization
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 