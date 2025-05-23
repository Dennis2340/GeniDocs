import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { firebaseConfig } from "../config/firebaseConfig";
import { generateMarkdownFromTemplate } from "./markdown";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

/**
 * Generates markdown documentation from a file's content using the x.ai Grok model
 * @param filename The name of the file
 * @param content The content of the file
 * @returns Promise<string> The generated markdown documentation
 */
async function generateMarkdownFromFile(
  filename: string,
  content: string
): Promise<string> {
  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You are a documentation expert that creates clear, concise, and helpful markdown documentation for code files. Include explanations of what the code does, its purpose, and how it fits into the larger application."
          },
          {
            role: "user",
            content: `Please generate comprehensive markdown documentation for this file named '${filename}':\n\n\`\`\`\n${content}\n\`\`\``
          }
        ],
        model: "grok-3-latest",
        stream: false,
        temperature: 0.2
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error:any) {
    console.error("Error generating documentation:", error);
    throw new Error(`Failed to generate documentation: ${error.message}`);
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
  } catch (error:any) {
    console.error("Error uploading to Firebase Storage:", error);
    throw new Error(`Failed to upload to Firebase Storage: ${error.message}`);
  }
}

/**
 * Generates documentation for a file and uploads it to Firebase Storage
 * @param filename The name of the file
 * @param content The content of the file
 * @param repoName The name of the repository
 * @returns Promise<{path: string, url: string}> The Firebase path and download URL
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
    
    // Create a clean path for Firebase Storage
    // Replace file extension with .md and handle special characters
    const cleanFilename = filename
      .replace(/\.[^/.]+$/, "") // Remove file extension
      .replace(/[^\w\-_\/]/g, "_"); // Replace special chars with underscore
    
    const firebasePath = `docs/doc-builder/${repoName}/${cleanFilename}.md`;
    
    // Upload to Firebase Storage
    const downloadUrl = await uploadToFirebaseStorage(firebasePath, markdown);
    
    return {
      path: firebasePath,
      url: downloadUrl
    };
  } catch (error:any) {
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
  } catch (error:any) {
    console.error("Error generating repository metadata:", error);
    throw new Error(`Failed to generate repository metadata: ${error.message}`);
  }
}

/**
 * Generates documentation from structured code information
 * @param codeStructure The structured code information grouped by feature
 * @returns Promise<{ documentation: any, urls: { [key: string]: string } }> The generated documentation and download URLs
 */
export async function generateAIDocumentation(codeStructure: Record<string, any[]>): Promise<{ documentation: any, urls: { [key: string]: string } }> {
  try {
    const documentation: Record<string, any> = {};
    const urls: Record<string, string> = {};
    
    // Process each feature group
    for (const [feature, files] of Object.entries(codeStructure)) {
      documentation[feature] = [];
      
      // Generate prompt for the AI based on the feature and its files
      const prompt = `Generate comprehensive documentation for the '${feature}' feature of this application. Here's the code structure:\n\n${JSON.stringify(files, null, 2)}`;
      
      // Call AI to generate documentation for this feature
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.XAI_API_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are a documentation expert that creates clear, concise, and helpful markdown documentation for code features. Analyze the provided code structure and generate comprehensive documentation that explains the purpose, functionality, and relationships between components."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          model: "grok-3-latest",
          stream: false,
          temperature: 0.2
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const markdownContent = data.choices[0].message.content;
      
      // Create a clean feature name for the file path
      const cleanFeatureName = feature.replace(/[^\w\-_\/]/g, "_").toLowerCase();
      const docPath = `docs/features/${cleanFeatureName}.md`;
      
      // Upload the documentation to Firebase Storage
      const downloadUrl = await uploadToFirebaseStorage(docPath, markdownContent);
      
      // Store the documentation and URL
      documentation[feature] = {
        content: markdownContent,
        files: files.map(file => file.path)
      };
      
      urls[feature] = downloadUrl;
    }
    
    // Generate a combined documentation file with links to all features
    const combinedMarkdown = generateMarkdownFromTemplate("feature-overview", {
      features: Object.keys(documentation),
      featureUrls: urls,
      generatedAt: new Date().toISOString()
    });
    
    const overviewPath = `docs/features/overview.md`;
    const overviewUrl = await uploadToFirebaseStorage(overviewPath, combinedMarkdown);
    urls["overview"] = overviewUrl;
    
    return {
      documentation,
      urls
    };
  } catch (error: any) {
    console.error("Error generating AI documentation:", error);
    throw new Error(`Failed to generate AI documentation: ${error.message}`);
  }
}
