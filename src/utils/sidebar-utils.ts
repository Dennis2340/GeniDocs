/**
 * Utility functions for working with Docusaurus sidebars
 * This file helps avoid import conflicts by providing a clean interface
 */

import { generateSidebar } from './sidebar-generator';

/**
 * Generate a sidebar configuration for a repository
 * This is a wrapper function to avoid import conflicts
 * 
 * @param repoSlug The repository slug
 * @param documentedFiles Array of documented files
 * @param repoDir The repository directory
 * @returns Promise that resolves when sidebar is generated
 */
export async function createSidebar(
  repoSlug: string, 
  documentedFiles: string[], 
  repoDir: string
): Promise<void> {
  return generateSidebar(repoSlug, documentedFiles, repoDir);
}
