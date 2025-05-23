import * as path from 'path';
import { Octokit } from '@octokit/rest';
import { parse } from 'acorn';
import * as walk from 'acorn-walk';

// You'll need to install these TypeScript parsing dependencies:
// npm install @typescript-eslint/parser @typescript-eslint/typescript-estree

// Import TypeScript parser
import { parse as parseTypeScript } from '@typescript-eslint/typescript-estree';

// Types
interface FileObject {
  path: string;
  content: string;
}

interface CodeEntry {
  type: string;
  name: string;
  startLine: number;
  endLine: number;
  children?: CodeEntry[];
}

interface ParsedFile {
  path: string;
  entries: CodeEntry[];
}

interface Repository {
  owner: string;
  name: string;
}

interface FeatureGroups {
  [key: string]: ParsedFile[];
}

// Map file extensions to parser options
const extensionToParserOptions: Record<string, any> = {
  '.js': { ecmaVersion: 2022, sourceType: 'module' },
  '.jsx': { ecmaVersion: 2022, sourceType: 'module' },
  '.ts': { ecmaVersion: 2022, sourceType: 'module' },
  '.tsx': { ecmaVersion: 2022, sourceType: 'module' },
};

// List of supported file extensions
const supportedExtensions = ['.js', '.jsx', '.ts', '.tsx'];

/**
 * Parse file content using appropriate parser based on extension
 * @param content - File content
 * @param extension - File extension
 * @returns AST or null if parser not available
 */
function parseFileContent(content: string, extension: string): any | null {
  try {
    // Use TypeScript parser for .ts and .tsx files
    if (extension === '.ts' || extension === '.tsx') {
      const ast = parseTypeScript(content, {
        loc: true,
        jsx: extension === '.tsx',
        useJSXTextNode: true,
        ecmaVersion: 2022,
        sourceType: 'module',
        range: true,
        tokens: false,
        comment: false,
        errorOnUnknownASTType: false,
        errorOnTypeScriptSyntacticAndSemanticIssues: false,
        allowInvalidAST: true,
      });
      return ast;
    }
    
    // Use standard acorn parser for .js and .jsx files
    const options = extensionToParserOptions[extension];
    if (!options) {
      return null;
    }

    const parserOptions = {
      ...options,
      locations: true,
    };
    
    const ast = parse(content, parserOptions);
    return ast;
  } catch (error) {
    console.warn(`Error parsing file with extension ${extension}:`, error);
    return null;
  }
}

/**
 * Extract code structure from AST (works with both Acorn and TypeScript ASTs)
 * @param ast - Parsed AST
 * @param content - Original file content (for line counting)
 * @returns Array of code entries
 */
function extractCodeStructure(ast: any, content: string): CodeEntry[] {
  const entries: CodeEntry[] = [];

  // Helper function to safely get line number from node
  function getLineNumber(node: any): { start: number; end: number } {
    if (node.loc) {
      return {
        start: node.loc.start.line,
        end: node.loc.end.line
      };
    }
    // Fallback for nodes without location info
    return { start: 1, end: 1 };
  }

  // Helper function to extract methods from class body
  function extractClassMethods(classBody: any[]): CodeEntry[] {
    const methods: CodeEntry[] = [];
    
    for (const member of classBody) {
      if (member.type === 'MethodDefinition' && member.key) {
        const methodName = member.key.name || (member.key.type === 'Identifier' ? member.key.name : 'anonymous');
        if (methodName && methodName !== 'anonymous') {
          const lines = getLineNumber(member);
          methods.push({
            type: 'method',
            name: methodName,
            startLine: lines.start,
            endLine: lines.end,
          });
        }
      }
      // Handle TypeScript-specific method types
      else if (member.type === 'TSMethodSignature' && member.key) {
        const methodName = member.key.name || (member.key.type === 'Identifier' ? member.key.name : 'anonymous');
        if (methodName && methodName !== 'anonymous') {
          const lines = getLineNumber(member);
          methods.push({
            type: 'method',
            name: methodName,
            startLine: lines.start,
            endLine: lines.end,
          });
        }
      }
    }
    
    return methods;
  }

  // Recursive function to walk the AST
  function walkNode(node: any) {
    if (!node || typeof node !== 'object') return;

    switch (node.type) {
      case 'FunctionDeclaration':
        if (node.id && node.id.name) {
          const lines = getLineNumber(node);
          entries.push({
            type: 'function',
            name: node.id.name,
            startLine: lines.start,
            endLine: lines.end,
          });
        }
        break;

      case 'ClassDeclaration':
        if (node.id && node.id.name) {
          const lines = getLineNumber(node);
          const classEntry: CodeEntry = {
            type: 'class',
            name: node.id.name,
            startLine: lines.start,
            endLine: lines.end,
            children: [],
          };
          
          // Extract methods from the class body
          if (node.body && node.body.body) {
            classEntry.children = extractClassMethods(node.body.body);
          }
          
          entries.push(classEntry);
        }
        break;

      case 'VariableDeclaration':
        if (node.declarations) {
          for (const decl of node.declarations) {
            // Only include function expressions and arrow functions
            if (decl.id && decl.id.name && 
                decl.init && (decl.init.type === 'FunctionExpression' || decl.init.type === 'ArrowFunctionExpression')) {
              const lines = getLineNumber(node);
              entries.push({
                type: 'variable',
                name: decl.id.name,
                startLine: lines.start,
                endLine: lines.end,
              });
            }
          }
        }
        break;

      case 'ExportNamedDeclaration':
        if (node.declaration) {
          if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id) {
            const lines = getLineNumber(node);
            entries.push({
              type: 'exported_function',
              name: node.declaration.id.name,
              startLine: lines.start,
              endLine: lines.end,
            });
          } else if (node.declaration.type === 'ClassDeclaration' && node.declaration.id) {
            const lines = getLineNumber(node);
            const classEntry: CodeEntry = {
              type: 'exported_class',
              name: node.declaration.id.name,
              startLine: lines.start,
              endLine: lines.end,
              children: [],
            };
            
            // Extract methods from the class body
            if (node.declaration.body && node.declaration.body.body) {
              classEntry.children = extractClassMethods(node.declaration.body.body);
            }
            
            entries.push(classEntry);
          }
          // Handle TypeScript interface exports
          else if (node.declaration.type === 'TSInterfaceDeclaration' && node.declaration.id) {
            const lines = getLineNumber(node);
            entries.push({
              type: 'interface',
              name: node.declaration.id.name,
              startLine: lines.start,
              endLine: lines.end,
            });
          }
          // Handle TypeScript type alias exports
          else if (node.declaration.type === 'TSTypeAliasDeclaration' && node.declaration.id) {
            const lines = getLineNumber(node);
            entries.push({
              type: 'type',
              name: node.declaration.id.name,
              startLine: lines.start,
              endLine: lines.end,
            });
          }
        }
        break;

      case 'ExportDefaultDeclaration':
        if (node.declaration) {
          if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id) {
            const lines = getLineNumber(node);
            entries.push({
              type: 'default_exported_function',
              name: node.declaration.id.name,
              startLine: lines.start,
              endLine: lines.end,
            });
          } else if (node.declaration.type === 'ClassDeclaration' && node.declaration.id) {
            const lines = getLineNumber(node);
            entries.push({
              type: 'default_exported_class',
              name: node.declaration.id.name,
              startLine: lines.start,
              endLine: lines.end,
            });
          }
        }
        break;

      // Handle TypeScript-specific declarations
      case 'TSInterfaceDeclaration':
        if (node.id && node.id.name) {
          const lines = getLineNumber(node);
          entries.push({
            type: 'interface',
            name: node.id.name,
            startLine: lines.start,
            endLine: lines.end,
          });
        }
        break;

      case 'TSTypeAliasDeclaration':
        if (node.id && node.id.name) {
          const lines = getLineNumber(node);
          entries.push({
            type: 'type',
            name: node.id.name,
            startLine: lines.start,
            endLine: lines.end,
          });
        }
        break;

      case 'TSEnumDeclaration':
        if (node.id && node.id.name) {
          const lines = getLineNumber(node);
          entries.push({
            type: 'enum',
            name: node.id.name,
            startLine: lines.start,
            endLine: lines.end,
          });
        }
        break;
    }

    // Recursively walk child nodes
    for (const key in node) {
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(walkNode);
      } else if (child && typeof child === 'object') {
        walkNode(child);
      }
    }
  }

  // Start walking from the root
  walkNode(ast);
  
  return entries;
}

/**
 * Group files by feature based on path and content
 * @param parsedFiles - Array of parsed files
 * @returns Object with files grouped by feature
 */
function groupFilesByFeature(parsedFiles: ParsedFile[]): FeatureGroups {
  const featureGroups: FeatureGroups = {};
  
  // Heuristics for grouping
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
  
  // Initialize feature groups
  Object.keys(featureKeywords).forEach(feature => {
    featureGroups[feature] = [];
  });
  
  // Add "Other" category for files that don't match any known feature
  featureGroups['Other'] = [];
  
  // Helper function to determine the feature of a file
  function determineFeature(filePath: string, entries?: CodeEntry[]): string {
    const fileName = path.basename(filePath).toLowerCase();
    const dirPath = path.dirname(filePath).toLowerCase();
    
    // First check if the directory path contains feature keywords
    for (const [feature, keywords] of Object.entries(featureKeywords)) {
      for (const keyword of keywords) {
        if (dirPath.includes(keyword)) {
          return feature;
        }
      }
    }
    
    // Then check if the file name contains feature keywords
    for (const [feature, keywords] of Object.entries(featureKeywords)) {
      for (const keyword of keywords) {
        if (fileName.includes(keyword)) {
          return feature;
        }
      }
    }
    
    // If no match found in path, check the code entries
    if (entries && entries.length > 0) {
      const allNames = entries.map(entry => entry.name.toLowerCase()).join(' ');
      
      for (const [feature, keywords] of Object.entries(featureKeywords)) {
        for (const keyword of keywords) {
          if (allNames.includes(keyword)) {
            return feature;
          }
        }
      }
    }
    
    // Default to "Other" if no match found
    return 'Other';
  }
  
  // Group files by feature
  parsedFiles.forEach(file => {
    const feature = determineFeature(file.path, file.entries);
    featureGroups[feature].push(file);
  });
  
  // Remove empty feature groups
  Object.keys(featureGroups).forEach(feature => {
    if (featureGroups[feature].length === 0) {
      delete featureGroups[feature];
    }
  });
  
  return featureGroups;
}

/**
 * Parse files from a repository
 * @param files - Array of file objects with path and content
 * @returns Structured code information grouped by feature
 */
export function parseFiles(files: FileObject[]): FeatureGroups {
  // Validate files array
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new Error('Files array is required and must not be empty');
  }
  
  const parsedFiles: ParsedFile[] = [];
  
  // Parse each file and extract its structure
  files.forEach(file => {
    // Validate file object
    if (!file || !file.path || !file.content) {
      console.warn('Skipping invalid file object:', file);
      return;
    }
    
    const extension = path.extname(file.path);
    if (supportedExtensions.includes(extension)) {
      const ast = parseFileContent(file.content, extension);
      if (ast) {
        const entries = extractCodeStructure(ast, file.content);
        if (entries.length > 0) {
          parsedFiles.push({
            path: file.path,
            entries: entries
          });
        }
      }
    }
  });
  
  // Group files by feature
  const groupedFiles = groupFilesByFeature(parsedFiles);
  
  return groupedFiles;
}

/**
 * Process a repository and extract its code structure
 * @param repo - Repository object with owner and name
 * @param octokit - Initialized Octokit instance
 * @returns Structured code information
 */
export async function processRepository(repo: Repository, octokit: Octokit): Promise<FeatureGroups> {
  try {
    // Validate repository object
    if (!repo) {
      throw new Error('Repository object is required');
    }
    
    if (!repo.owner || !repo.name) {
      throw new Error('Repository owner and name are required');
    }
    
    // Validate octokit instance
    if (!octokit) {
      throw new Error('Octokit instance is required');
    }
    
    console.log(`Processing repository: ${repo.owner}/${repo.name}`);
    
    // Get repository contents
    const files = await getRepositoryFiles(repo, octokit);
    
    // Validate files
    if (!files || files.length === 0) {
      throw new Error('No files were retrieved from the repository');
    }
    
    console.log(`Retrieved ${files.length} files from repository`);
    
    // Parse files and extract structure
    const codeStructure = parseFiles(files);
    
    return codeStructure;
  } catch (error) {
    console.error('Error processing repository:', error);
    throw error;
  }
}

/**
 * Get all files from a repository using Octokit
 * @param repo - Repository object with owner and name
 * @param octokit - Initialized Octokit instance
 * @returns Array of file objects with path and content
 */
export async function getRepositoryFiles(repo: Repository, octokit: Octokit): Promise<FileObject[]> {
  console.log('getRepositoryFiles called with repo:', repo);
  
  // Validate inputs
  if (!repo || !repo.owner || !repo.name) {
    console.error('Repository validation failed:', repo);
    throw new Error('Repository owner and name are required');
  }
  
  if (!octokit) {
    console.error('Octokit validation failed');
    throw new Error('Octokit instance is required');
  }
  
  // Test the GitHub token by making a simple API call
  try {
    console.log('Testing GitHub API access...');
    const { data: user } = await octokit.users.getAuthenticated();
    console.log('GitHub API access successful, authenticated as:', user.login);
  } catch (error: any) {
    console.error('GitHub API authentication test failed:', error.message);
    if (error.status === 401) {
      throw new Error('GitHub token is invalid or expired. Please reconnect your GitHub account.');
    }
    throw error;
  }
  
  const files: FileObject[] = [];
  
  // Helper function to recursively get files from a directory
  async function getFilesFromPath(dirPath = ''): Promise<void> {
    try {
      console.log(`Fetching contents for path: ${dirPath || 'root'}`);
      
      const response = await octokit.repos.getContent({
        owner: repo.owner,
        repo: repo.name,
        path: dirPath,
      });
      
      // Check if response is valid
      if (!response || !response.data) {
        console.warn(`No data received for path: ${dirPath}`);
        return;
      }
      
      const data = response.data;
      
      // Process each item (file or directory)
      const items = Array.isArray(data) ? data : [data];
      
      for (const item of items) {
        // Validate item structure
        if (!item || typeof item !== 'object') {
          console.warn(`Invalid item structure:`, item);
          continue;
        }
        
        if (item.type === 'file') {
          // Skip files we can't parse
          const extension = path.extname(item.path || '');
          if (!supportedExtensions.includes(extension)) {
            console.log(`Skipping unsupported file: ${item.path}`);
            continue;
          }
          
          // Skip large files
          if (item.size && item.size > 1000000) {
            console.log(`Skipping large file: ${item.path} (${item.size} bytes)`);
            continue;
          }
          
          try {
            console.log(`Fetching content for file: ${item.path}`);
            
            // Get file content with proper error handling
            const fileResponse = await octokit.repos.getContent({
              owner: repo.owner,
              repo: repo.name,
              path: item.path,
              mediaType: {
                format: 'raw',
              },
            });
            
            // Validate file response
            if (!fileResponse || fileResponse.data === undefined) {
              console.warn(`No content received for file: ${item.path}`);
              continue;
            }
            
            let content: string;
            
            // Handle different response types
            if (typeof fileResponse.data === 'string') {
              content = fileResponse.data;
            } else if (fileResponse.data instanceof ArrayBuffer) {
              content = new TextDecoder().decode(fileResponse.data);
            } else if (Buffer.isBuffer(fileResponse.data)) {
              content = fileResponse.data.toString('utf8');
            } else {
              // Handle base64 encoded content (fallback)
              try {
                content = Buffer.from(fileResponse.data as any, 'base64').toString('utf8');
              } catch (decodeError) {
                console.warn(`Failed to decode content for ${item.path}:`, decodeError);
                continue;
              }
            }
            
            files.push({
              path: item.path,
              content: content,
            });
            
            console.log(`Successfully processed file: ${item.path}`);
            
          } catch (fileError: any) {
            console.error(`Error fetching content for ${item.path}:`, {
              message: fileError.message,
              status: fileError.status,
              response: fileError.response?.data ? 'Response data present' : 'No response data'
            });
            
            // If we get HTML instead of JSON, it's likely an auth or API issue
            if (fileError.message?.includes('<!DOCTYPE') || fileError.message?.includes('Unexpected token')) {
              console.error('Received HTML response instead of JSON - possible authentication issue');
              throw new Error('GitHub API authentication failed or repository access denied');
            }
          }
        } else if (item.type === 'dir') {
          // Skip node_modules, .git, and other common directories to ignore
          const dirsToIgnore = ['node_modules', '.git', 'dist', 'build', 'target', 'out', 'bin', 'obj', '.next', 'coverage'];
          const shouldSkip = dirsToIgnore.some(dir => {
            const itemPath = item.path || '';
            return itemPath.includes(dir) || itemPath.split('/').includes(dir);
          });
          
          if (shouldSkip) {
            console.log(`Skipping ignored directory: ${item.path}`);
            continue;
          }
          
          // Recursively get files from subdirectory
          await getFilesFromPath(item.path);
        }
      }
    } catch (error: any) {
      console.error(`Error fetching directory content for ${dirPath}:`, {
        message: error.message,
        status: error.status,
        response: error.response?.data ? 'Response data present' : 'No response data'
      });
      
      // Check for specific error types
      if (error.status === 404) {
        console.error(`Repository or path not found: ${repo.owner}/${repo.name}${dirPath ? `/${dirPath}` : ''}`);
        throw new Error(`Repository not found or path does not exist: ${repo.owner}/${repo.name}`);
      } else if (error.status === 401 || error.status === 403) {
        console.error('Authentication or permission error');
        throw new Error('GitHub authentication failed or insufficient permissions to access repository');
      } else if (error.message?.includes('<!DOCTYPE') || error.message?.includes('Unexpected token')) {
        console.error('Received HTML response instead of JSON - possible authentication issue');
        throw new Error('GitHub API authentication failed or repository access denied');
      }
      
      // For other errors, we might want to continue processing other directories
      console.warn(`Continuing despite error in directory: ${dirPath}`);
    }
  }
  
  try {
    // Test authentication first
    console.log('Testing GitHub API authentication...');
    await octokit.users.getAuthenticated();
    console.log('GitHub API authentication successful');
    
    // Test repository access
    console.log(`Testing access to repository: ${repo.owner}/${repo.name}`);
    await octokit.repos.get({
      owner: repo.owner,
      repo: repo.name,
    });
    console.log('Repository access confirmed');
    
  } catch (authError: any) {
    console.error('Authentication or repository access test failed:', {
      message: authError.message,
      status: authError.status
    });
    
    if (authError.status === 401) {
      throw new Error('GitHub token is invalid or expired');
    } else if (authError.status === 403) {
      throw new Error('Insufficient permissions to access the repository');
    } else if (authError.status === 404) {
      throw new Error(`Repository ${repo.owner}/${repo.name} not found or not accessible`);
    } else {
      throw new Error(`GitHub API error: ${authError.message}`);
    }
  }
  
  // Start from the root of the repository
  await getFilesFromPath();
  
  if (files.length === 0) {
    console.warn('No files were retrieved from the repository');
    throw new Error('No parseable files found in the repository');
  } else {
    console.log(`Successfully retrieved ${files.length} files from repository`);
  }
  
  return files;
}