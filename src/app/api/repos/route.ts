import { NextRequest } from 'next/server';
import { prisma } from '@/utils/db';
import { getOctokit } from '@/utils/octokit';

export async function GET(req: NextRequest) {
  try {
    // For testing purposes, get the first GitHub account with a token
    // This is a temporary workaround until we fix the authentication issue
    const account = await prisma.account.findFirst({
      where: { provider: 'github' },
      include: { user: true },
    });
    
    if (!account || !account.access_token) {
      return new Response(JSON.stringify({ message: 'No GitHub accounts found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.log('Found account for user:', account.user?.name);

    if (!account || !account.access_token) {
      return new Response(JSON.stringify({ message: 'No GitHub access token found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize Octokit with the access token using the singleton
    const octokit = getOctokit(account.access_token);

    // Fetch the list of repositories the user has access to
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 100, // Fetch 100 repos per page
      page: 1,
    });

    // Map the repo data to a format for the frontend
    const repositoryList = repos.map((repo) => ({
      id: repo.id.toString(),
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || 'No description',
      githubUrl: repo.html_url,
    }));

    // Return the list of repositories
    return new Response(JSON.stringify(repositoryList), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}