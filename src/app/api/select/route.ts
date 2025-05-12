import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { prisma } from "@/utils/db";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No access token" },
        { status: 401 }
      );
    }

    // Get the user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    });

    if (!user?.organization) {
      return NextResponse.json(
        { error: "No organization found for user" },
        { status: 400 }
      );
    }

    const organizationId = user.organization.id;

    // Get the selected repository IDs from the request
    const { repoIds } = await request.json();

    if (!Array.isArray(repoIds) || repoIds.length === 0) {
      return NextResponse.json(
        { error: "No repositories selected" },
        { status: 400 }
      );
    }

    // Initialize Octokit to fetch repository details
    const octokit = new Octokit({
      auth: session.accessToken,
    });

    // First, get all repositories to find the full names
    const { data: allRepos } = await octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
    });

    // Create a map of repository IDs to their full names
    const repoMap = new Map(allRepos.map((repo) => [repo.id.toString(), repo]));

    // Filter and map the selected repositories
    const selectedRepos = repoIds
      .map((id) => repoMap.get(id))
      .filter((repo): repo is NonNullable<typeof repo> => repo !== undefined);

    if (selectedRepos.length === 0) {
      return NextResponse.json(
        { error: "No valid repositories found" },
        { status: 400 }
      );
    }

    // Create repositories in the database
    const createdRepos = await Promise.all(
      selectedRepos.map((repo) =>
        prisma.repository.create({
          data: {
            githubId: repo.id.toString(),
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description ?? null,
            githubUrl: repo.html_url,
            organizationId,
          },
        })
      )
    );

    return NextResponse.json({
      message: "Repositories added successfully",
      repositories: createdRepos,
    });
  } catch (error) {
    console.error("Error saving repositories:", error);
    return NextResponse.json(
      { error: "Failed to save repositories" },
      { status: 500 }
    );
  }
}
