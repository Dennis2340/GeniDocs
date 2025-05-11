import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/utils/db';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  try {
    // Get the user session with auth options
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse the request body
    const body = await req.json();
    const { repoIds } = body;

    if (!repoIds || !Array.isArray(repoIds) || repoIds.length === 0) {
      return new Response(JSON.stringify({ message: 'No repositories selected' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { organization: true },
    });

    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create organization if it doesn't exist
    let organizationId = user.organization?.id;
    
    if (!organizationId) {
      // Create a new organization for the user
      const newOrg = await prisma.organization.create({
        data: {
          name: `${session.user.name}'s Organization`,
          slug: `${session.user.name?.toLowerCase().replace(/\s+/g, '-')}-org`,
          users: {
            connect: { id: user.id },
          },
        },
      });
      organizationId = newOrg.id;
    }

    // Fetch repo details from GitHub API via our /api/repos endpoint
    const reposResponse = await fetch(`${req.nextUrl.origin}/api/repos`);
    if (!reposResponse.ok) {
      return new Response(JSON.stringify({ message: 'Failed to fetch repository details' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const allRepos = await reposResponse.json();
    const selectedRepos = allRepos.filter((repo: any) => repoIds.includes(repo.id));

    // Update or create repositories for the organization
    const results = await Promise.all(
      selectedRepos.map(async (repo: any) => {
        // Check if repository already exists
        const existingRepo = await prisma.repository.findFirst({
          where: {
            githubId: repo.id,
            organizationId,
          },
        });

        if (existingRepo) {
          // Update existing repo
          return prisma.repository.update({
            where: { id: existingRepo.id },
            data: {
              name: repo.name,
              fullName: repo.fullName,
              description: repo.description,
              githubUrl: repo.githubUrl,
            },
          });
        }

        // Create new repository
        return prisma.repository.create({
          data: {
            githubId: repo.id,
            name: repo.name,
            fullName: repo.fullName,
            description: repo.description || 'No description',
            githubUrl: repo.githubUrl,
            organization: {
              connect: { id: organizationId },
            },
          },
        });
      })
    );

    return new Response(JSON.stringify({ 
      message: 'Repositories selected successfully',
      repositories: results 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error selecting repositories:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
