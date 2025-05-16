import axios from "axios";
import { setTimeout } from "timers/promises";

// Initialize X.AI API configuration
const xaiApiKey = process.env.XAI_API_KEY;
const xaiApiUrl = "https://api.x.ai/v1/chat/completions";

// Rate limiting and retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRY_DELAY = 30000; // 30 seconds
const API_COOLDOWN = 1000; // 1 second between API calls

// Keep track of the last API call time
let lastApiCallTime = 0;

// Simple cache to avoid regenerating documentation
// Use a Map to store documentation by file hash (filename + content hash)
const documentationCache = new Map<string, string>();

/**
 * Create a simple hash for cache key
 */
function createCacheKey(filename: string, content: string): string {
  // Use the first 100 chars of content to create a simple hash
  const contentPreview = content.slice(0, 100);
  return `${filename}:${contentPreview}`;
}

/**
 * Simple rate limit queue to prevent hitting rate limits
 * Ensures minimum time between API calls
 */
async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCallTime;

  if (timeSinceLastCall < API_COOLDOWN && lastApiCallTime !== 0) {
    const delayNeeded = API_COOLDOWN - timeSinceLastCall;
    console.log(`Rate limiting: Waiting ${delayNeeded}ms before next API call`);
    await setTimeout(delayNeeded);
  }

  lastApiCallTime = Date.now();
}

/**
 * Wrapper for API calls with exponential backoff retry logic
 * @param apiCall Function that performs the actual API call
 * @param retryCount Current retry count
 * @returns Promise with the API response
 */
async function withRetry<T>(
  apiCall: () => Promise<T>,
  retryCount = 0
): Promise<T> {
  try {
    // Enforce rate limit before making the API call
    await enforceRateLimit();

    return await apiCall();
  } catch (error: any) {
    // Check if error is rate limiting (429)
    if (error.response?.status === 429 && retryCount < MAX_RETRIES) {
      // Calculate delay with exponential backoff
      const delay = Math.min(
        INITIAL_RETRY_DELAY * Math.pow(2, retryCount),
        MAX_RETRY_DELAY
      );

      console.log(
        `Rate limited (429). Retrying in ${delay}ms (attempt ${
          retryCount + 1
        }/${MAX_RETRIES})`
      );

      // Wait for the calculated delay
      await setTimeout(delay);

      // Retry the API call with incremented retry count
      return withRetry(apiCall, retryCount + 1);
    }

    // If not a rate limit error or max retries reached, rethrow
    throw error;
  }
}

/**
 * Modified system prompt for more effective code documentation
 */
const improvedSystemPrompt = `You are DocBot, an expert technical documentation specialist for programming code. 
Your task is to create clear, practical, and immediately useful documentation in Markdown format.

## DOCUMENTATION STRUCTURE:
1. Start with a level-1 heading with the component name (derived from the file, but make it descriptive)
2. Add a single paragraph overview explaining the module's core purpose and functionality
3. Document each exported/public function, class, or interface with level-2 headings
4. For each API element, include EXACTLY:
   - Signature with proper syntax highlighting 
   - Brief purpose description (1-2 sentences)
   - Parameters table with:
     | Parameter | Type | Required | Description |
     | --------- | ---- | -------- | ----------- |
   - Return value with type and description
   - AT LEAST ONE practical, complete, and working code example showing typical usage
   - Any exceptions, edge cases, or limitations

## CRITICAL REQUIREMENTS:
- Focus EXCLUSIVELY on the public/exported parts of the code that users would interact with
- ALWAYS include complete, runnable code examples for EVERY function
- Format code examples with proper language-specific syntax highlighting
- Be precise about types and signatures
- Use tables for parameters, not bullet points
- Document default values for optional parameters
- For complex functions, include multiple examples showing different use cases
- Include any important notes about side effects or performance considerations`;

/**
 * Improved user prompt to guide AI with specific details about the file
 */
function createUserPrompt(
  filename: string,
  content: string,
  language: string,
  fileType: "sdk" | "application" | "utility"
): string {
  return `Generate detailed technical documentation for this ${language} file: ${filename}
  
${
  fileType === "sdk"
    ? "This is an SDK/library file meant for external use."
    : fileType === "application"
    ? "This is an application code file for internal use."
    : "This is a utility file with helper functions."
}

FOCUS ON:
- The exported/public API components
- How developers would actually USE these functions
- Providing complete, runnable code examples that show real usage patterns
- Being specific about types, parameters, and return values
- Accurately describing any side effects or state changes

REQUIREMENTS:
- For EVERY function, provide at least one COMPLETE code example showing usage
- Be specific about the parameter types and what they do
- Use proper markdown formatting with tables for parameters
- Use proper code syntax highlighting in code blocks
- Document return values and their types
- Include any error conditions or exceptions that might occur

FILE CONTENT:
${content}`;
}

/**
 * Configuration for different documentation types
 */
const documentationConfig = {
  sdk: {
    temperature: 0.1, // Lower temperature for more precise output
    maxExamples: 2, // Number of examples per function
    includeInternals: false,
    focusOnUsage: true,
  },
  application: {
    temperature: 0.2,
    maxExamples: 1,
    includeInternals: false,
    focusOnUsage: true,
  },
  utility: {
    temperature: 0.2,
    maxExamples: 1,
    includeInternals: true,
    focusOnUsage: true,
  },
};

/**
 * Improved file type detection for better context-specific prompting
 */
function detectFileType(
  filename: string,
  content: string
): "sdk" | "application" | "utility" {
  // Check for SDK/library indicators
  if (
    content.includes("export ") ||
    content.includes("module.exports") ||
    content.includes("public class") ||
    content.includes("public interface") ||
    content.includes("@api") ||
    content.includes("@public") ||
    filename.toLowerCase().includes("sdk") ||
    filename.toLowerCase().includes("api") ||
    filename.toLowerCase().includes("lib") ||
    filename.toLowerCase().includes("client")
  ) {
    return "sdk";
  }

  // Check for utility indicators
  if (
    filename.toLowerCase().includes("util") ||
    filename.toLowerCase().includes("helper") ||
    filename.toLowerCase().includes("common") ||
    (content.includes("function ") &&
      (content.match(/function /g)?.length ?? 0) > 3)
  ) {
    return "utility";
  }

  // Default to application
  return "application";
}

/**
 * Generate documentation for a file using the improved prompting
 */
export async function generateFileDocumentation(
  filename: string,
  content: string
): Promise<string> {
  try {
    console.log(`Starting documentation generation for ${filename}`);

    // Check if we have cached documentation for this file
    const cacheKey = createCacheKey(filename, content);
    if (documentationCache.has(cacheKey)) {
      console.log(`Using cached documentation for ${filename}`);
      return documentationCache.get(cacheKey)!;
    }

    // Get file extension for language-specific prompting
    const extension = filename.substring(filename.lastIndexOf(".") + 1);
    const language = getLanguageFromExtension(extension);
    const fileType = detectFileType(filename, content);

    // Get config for this file type
    const config = documentationConfig[fileType];

    // Truncate content if it's too large
    const truncatedContent =
      content.length > 30000
        ? content.substring(0, 30000) + "\n\n... (content truncated for length)"
        : content;

    // Create the prompt with specific instructions
    const userPrompt = createUserPrompt(
      filename,
      truncatedContent,
      language,
      fileType
    );

    // Call the LLM API with improved prompting
    const response = await withRetry(() =>
      axios.post(
        xaiApiUrl,
        {
          messages: [
            {
              role: "system",
              content: improvedSystemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          model: "grok-3-latest",
          stream: false,
          temperature: config.temperature,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${xaiApiKey}`,
          },
        }
      )
    );

    // Extract and validate the response
    const generatedContent = response.data.choices[0].message.content;

    if (!generatedContent || generatedContent.trim().length < 150) {
      throw new Error(
        "Generated documentation is inadequate - too short or empty"
      );
    }

    // Verify that code examples are included
    if (
      !generatedContent.includes("```") ||
      !generatedContent.includes("Example")
    ) {
      throw new Error("Generated documentation is missing code examples");
    }

    console.log(`Successfully generated documentation for ${filename}`);

    // Cache the generated documentation
    documentationCache.set(cacheKey, generatedContent);

    return generatedContent;
  } catch (error) {
    console.error(`Error generating documentation for ${filename}:`, error);

    // Try one more time with a simpler prompt
    try {
      console.log(
        `Retrying documentation generation for ${filename} with simpler prompt`
      );

      const response = await withRetry(() =>
        axios.post(
          xaiApiUrl,
          {
            messages: [
              {
                role: "system",
                content:
                  "Create documentation for a code file in markdown format. Include a description of what the file does and document the main functions/components.",
              },
              {
                role: "user",
                content: `Please document this file: ${filename}\n\n${content.substring(
                  0,
                  15000
                )}`,
              },
            ],
            model: "grok-3-latest",
            stream: false,
            temperature: 0.3,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${xaiApiKey}`,
            },
          }
        )
      );

      const fallbackContent = response.data.choices[0].message.content;

      if (!fallbackContent || fallbackContent.trim().length < 50) {
        throw new Error("Fallback content is too short or empty");
      }

      // Cache the fallback content
      const cacheKey = createCacheKey(filename, content);
      documentationCache.set(cacheKey, fallbackContent);

      return fallbackContent;
    } catch (fallbackError) {
      console.error(
        `Fallback documentation generation also failed for ${filename}:`,
        fallbackError
      );
      const basicDoc = fallbackDocumentation(filename, content);

      // Cache the basic documentation
      const cacheKey = createCacheKey(filename, content);
      documentationCache.set(cacheKey, basicDoc);

      return basicDoc;
    }
  }
}

/**
 * Simplified fallback documentation if the AI fails
 */
function fallbackDocumentation(filename: string, content: string): string {
  const extension = filename.substring(filename.lastIndexOf(".") + 1);
  const language = getLanguageFromExtension(extension);

  // Extract function names with simple regex to at least document what's available
  const functionMatches = content.match(/function\s+(\w+)\s*\(/g) || [];
  const exportMatches =
    content.match(/export\s+(?:const|function|class|interface)\s+(\w+)/g) || [];

  let functions = "";
  [...functionMatches, ...exportMatches].forEach((match) => {
    const name = match
      .replace(
        /function\s+|export\s+(?:const|function|class|interface)\s+|\s*\(/g,
        ""
      )
      .trim();
    functions += `### ${name}\n\nThis function appears in the codebase but could not be automatically documented.\n\n`;
  });

  return `# ${filename}\n\n## Overview\n\nThis ${language} file contains code that couldn't be fully documented automatically.\n\n## Available Functions\n\n${functions}\n\n## Source Code Preview\n\n\`\`\`${language.toLowerCase()}\n${content.substring(
    0,
    500
  )}\n...\n\`\`\``;
}

/**
 * Generate index page for the repository documentation
 * @param repoName The name of the repository
 * @param filesList List of files that were documented
 * @returns Markdown content for the index page
 */
export async function generateIndexPage(
  repoName: string,
  filesList: string | string[]
): Promise<string> {
  try {
    // Ensure filesList is an array
    const filesArray =
      typeof filesList === "string"
        ? filesList.split("\n").filter((file) => file.trim() !== "")
        : Array.isArray(filesList)
        ? filesList
        : [];

    // Group files by directory for better organization
    const filesByDirectory: Record<string, string[]> = {};

    filesArray.forEach((file) => {
      const dir = file.includes("/")
        ? file.substring(0, file.lastIndexOf("/"))
        : "";
      if (!filesByDirectory[dir]) {
        filesByDirectory[dir] = [];
      }
      filesByDirectory[dir].push(file);
    });

    const directoriesInfo = Object.entries(filesByDirectory)
      .map(
        ([dir, files]) =>
          `Directory: ${dir || "Root"}\nFiles: ${files.join(", ")}`
      )
      .join("\n\n");

    // Make API request to X.AI
    const response = await withRetry(() =>
      axios.post(
        xaiApiUrl,
        {
          messages: [
            {
              role: "system",
              content: `You are a documentation specialist. Create a Docusaurus-style index.md file for a repository's documentation.
The index page should include:
1. A title with the repository name
2. A brief introduction to the repository
3. A table of contents or navigation guide
4. An overview of the main directories and key files
5. Getting started information if you can infer it from the file structure`,
            },
            {
              role: "user",
              content: `Generate an index page for the repository "${repoName}" which contains these files organized by directory:\n\n${directoriesInfo}`,
            },
          ],
          model: "grok-3-latest",
          stream: false,
          temperature: 0.3,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${xaiApiKey}`,
          },
        }
      )
    );

    return (
      response.data.choices[0].message.content ||
      generateFallbackIndex(repoName, filesList)
    );
  } catch (error) {
    console.error(`Error generating index page for ${repoName}:`, error);
    return generateFallbackIndex(repoName, filesList);
  }
}

/**
 * Generate a fallback index page if the AI generation fails
 * @param repoName Repository name
 * @param filesList List of documented files
 * @returns Basic markdown index page
 */
export function generateFallbackIndex(
  repoName: string,
  filesList: string | string[]
): string {
  // Ensure filesList is an array
  const filesArray =
    typeof filesList === "string"
      ? filesList.split("\n").filter((file) => file.trim() !== "")
      : Array.isArray(filesList)
      ? filesList
      : [];

  // Group files by directory
  const filesByDirectory: Record<string, string[]> = {};

  filesArray.forEach((file) => {
    const dir = file.includes("/")
      ? file.substring(0, file.lastIndexOf("/"))
      : "Root";
    if (!filesByDirectory[dir]) {
      filesByDirectory[dir] = [];
    }
    filesByDirectory[dir].push(file);
  });

  // Create markdown content
  let content = `# ${repoName} Documentation\n\nThis documentation was automatically generated.\n\n`;

  content += `## Repository Structure\n\n`;

  // Add files by directory
  Object.entries(filesByDirectory).forEach(([dir, files]) => {
    content += `### ${dir}\n\n`;
    files.forEach((file) => {
      const filename = file.substring(file.lastIndexOf("/") + 1);
      const safeFilename = file.replace(/\//g, "_");
      content += `- [${filename}](${safeFilename})\n`;
    });
    content += "\n";
  });

  return content;
}

/**
 * Get programming language name from file extension
 * @param extension File extension
 * @returns Language name for documentation
 */
function getLanguageFromExtension(extension: string): string {
  const languageMap: Record<string, string> = {
    js: "JavaScript",
    jsx: "React JSX",
    ts: "TypeScript",
    tsx: "React TypeScript",
    py: "Python",
    java: "Java",
    go: "Go",
    rb: "Ruby",
    php: "PHP",
    cs: "C#",
    c: "C",
    cpp: "C++",
    h: "C/C++ Header",
    swift: "Swift",
    kt: "Kotlin",
    rs: "Rust",
    html: "HTML",
    css: "CSS",
    scss: "SCSS",
    less: "Less",
    md: "Markdown",
    json: "JSON",
    yml: "YAML",
    yaml: "YAML",
    sh: "Shell",
    bash: "Bash",
    zsh: "ZSH",
    ps1: "PowerShell",
  };

  return languageMap[extension.toLowerCase()] || "Code";
}

/**
 * Determine if a file is worth documenting and its documentation priority
 * @param filename The file path/name to check
 * @param content Optional file content for more intelligent analysis
 * @returns Object with shouldDocument boolean and priority level
 */
export function analyzeFileForDocumentation(
  filename: string,
  content?: string
): {
  shouldDocument: boolean;
  priority: "high" | "medium" | "low";
  reason: string;
} {
  // Skip common files that don't need documentation
  const skipPatterns = [
    /node_modules/,
    /\.git/,
    /\.DS_Store/,
    /package-lock\.json/,
    /yarn\.lock/,
    /\.env/,
    /\.log$/,
    /\.map$/,
    /\.min\.(js|css)$/,
    /^dist\//,
    /^build\//,
    /\.next\//,
    /\.cache\//,
    /\.vscode\//,
    /\.idea\//,
    /\.github\//,
    /^coverage\//,
    /^__tests__\//,
    /^test\//,
    /^tests\//,
    /\.test\./,
    /\.spec\./,
    /\.d\.ts$/, // Skip TypeScript declaration files
    /\.config\./, // Skip config files
    /\.eslintrc/,
    /\.prettierrc/,
    /\.babelrc/,
    /tsconfig/,
    /webpack/,
    /rollup/,
    /jest/,
    /karma/,
    /cypress/,
    /\.svg$/,
    /\.png$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.gif$/,
    /\.ico$/,
    /\.woff/,
    /\.ttf/,
    /\.eot/,
    /\.otf/,
  ];

  // Check if file matches any skip patterns
  if (skipPatterns.some((pattern) => pattern.test(filename))) {
    return {
      shouldDocument: false,
      priority: "low",
      reason: "File matches skip pattern",
    };
  }

  // Define priority type to match our return type
  type PriorityLevel = "high" | "medium" | "low";

  // File extensions that are worth documenting
  const documentableExtensions: Array<{
    extensions: string[];
    priority: PriorityLevel;
  }> = [
    // High priority (SDK/library code)
    { extensions: [".js", ".jsx", ".ts", ".tsx"], priority: "high" },
    // Medium priority (backend/server code)
    {
      extensions: [
        ".py",
        ".java",
        ".go",
        ".rb",
        ".php",
        ".cs",
        ".c",
        ".cpp",
        ".h",
        ".swift",
        ".kt",
        ".rs",
      ],
      priority: "medium",
    },
    // Low priority (styles, markup, config)
    {
      extensions: [
        ".html",
        ".css",
        ".scss",
        ".less",
        ".json",
        ".yml",
        ".yaml",
        ".sh",
        ".bash",
        ".zsh",
        ".ps1",
      ],
      priority: "low",
    },
  ];

  const extension = filename.substring(filename.lastIndexOf(".")).toLowerCase();

  // Check if the extension is in our list of documentable extensions
  for (const group of documentableExtensions) {
    if (group.extensions.includes(extension)) {
      // Determine priority based on filename patterns
      let priority: PriorityLevel = group.priority;
      let reason = `File has ${extension} extension`;

      // Boost priority for key files
      if (
        /^(index|main|app|server|api|core|lib|sdk|client|service|util|helper|model|schema)\./i.test(
          filename
        )
      ) {
        priority = "high";
        reason = "Core/important file based on filename";
      }

      // Boost priority for files with exports or public APIs
      if (
        content &&
        (content.includes("export ") ||
          content.includes("module.exports") ||
          content.includes("public class") ||
          content.includes("public interface") ||
          content.includes("public function") ||
          content.includes("@api") ||
          content.includes("@public") ||
          content.includes("* @export") ||
          content.includes("* @public"))
      ) {
        priority = "high";
        reason = "File contains public API or exports";
      }

      // Reduce priority for very large files that might be auto-generated
      if (content && content.length > 100000) {
        priority = "low";
        reason = "File is very large (possibly auto-generated)";
      }

      return {
        shouldDocument: true,
        priority,
        reason,
      };
    }
  }

  // If we get here, the file extension isn't in our list
  return {
    shouldDocument: false,
    priority: "low",
    reason: "File extension not in documentable list",
  };
}

/**
 * Determine if a file is worth documenting (simplified version for backward compatibility)
 * @param filename The file path/name to check
 * @returns Boolean indicating if the file should be documented
 */
export function shouldDocumentFile(filename: string): boolean {
  return analyzeFileForDocumentation(filename).shouldDocument;
}
