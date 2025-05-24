import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/db";
import { User, Repository } from "@prisma/client";

type RepositoryWithSlug = Repository & {
  slug?: string;
  owner?: string;
};

type UserWithOrganization = User & {
  organization: {
    repositories: RepositoryWithSlug[];
  } | null;
};

export async function GET(request: NextRequest) {
  try {
    // Get the session to check if the user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the repository slug from the query parameters
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Repository slug is required" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organization: {
          include: {
            repositories: true,
          },
        },
      },
    }) as UserWithOrganization | null;

    if (!user || !user.organization) {
      return NextResponse.json(
        { error: "User or organization not found" },
        { status: 404 }
      );
    }

    // Try to find the repository by slug
    // The slug format is typically owner-repo
    let repository: RepositoryWithSlug | null = null;
    
    // Extract repositories from user organization
    const repositories = user.organization.repositories;
    
    // First try to find by matching the slug directly from the repository data
    // This requires the slug to be stored in the database
    for (const repo of repositories) {
      // Add custom properties to each repository
      const customRepo = repo as RepositoryWithSlug;
      
      // Extract owner from fullName (format: owner/name)
      if (customRepo.fullName && customRepo.fullName.includes('/')) {
        customRepo.owner = customRepo.fullName.split('/')[0];
      }
      
      // Create a slug if one doesn't exist
      if (!customRepo.slug && customRepo.owner) {
        customRepo.slug = `${customRepo.owner}-${customRepo.name}`.toLowerCase();
      }
      
      // Check if this repository matches the requested slug
      if (customRepo.slug === slug || customRepo.slug?.toLowerCase() === slug.toLowerCase()) {
        repository = customRepo;
        break;
      }
    }

    // If not found by slug, try to find by constructing a slug from fullName
    if (!repository) {
      for (const repo of repositories) {
        const customRepo = repo as RepositoryWithSlug;
        
        // Extract owner from fullName (format: owner/name)
        if (customRepo.fullName && customRepo.fullName.includes('/')) {
          customRepo.owner = customRepo.fullName.split('/')[0];
          
          // Construct a slug from owner/name
          const constructedSlug = `${customRepo.owner}-${customRepo.name}`.toLowerCase();
          if (constructedSlug === slug.toLowerCase()) {
            repository = customRepo;
            break;
          }
        }
      }
    }

    if (!repository) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    // Extract owner from fullName if not already set
    const owner = repository.owner || 
      (repository.fullName && repository.fullName.includes('/') ? 
        repository.fullName.split('/')[0] : 
        'unknown');
    
    // Construct a slug if not already set
    const repoSlug = repository.slug || `${owner}-${repository.name}`.toLowerCase();

    // Return the repository information
    return NextResponse.json({
      id: repository.id,
      name: repository.name,
      fullName: repository.fullName,
      description: repository.description,
      owner: owner,
      slug: repoSlug,
    });
  } catch (error: any) {
    console.error("Error fetching repository:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}
