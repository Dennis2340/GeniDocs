import axios from "axios";

// Initialize X.AI API configuration
const xaiApiKey = process.env.XAI_API_KEY;
const xaiApiUrl = "https://api.x.ai/v1/chat/completions";

/**
 * Generate documentation for a single file
 * @param filename The name of the file
 * @param content The content of the file
 * @returns Generated markdown documentation
 */
export async function generateFileDocumentation(
  filename: string,
  content: string
): Promise<string> {
  try {
    console.log(`Starting documentation generation for ${filename}`);

    // Get file extension for language-specific prompting
    const extension = filename.substring(filename.lastIndexOf(".") + 1);
    const language = getLanguageFromExtension(extension);

    // Truncate content if it's too large
    const truncatedContent =
      content.length > 30000
        ? content.substring(0, 30000) + "\n\n... (content truncated for length)"
        : content;

    // Determine if this is likely an SDK/library file or a regular application file
    const isLikelySDK = content.includes('export ') || 
                       content.includes('module.exports') ||
                       content.includes('public class') ||
                       content.includes('public interface') ||
                       content.includes('@api') ||
                       content.includes('@public') ||
                       filename.toLowerCase().includes('sdk') ||
                       filename.toLowerCase().includes('api') ||
                       filename.toLowerCase().includes('lib') ||
                       filename.toLowerCase().includes('client');

    // Create a more specific system prompt based on the file type and whether it's an SDK/library
    const systemPrompt = isLikelySDK ? 
      // SDK/Library documentation prompt
      `You are a technical documentation specialist for ${language} SDKs and libraries. 
Your task is to create clear, comprehensive API documentation in Docusaurus-styled markdown format.

Follow this structure:
1. Start with a level-1 heading with the component/module name (not just the filename)
2. Add a concise overview of what this module provides and its purpose
3. Document the public API with level-2 headings for each exported function, class, or interface
4. For each API element, include:
   - Signature with proper syntax highlighting
   - Purpose and description
   - Parameters with types and descriptions in a table format
   - Return values with types and descriptions
   - At least one practical usage example
   - Any exceptions or errors that might be thrown
5. Include any important notes about dependencies, side effects, or performance considerations
6. If applicable, add a "See Also" section linking to related APIs

Focus ONLY on the public/exported parts of the code that would be relevant to users of the library.
Do NOT document private implementation details, helper functions, or internal utilities unless they're critical to understanding the API.
Be thorough but concise. Format with proper markdown headings, code blocks with syntax highlighting, tables, and formatting.
Emphasize practical usage over implementation details.` : 
      // Regular application code documentation prompt
      `You are a documentation specialist for ${language} code. 
Your task is to create clear, focused documentation for a code file in Docusaurus-styled markdown format.

Follow this structure:
1. Start with a level-1 heading with a descriptive name (not just the filename)
2. Add a brief description of the file's purpose and where it fits in the overall application
3. Document only the main components, functions, or classes with level-2 headings
4. For each important function/component, include:
   - Purpose and description
   - Parameters with types and descriptions
   - Return values with types and descriptions
   - Any important side effects or state changes
5. Note any key dependencies or imports
6. Add relevant code snippets for the most important parts using markdown code blocks

Focus on the most important aspects of the code that would help someone understand its purpose.
Do NOT document every single function or detail - prioritize what's most important for understanding.
Be concise and practical. Format with proper markdown headings, code blocks, tables, and formatting.`;

    // Make API request to X.AI
    const response = await axios.post(
      xaiApiUrl,
      {
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Generate documentation for this ${language} file: ${filename}\n\n${truncatedContent}`,
          },
        ],
        model: "grok-3-latest",
        stream: false,
        temperature: 0.2,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${xaiApiKey}`,
        },
      }
    );

    const generatedContent = response.data.choices[0].message.content;

    if (!generatedContent || generatedContent.trim().length < 50) {
      throw new Error("Generated content is too short or empty");
    }

    console.log(`Successfully generated documentation for ${filename}`);
    return generatedContent;
  } catch (error) {
    console.error(`Error generating documentation for ${filename}:`, error);

    // Try one more time with a simpler prompt
    try {
      console.log(
        `Retrying documentation generation for ${filename} with simpler prompt`
      );

      const response = await axios.post(
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
      );

      const fallbackContent = response.data.choices[0].message.content;

      if (!fallbackContent || fallbackContent.trim().length < 50) {
        throw new Error("Fallback content is too short or empty");
      }

      return fallbackContent;
    } catch (fallbackError) {
      console.error(
        `Fallback documentation generation also failed for ${filename}:`,
        fallbackError
      );
      return `# ${filename}\n\n## Overview\n\nThis file contains code that couldn't be automatically documented. Please refer to the source code for details.\n\n## Source Code\n\n\`\`\`${getLanguageFromExtension(
        filename.split(".").pop() || ""
      )}\n${content.substring(0, 1000)}\n...\n\`\`\``;
    }
  }
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
    const filesArray = typeof filesList === 'string' 
      ? filesList.split('\n').filter(file => file.trim() !== '')
      : Array.isArray(filesList) ? filesList : [];
      
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
    const response = await axios.post(
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
export function generateFallbackIndex(repoName: string, filesList: string | string[]): string {
  // Ensure filesList is an array
  const filesArray = typeof filesList === 'string' 
    ? filesList.split('\n').filter(file => file.trim() !== '')
    : Array.isArray(filesList) ? filesList : [];
  
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
export function analyzeFileForDocumentation(filename: string, content?: string): {
  shouldDocument: boolean;
  priority: 'high' | 'medium' | 'low';
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
    /\.d\.ts$/,  // Skip TypeScript declaration files
    /\.config\./,  // Skip config files
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
      priority: 'low',
      reason: 'File matches skip pattern'
    };
  }

  // Define priority type to match our return type
  type PriorityLevel = 'high' | 'medium' | 'low';
  
  // File extensions that are worth documenting
  const documentableExtensions: Array<{extensions: string[], priority: PriorityLevel}> = [
    // High priority (SDK/library code)
    { extensions: [".js", ".jsx", ".ts", ".tsx"], priority: 'high' },
    // Medium priority (backend/server code)
    { extensions: [".py", ".java", ".go", ".rb", ".php", ".cs", ".c", ".cpp", ".h", ".swift", ".kt", ".rs"], priority: 'medium' },
    // Low priority (styles, markup, config)
    { extensions: [".html", ".css", ".scss", ".less", ".json", ".yml", ".yaml", ".sh", ".bash", ".zsh", ".ps1"], priority: 'low' },
  ];

  const extension = filename.substring(filename.lastIndexOf(".")).toLowerCase();
  
  // Check if the extension is in our list of documentable extensions
  for (const group of documentableExtensions) {
    if (group.extensions.includes(extension)) {
      // Determine priority based on filename patterns
      let priority: PriorityLevel = group.priority;
      let reason = `File has ${extension} extension`;

      // Boost priority for key files
      if (/^(index|main|app|server|api|core|lib|sdk|client|service|util|helper|model|schema)\./i.test(filename)) {
        priority = 'high';
        reason = 'Core/important file based on filename';
      }
      
      // Boost priority for files with exports or public APIs
      if (content && (
        content.includes('export ') || 
        content.includes('module.exports') ||
        content.includes('public class') ||
        content.includes('public interface') ||
        content.includes('public function') ||
        content.includes('@api') ||
        content.includes('@public') ||
        content.includes('* @export') ||
        content.includes('* @public')
      )) {
        priority = 'high';
        reason = 'File contains public API or exports';
      }
      
      // Reduce priority for very large files that might be auto-generated
      if (content && content.length > 100000) {
        priority = 'low';
        reason = 'File is very large (possibly auto-generated)';
      }
      
      return { 
        shouldDocument: true, 
        priority,
        reason
      };
    }
  }

  // If we get here, the file extension isn't in our list
  return { 
    shouldDocument: false, 
    priority: 'low',
    reason: 'File extension not in documentable list'
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
