import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { authOptions } from "@/utils/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No access token" },
        { status: 401 }
      );
    }

    const octokit = new Octokit({
      auth: session.accessToken,
    });

    // Fetch user's repositories
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
      visibility: "all", // Get both public and private repos
    });

    // Transform the data to include only what we need
    const formattedRepos = repos.map((repo) => ({
      id: repo.id.toString(),
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      private: repo.private,
      updatedAt: repo.updated_at,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
    }));

    return NextResponse.json(formattedRepos);
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
