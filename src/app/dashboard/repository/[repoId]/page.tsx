import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/utils/db';
import GitHubPluginInstaller from '@/components/GitHubPluginInstaller';
import { authOptions } from '@/utils/auth';

export default async function RepositoryDetails({ params }: { params: Promise<{ repoId: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect('/auth/signin');
  }

  const { repoId } = await params;

  // Fetch repository details
  const repository = await prisma.repository.findUnique({
    where: { id: repoId },
    include: {
      documentation: true,
    },
  });

  if (!repository) {
    redirect('/dashboard');
  }

  // Check if the user has access to this repository
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      organization: true,
    },
  });

  if (!user || user.organizationId !== repository.organizationId) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-2xl font-bold mb-2">{repository.name}</h1>
        <p className="text-gray-600 mb-4">{repository.fullName}</p>
        {repository.description && (
          <p className="text-gray-700 mb-4">{repository.description}</p>
        )}
        <div className="flex items-center space-x-4">
          <a
            href={repository.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            View on GitHub
          </a>
          {repository.documentation?.generatedUrl && (
            <Link
              href={repository.documentation.generatedUrl}
              className="text-green-600 hover:text-green-800"
            >
              View Documentation
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Documentation</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            {repository.documentation ? (
              <div>
                <p className="mb-4">
                  Documentation Status:{' '}
                  <span
                    className={`font-semibold ${
                      repository.documentation.status === 'COMPLETED'
                        ? 'text-green-600'
                        : repository.documentation.status === 'FAILED'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}
                  >
                    {repository.documentation.status}
                  </span>
                </p>
                <p className="mb-4">
                  Last Updated:{' '}
                  {new Date(repository.documentation.updatedAt).toLocaleString()}
                </p>
                <div className="mt-4">
                  <Link
                    href={`/dashboard/generate-docs/${repository.id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Regenerate Documentation
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-4">No documentation has been generated yet.</p>
                <Link
                  href={`/dashboard/generate-docs/${repository.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Generate Documentation
                </Link>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">GitHub Plugin</h2>
          <GitHubPluginInstaller
            repositoryId={repository.id}
            repositoryFullName={repository.fullName}
            repository={repository}
          />
        </div>
      </div>
    </div>
  );
}
