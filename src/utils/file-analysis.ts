/**
 * Utility functions for analyzing files and generating documentation
 */

/**
 * Analyze a file to determine if it should be documented and its priority
 * @param fileName The name of the file
 * @param content The content of the file
 * @returns Object with shouldDocument, priority, and reason
 */
export function analyzeFileForDocumentation(fileName: string, content: string): {
  shouldDocument: boolean;
  priority: 'high' | 'medium' | 'low';
  reason: string;
} {
  // Skip binary files and files that are too large
  if (isBinaryFile(content) || content.length > 1000000) {
    return {
      shouldDocument: false,
      priority: 'low',
      reason: 'Binary file or too large'
    };
  }

  // Skip minified files
  if (isMinified(content)) {
    return {
      shouldDocument: false,
      priority: 'low',
      reason: 'Minified file'
    };
  }

  // Check file extension
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  // High priority files (main code files)
  const highPriorityExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'php', 'rb'];
  
  // Medium priority files (config, docs, etc.)
  const mediumPriorityExtensions = ['json', 'yaml', 'yml', 'md', 'html', 'css', 'scss', 'less', 'xml', 'toml', 'ini'];
  
  // Low priority files (misc)
  const lowPriorityExtensions = ['txt', 'log', 'svg', 'gitignore', 'env', 'lock'];
  
  // Files to skip
  const skipExtensions = ['min.js', 'min.css', 'bundle.js', 'bundle.css', 'map', 'ico', 'png', 'jpg', 'jpeg', 'gif', 'woff', 'woff2', 'ttf', 'eot', 'otf'];
  
  // Check for files to skip
  for (const skipExt of skipExtensions) {
    if (fileName.endsWith(`.${skipExt}`)) {
      return {
        shouldDocument: false,
        priority: 'low',
        reason: `Skipped file type: ${skipExt}`
      };
    }
  }
  
  // Determine priority based on extension
  if (extension && highPriorityExtensions.includes(extension)) {
    return {
      shouldDocument: true,
      priority: 'high',
      reason: `High priority file type: ${extension}`
    };
  }
  
  if (extension && mediumPriorityExtensions.includes(extension)) {
    return {
      shouldDocument: true,
      priority: 'medium',
      reason: `Medium priority file type: ${extension}`
    };
  }
  
  if (extension && lowPriorityExtensions.includes(extension)) {
    return {
      shouldDocument: true,
      priority: 'low',
      reason: `Low priority file type: ${extension}`
    };
  }
  
  // Default to documenting with low priority
  return {
    shouldDocument: true,
    priority: 'low',
    reason: 'Default behavior'
  };
}

/**
 * Generate documentation for a file
 * @param fileName The name of the file
 * @param content The content of the file
 * @returns Generated documentation
 */
export async function generateFileDocumentation(fileName: string, content: string): Promise<string> {
  // Get file extension
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  // Create a basic documentation template
  let documentation = `# ${fileName}\n\n`;
  
  // Add file type information
  documentation += `## File Type\n\n`;
  documentation += `\`${extension || 'unknown'}\` file\n\n`;
  
  // Add file description
  documentation += `## Description\n\n`;
  
  // Generate description based on file type
  switch (extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      documentation += `JavaScript/TypeScript file containing code for the application.\n\n`;
      break;
    case 'py':
      documentation += `Python file containing code for the application.\n\n`;
      break;
    case 'html':
      documentation += `HTML file defining the structure of a web page.\n\n`;
      break;
    case 'css':
    case 'scss':
    case 'less':
      documentation += `Stylesheet file defining the appearance of the application.\n\n`;
      break;
    case 'json':
    case 'yaml':
    case 'yml':
      documentation += `Configuration file defining settings for the application.\n\n`;
      break;
    case 'md':
      documentation += `Markdown documentation file.\n\n`;
      break;
    default:
      documentation += `File used in the application.\n\n`;
  }
  
  // Add file content summary
  documentation += `## Content Summary\n\n`;
  
  // Extract imports/dependencies
  const imports = extractImports(content, extension);
  if (imports.length > 0) {
    documentation += `### Imports/Dependencies\n\n`;
    documentation += imports.map(imp => `- \`${imp}\``).join('\n') + '\n\n';
  }
  
  // Extract functions/classes
  const functions = extractFunctions(content, extension);
  if (functions.length > 0) {
    documentation += `### Functions/Classes\n\n`;
    documentation += functions.map(func => `- \`${func}\``).join('\n') + '\n\n';
  }
  
  // Add code snippet
  documentation += `## Code Snippet\n\n`;
  documentation += '```' + (extension || '') + '\n';
  // Limit code snippet to first 50 lines or 1000 characters
  documentation += content.split('\n').slice(0, 50).join('\n').substring(0, 1000);
  if (content.length > 1000) {
    documentation += '\n... (truncated)';
  }
  documentation += '\n```\n';
  
  return documentation;
}

/**
 * Check if a file is likely a binary file
 * @param content The content of the file
 * @returns True if the file is likely binary
 */
function isBinaryFile(content: string): boolean {
  // Simple heuristic: check for null bytes or high concentration of non-printable characters
  const nonPrintableCount = (content.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g) || []).length;
  return content.includes('\0') || (nonPrintableCount / content.length > 0.1);
}

/**
 * Check if a file is likely minified
 * @param content The content of the file
 * @returns True if the file is likely minified
 */
function isMinified(content: string): boolean {
  // Simple heuristic: check for long lines and low whitespace ratio
  const lines = content.split('\n');
  const longLineCount = lines.filter(line => line.length > 500).length;
  const whitespaceCount = (content.match(/\s/g) || []).length;
  
  return longLineCount > 0 || (whitespaceCount / content.length < 0.1);
}

/**
 * Extract imports/dependencies from file content
 * @param content The content of the file
 * @param extension The file extension
 * @returns Array of import statements
 */
function extractImports(content: string, extension?: string): string[] {
  const imports: string[] = [];
  
  switch (extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      // Match ES6 imports
      const es6Imports = content.match(/import\s+.*?from\s+['"].*?['"]/g) || [];
      // Match CommonJS requires
      const commonJsImports = content.match(/(?:const|let|var)\s+.*?=\s+require\(['"].*?['"]\)/g) || [];
      imports.push(...es6Imports, ...commonJsImports);
      break;
    case 'py':
      // Match Python imports
      const pyImports = content.match(/(?:import|from)\s+.*?(?:import|\n)/g) || [];
      imports.push(...pyImports.map(imp => imp.trim()));
      break;
    case 'java':
      // Match Java imports
      const javaImports = content.match(/import\s+.*?;/g) || [];
      imports.push(...javaImports);
      break;
    // Add more cases for other languages as needed
  }
  
  // Limit to first 10 imports
  return imports.slice(0, 10);
}

/**
 * Extract functions/classes from file content
 * @param content The content of the file
 * @param extension The file extension
 * @returns Array of function/class declarations
 */
function extractFunctions(content: string, extension?: string): string[] {
  const functions: string[] = [];
  
  switch (extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      // Match function declarations
      const functionDeclarations = content.match(/(?:function|const|let|var)\s+\w+\s*\([^)]*\)/g) || [];
      // Match class declarations
      const classDeclarations = content.match(/class\s+\w+(?:\s+extends\s+\w+)?/g) || [];
      // Match arrow functions
      const arrowFunctions = content.match(/const\s+\w+\s*=\s*\([^)]*\)\s*=>/g) || [];
      functions.push(...functionDeclarations, ...classDeclarations, ...arrowFunctions);
      break;
    case 'py':
      // Match Python function and class declarations
      const pyFunctions = content.match(/def\s+\w+\s*\([^)]*\):/g) || [];
      const pyClasses = content.match(/class\s+\w+(?:\s*\([^)]*\))?:/g) || [];
      functions.push(...pyFunctions, ...pyClasses);
      break;
    case 'java':
      // Match Java method and class declarations
      const javaMethods = content.match(/(?:public|private|protected|static)?\s+\w+\s+\w+\s*\([^)]*\)/g) || [];
      const javaClasses = content.match(/(?:public|private|protected)?\s+class\s+\w+(?:\s+extends\s+\w+)?(?:\s+implements\s+\w+(?:,\s*\w+)*)?/g) || [];
      functions.push(...javaMethods, ...javaClasses);
      break;
    // Add more cases for other languages as needed
  }
  
  // Limit to first 10 functions
  return functions.slice(0, 10);
}
