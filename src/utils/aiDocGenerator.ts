import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { firebaseConfig } from "../config/firebaseConfig";
import { generateMarkdownFromTemplate } from "./markdown";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

/**
 * Utility function to add delay between API calls
 * @param ms Milliseconds to wait
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries
 * @param baseDelay Base delay in milliseconds
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // If it's a rate limit error (429) or server error (5xx), retry
      if (error.message.includes('429') || error.message.includes('5')) {
        if (attempt < maxRetries) {
          const delayTime = baseDelay * Math.pow(2, attempt); // Exponential backoff
          console.log(`API request failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delayTime}ms...`);
          await delay(delayTime);
          continue;
        }
      }
      
      // If it's not a retryable error, throw immediately
      throw error;
    }
  }
  
  throw lastError!;
}

/**
 * Makes an API call to x.ai with rate limiting protection
 * @param messages The messages to send
 * @returns Promise<string> The AI response
 */
async function makeAIRequest(messages: any[]): Promise<string> {
  return retryWithBackoff(async () => {
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        messages,
        model: "gpt-4o",
        stream: false,
        temperature: 0.2
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  });
}
/**
 * Generates markdown documentation from a file's content using the x.ai Grok model
 * @param filename The name of the file
 * @param content The content of the file
 * @param docId Unique ID for the document
 * @param title The title of the document
 * @returns Promise<string> The generated markdown documentation with Docusaurus frontmatter
 */
async function generateMarkdownFromFile(
  filename: string,
  content: string,
  docId: string = '',
  title: string = ''
): Promise<string> {
  try {
    // Create a more descriptive title from the filename if not provided
    if (!title) {
      title = filename
        .split('/')
        .pop() // Get the last part of the path
        ?.replace(/\.[^/.]+$/, '') // Remove file extension
        ?.split(/[-_.]/) // Split by common separators
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
        .join(' ') || filename; // Join with spaces or use original if processing fails
    }
    
    // Create a unique ID if not provided
    if (!docId) {
      docId = filename
        .replace(/\.[^/.]+$/, '') // Remove file extension
        .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars with hyphens
        .toLowerCase();
    }
    
    const messages = [
      {
        role: "system",
        content: `You are a documentation expert that creates clear, concise, and helpful documentation for code files. Your output will be used in a Docusaurus site, so follow these guidelines:

1. Structure your response with proper markdown headings (## for sections, ### for subsections)
2. Use code blocks with proper language syntax highlighting
3. Create a clear overview at the beginning
4. Document functions, classes, and important variables with examples where appropriate
5. Explain the purpose of the code and how it fits into the larger application
6. Use tables for structured information where appropriate
7. Include a "Usage Examples" section if applicable
8. DO NOT include frontmatter - this will be added automatically
9. Start directly with the main content - no need for a title as it will be added automatically`
      },
      {
        role: "user",
        content: `Please generate comprehensive documentation for this file named '${filename}':\n\n\`\`\`\n${content}\n\`\`\``
      }
    ];

    const markdownContent = await makeAIRequest(messages);
    
    // Add Docusaurus frontmatter
    const frontmatter = `---
id: "${docId}"
title: "${title}"
sidebar_label: "${title}"
---

`;
    
    return frontmatter + markdownContent;
  } catch (error: any) {
    console.error("Error generating documentation:", error);
    throw new Error(`Failed to generate documentation: ${error.message}`);
  }
}

/**
 * Writes a markdown document to the Docusaurus docs folder
 * @param path The path in the docs folder
 * @param content The markdown content
 * @returns Promise<string> The file path
 */
async function writeToDocusaurusFolder(
  path: string,
  content: string
): Promise<string> {
  try {
    const fs = require('fs').promises;
    const nodePath = require('path');
    
    // Ensure the directory exists
    const dir = nodePath.dirname(path);
    await fs.mkdir(dir, { recursive: true });
    
    // Write the file
    await fs.writeFile(path, content, 'utf8');
    return path;
  } catch (error: any) {
    console.error("Error writing to Docusaurus folder:", error);
    throw new Error(`Failed to write to Docusaurus folder: ${error.message}`);
  }
}

/**
 * Uploads a markdown document to Firebase Storage
 * @param path The path in Firebase Storage
 * @param content The markdown content
 * @returns Promise<string> The download URL
 */
async function uploadToFirebaseStorage(
  path: string,
  content: string
): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    await uploadString(storageRef, content, 'raw');
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error: any) {
    console.error("Error uploading to Firebase Storage:", error);
    throw new Error(`Failed to upload to Firebase Storage: ${error.message}`);
  }
}

/**
 * Generates documentation for a file and saves it to Docusaurus docs folder
 * @param filename The name of the file
 * @param content The content of the file
 * @param repoName The name of the repository
 * @returns Promise<{path: string, url: string}> The local path and Firebase URL
 */
export async function generateAndUploadDoc({
  filename,
  content,
  repoName,
}: {
  filename: string;
  content: string;
  repoName: string;
}): Promise<{ path: string; url: string }> {
  try {
    // Generate markdown documentation
    const markdown = await generateMarkdownFromFile(filename, content);
    
    // Create a clean path for both local and Firebase storage
    const cleanFilename = filename
      .replace(/\.[^/.]+$/, "") // Remove file extension
      .replace(/[^\w\-_\/]/g, "_"); // Replace special chars with underscore
    
    // Local Docusaurus path
    const localPath = `docs/docs/${repoName}/${cleanFilename}.md`;
    
    // Firebase Storage path
    const firebasePath = `docs/doc-builder/${repoName}/${cleanFilename}.md`;
    
    // Write to local Docusaurus folder
    await writeToDocusaurusFolder(localPath, markdown);
    
    // Upload to Firebase Storage
    const downloadUrl = await uploadToFirebaseStorage(firebasePath, markdown);
    
    return {
      path: localPath,
      url: downloadUrl
    };
  } catch (error: any) {
    console.error("Error in generateAndUploadDoc:", error);
    throw new Error(`Documentation generation failed: ${error.message}`);
  }
}

/**
 * Generates a metadata file for a repository with information about all processed files
 * @param repoName The name of the repository
 * @param files Array of file metadata objects
 * @returns Promise<string> The download URL of the metadata file
 */
/**
 * Generates the Docusaurus sidebar configuration file based on the documentation structure
 * @param repoName The name of the repository
 * @param documentation The documentation object with category information
 * @returns Promise<string> The path to the generated sidebar file
 */
export async function generateSidebar(
  repoName: string,
  documentation: Record<string, any>
): Promise<string> {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Group features by category
    const categorizedFeatures: Record<string, Array<{feature: string, docId: string, title: string}>> = {};
    
    // Process each feature
    for (const [feature, data] of Object.entries(documentation)) {
      if (!data.category) continue;
      
      const category = data.category;
      const cleanFeatureName = feature.replace(/[^\w\-_\/]/g, "_").toLowerCase();
      const featureTitle = feature
        .split(/[-_.]/) // Split by common separators
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
        .join(' '); // Join with spaces
      
      // Create document ID based on the same pattern used in documentation generation
      const docId = `${repoName.toLowerCase()}-${category}-${cleanFeatureName}`;
      
      if (!categorizedFeatures[category]) {
        categorizedFeatures[category] = [];
      }
      
      categorizedFeatures[category].push({
        feature: cleanFeatureName,
        docId,
        title: featureTitle
      });
    }
    
    // First, let's check for and update index files to avoid duplicate routes
    try {
      // Get all category folders
      const categoryFolders = Object.keys(categorizedFeatures);
      
      for (const category of categoryFolders) {
        const indexPath = `docs/docs/${repoName}/${category}/index.md`;
        
        // Check if index file exists
        try {
          const indexExists = await fs.access(indexPath).then(() => true).catch(() => false);
          
          if (indexExists) {
            // Read the index file
            const indexContent = await fs.readFile(indexPath, 'utf8');
            
            // Update the frontmatter to avoid route conflicts
            const updatedContent = indexContent.replace(
              /---([\s\S]*?)---/,
              (match: string, frontmatter: string) => {
                // Add or update the slug property to avoid conflicts
                if (frontmatter.includes('slug:')) {
                  return match.replace(/slug:.*/, `slug: "/${repoName.toLowerCase()}/${category.toLowerCase()}/overview"`); 
                } else {
                  return match.replace(/---/, `---\nslug: "/${repoName.toLowerCase()}/${category.toLowerCase()}/overview"`); 
                }
              }
            );
            
            // Write the updated content back
            await fs.writeFile(indexPath, updatedContent, 'utf8');
            console.log(`✓ Updated index file for ${category} to avoid route conflicts`);
          }
        } catch (err) {
          console.error(`Error updating index file for ${category}:`, err);
          // Continue with other categories
        }
      }
    } catch (err) {
      console.error('Error handling index files:', err);
      // Continue with sidebar generation
    }
    
    // Create a main index file that redirects to the documentation
    try {
      const mainIndexPath = `docs/docs/${repoName}/index.md`;
      const mainIndexContent = `---
id: "${repoName.toLowerCase()}-index"
title: "${repoName} Documentation"
slug: "/docs/${repoName}"
sidebar_position: 1
---

# ${repoName} Documentation

Welcome to the ${repoName} documentation. This documentation is automatically generated from your codebase to provide comprehensive information about the features and components of your project.

## Features

${repoName} automatically analyzes your codebase and generates documentation organized by feature categories:

${Object.keys(categorizedFeatures).map(category => `- [${category.charAt(0).toUpperCase() + category.slice(1)}](/docs/${repoName}/${category.toLowerCase()}/${category.toLowerCase()})`).join('\n')}

## About ${repoName}

${repoName} uses AI to analyze your code and generate comprehensive documentation that explains the purpose, functionality, and relationships between components. The documentation is organized into logical categories and presented in a clean, readable format.`;
      
      await fs.writeFile(mainIndexPath, mainIndexContent, 'utf8');
      console.log(`✓ Generated main index file at: ${mainIndexPath}`);
    } catch (err) {
      console.error('Error creating main index file:', err);
      // Continue with sidebar generation
    }
    
    // Create sidebar configuration
    const sidebarConfig = {
      docs: [
        {
          type: 'category',
          label: `${repoName} Documentation`,
          items: [
            `${repoName}/index`,
            'GeniDocs/README',
            ...Object.entries(categorizedFeatures).map(([category, features]) => ({
              type: 'category',
              label: category.charAt(0).toUpperCase() + category.slice(1),
              items: features.map(feature => ({
                type: 'doc',
                id: `GeniDocs/${category}/${feature.feature}`,
                label: feature.title
              }))
            }))
          ],
        },
      ],
    };
    
    // Convert to JavaScript code
    const sidebarContent = `/**
 * Automatically generated sidebar configuration
 * Generated on: ${new Date().toISOString()}
 */

module.exports = ${JSON.stringify(sidebarConfig, null, 2)};
`;
    
    // Write to file
    const sidebarPath = 'docs/sidebars.js';
    await fs.writeFile(sidebarPath, sidebarContent, 'utf8');
    
    console.log(`✓ Generated sidebar configuration at: ${sidebarPath}`);
    return sidebarPath;
  } catch (error: any) {
    console.error("Error generating sidebar configuration:", error);
    throw new Error(`Failed to generate sidebar configuration: ${error.message}`);
  }
}

export async function generateRepoMetadata(
  repoName: string,
  files: Array<{ filename: string; docPath: string; url: string }>
): Promise<string> {
  try {
    const metadata = {
      repoName,
      generatedAt: new Date().toISOString(),
      files
    };
    
    const metadataPath = `docs/doc-builder/${repoName}/metadata.json`;
    const metadataContent = JSON.stringify(metadata, null, 2);
    
    const downloadUrl = await uploadToFirebaseStorage(metadataPath, metadataContent);
    return downloadUrl;
  } catch (error: any) {
    console.error("Error generating repository metadata:", error);
    throw new Error(`Failed to generate repository metadata: ${error.message}`);
  }
}

/**
 * Generates documentation from structured code information with rate limiting
 * and organized folder structure based on feature categories
 * @param codeStructure The structured code information grouped by feature
 * @param repoName The name of the repository
 * @returns Promise<{ documentation: any, urls: { [key: string]: string } }> The generated documentation and download URLs
 */
export async function generateAIDocumentation(
  codeStructure: Record<string, any[]>, 
  repoName: string
): Promise<{ documentation: any, urls: { [key: string]: string } }> {
  try {
    const documentation: Record<string, any> = {};
    const urls: Record<string, string> = {};
    const features = Object.entries(codeStructure);
    
    // Feature category mapping for organized folder structure
    const featureKeywords: Record<string, string[]> = {
      'Authentication': ['auth', 'login', 'register', 'password', 'user'],
      'API': ['api', 'endpoint', 'route', 'controller'],
      'Database': ['db', 'database', 'model', 'schema', 'query', 'repository'],
      'UI': ['component', 'view', 'page', 'template', 'style', 'css', 'ui'],
      'Utilities': ['util', 'helper', 'common', 'shared'],
      'Testing': ['test', 'spec', 'mock'],
      'Configuration': ['config', 'setting', 'env'],
      'Security': ['security', 'permission', 'role', 'encrypt'],
      'Logging': ['log', 'logger', 'trace', 'debug'],
      'Middleware': ['middleware', 'interceptor', 'filter'],
    };

    /**
     * Determines the category folder for a feature based on keywords
     */
    function getCategoryFolder(featureName: string): string {
      const lowerFeatureName = featureName.toLowerCase();
      
      for (const [category, keywords] of Object.entries(featureKeywords)) {
        if (keywords.some(keyword => lowerFeatureName.includes(keyword))) {
          return category.toLowerCase();
        }
      }
      
      return 'miscellaneous'; // Default category
    }

    console.log(`Processing ${features.length} features with rate limiting...`);
    
    // Process each feature group sequentially with delays
    for (let i = 0; i < features.length; i++) {
      const [feature, files] = features[i];
      
      console.log(`Processing feature ${i + 1}/${features.length}: ${feature}`);
      
      try {
        documentation[feature] = [];
        
        // Generate prompt for the AI based on the feature and its files
        const prompt = `Generate comprehensive documentation for the '${feature}' feature of this application. Here's the code structure:\n\n${JSON.stringify(files, null, 2)}`;
        
        const messages = [
          {
            role: "system",
            content: "You are a documentation expert that creates clear, concise, and helpful markdown documentation for code features. Analyze the provided code structure and generate comprehensive documentation that explains the purpose, functionality, and relationships between components. Format the output as proper markdown with headers, code blocks, and clear explanations."
          },
          {
            role: "user",
            content: prompt
          }
        ];

        // Call AI to generate documentation for this feature
        let markdownContent = await makeAIRequest(messages);
        
        // Determine the category folder for this feature
        const categoryFolder = getCategoryFolder(feature);
        
        // Create a clean feature name for the file path
        const cleanFeatureName = feature.replace(/[^\w\-_\/]/g, "_").toLowerCase();
        
        // Create a proper title from the feature name
        const featureTitle = feature
          .split(/[-_.]/) // Split by common separators
          .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
          .join(' '); // Join with spaces
        
        // Create a unique ID for the document
        const docId = `${repoName.toLowerCase()}-${categoryFolder}-${cleanFeatureName}`;
        
        // Add Docusaurus frontmatter
        const frontmatter = `---
id: "${docId}"
title: "${featureTitle}"
sidebar_label: "${featureTitle}"
sidebar_position: ${i + 1}
description: "Documentation for the ${featureTitle} feature"
---

`;
        
        // Add frontmatter to the markdown content
        markdownContent = frontmatter + markdownContent;
        
        // Local Docusaurus path with category organization
        const localDocPath = `docs/docs/${repoName}/${categoryFolder}/${cleanFeatureName}.md`;
        
        // Firebase Storage path with category organization
        const firebaseDocPath = `docs/features/${repoName}/${categoryFolder}/${cleanFeatureName}.md`;
        
        // Write to local Docusaurus folder
        await writeToDocusaurusFolder(localDocPath, markdownContent);
        
        // Upload the documentation to Firebase Storage
        const downloadUrl = await uploadToFirebaseStorage(firebaseDocPath, markdownContent);
        
        // Store the documentation and URL
        documentation[feature] = {
          content: markdownContent,
          files: files.map(file => file.path),
          category: categoryFolder,
          localPath: localDocPath
        };
        
        urls[feature] = downloadUrl;
        
        console.log(`✓ Successfully processed feature: ${feature} (category: ${categoryFolder})`);
        
        // Add delay between requests to avoid rate limiting (except for the last one)
        if (i < features.length - 1) {
          console.log(`Waiting 2 seconds before next request...`);
          await delay(2000); // 2 second delay between requests
        }
        
      } catch (error: any) {
        console.error(`Error processing feature '${feature}':`, error);
        // Continue with other features instead of failing completely
        const categoryFolder = getCategoryFolder(feature);
        const cleanFeatureName = feature.replace(/[^\w\-_\/]/g, "_").toLowerCase();
        const errorContent = `# ${feature}\n\n⚠️ Documentation generation failed: ${error.message}`;
        
        // Still try to write the error document locally
        try {
          const localDocPath = `docs/docs/${repoName}/${categoryFolder}/${cleanFeatureName}.md`;
          await writeToDocusaurusFolder(localDocPath, errorContent);
        } catch (writeError) {
          console.error(`Failed to write error document for ${feature}:`, writeError);
        }
        
        documentation[feature] = {
          content: errorContent,
          files: files.map(file => file.path),
          category: categoryFolder,
          error: true
        };
      }
    }
    
    try {
      // Generate a combined documentation file with links to all features
      let combinedMarkdown = generateMarkdownFromTemplate("feature-overview", {
        features: Object.keys(documentation),
        featureUrls: urls,
        generatedAt: new Date().toISOString(),
        repoName
      });
      
      // Add Docusaurus frontmatter to the overview document
      const frontmatter = `---
id: "README"
title: "${repoName} Documentation"
sidebar_label: "Overview"
sidebar_position: 1
slug: "/"
---

`;
      
      // Add frontmatter to the markdown content
      combinedMarkdown = frontmatter + combinedMarkdown;
      
      // Local overview path
      const localOverviewPath = `docs/docs/${repoName}/README.md`;
      const firebaseOverviewPath = `docs/features/${repoName}/overview.md`;
      
      // Write overview locally and upload to Firebase
      await writeToDocusaurusFolder(localOverviewPath, combinedMarkdown);
      const overviewUrl = await uploadToFirebaseStorage(firebaseOverviewPath, combinedMarkdown);
      urls["overview"] = overviewUrl;
      
      console.log(`✓ Generated overview documentation at: ${localOverviewPath}`);
      
      // Generate the sidebar configuration based on the documentation structure
      await generateSidebar(repoName, documentation);
    } catch (error: any) {
      console.error("Error generating overview:", error);
      // This is non-critical, so we don't fail the entire process
    }
    
    return {
      documentation,
      urls
    };
  } catch (error: any) {
    console.error("Error generating AI documentation:", error);
    throw new Error(`Failed to generate AI documentation: ${error.message}`);
  }
}