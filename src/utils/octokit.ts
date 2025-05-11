import { Octokit } from '@octokit/rest';

// Define a type for the global object to store the Octokit instance
const globalForOctokit = globalThis as unknown as {
  octokit: Octokit | undefined;
};

// Singleton instance of Octokit
let octokitInstance: Octokit | undefined = globalForOctokit.octokit;

// Function to initialize or reuse Octokit with a given access token
export const getOctokit = (accessToken: string): Octokit => {
  // If an instance exists and the token matches, reuse it
  if (octokitInstance) {
    const currentToken = (octokitInstance as any).auth; // Access token from Octokit instance
    if (currentToken === accessToken) {
      return octokitInstance;
    }
  }

  // Create a new instance with the provided access token
  octokitInstance = new Octokit({
    auth: accessToken,
    userAgent: 'your-app-name/v1.0.0', // Optional: Set a user agent
  });

  // Store the instance in the global object for non-production environments
  if (process.env.NODE_ENV !== 'production') {
    globalForOctokit.octokit = octokitInstance;
  }

  return octokitInstance;
};