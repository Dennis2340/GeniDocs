import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';
import  TypeScript  from 'tree-sitter-typescript';
import Python from 'tree-sitter-python';
import CSS from 'tree-sitter-css';
import HTML from 'tree-sitter-html';
import * as path from 'path';
import { Octokit } from '@octokit/rest';

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

// Initialize parsers for different languages
const parsers: Record<string, Parser> = {
  js: new Parser(),
  ts: new Parser(),
  py: new Parser(),
  css: new Parser(),
  html: new Parser(),
};

parsers.js.setLanguage(JavaScript as any);
parsers.ts.setLanguage(TypeScript as any);
parsers.py.setLanguage(Python as any);
parsers.css.setLanguage(CSS as any);
parsers.html.setLanguage(HTML as any);

// Map file extensions to parser types
const extensionToParser: Record<string, string> = {
  '.js': 'js',
  '.jsx': 'js',
  '.ts': 'ts',
  '.tsx': 'ts',
  '.py': 'py',
  '.css': 'css',
  '.scss': 'css',
  '.html': 'html',
  '.htm': 'html',
};

/**
 * Extract AST from file content using Tree-sitter
 * @param content - File content
 * @param extension - File extension
 * @returns Parsed AST or null if parser not available
 */
function parseFileContent(content: string, extension: string): Parser.Tree | null {
  const parserType = extensionToParser[extension];
  if (!parserType || !parsers[parserType]) {
    return null;
  }

  const parser = parsers[parserType];
  const tree = parser.parse(content);
  return tree;
}

/**
 * Extract code structure from AST
 * @param tree - Parsed AST
 * @param extension - File extension
 * @returns Array of code entries
 */
function extractCodeStructure(tree: Parser.Tree, extension: string): CodeEntry[] {
  const entries: CodeEntry[] = [];
  const rootNode = tree.rootNode;
  
  // Different languages have different node types for declarations
  const nodeTypesToExtract: Record<string, string[]> = {
    '.js': ['function_declaration', 'class_declaration', 'method_definition', 'arrow_function'],
    '.jsx': ['function_declaration', 'class_declaration', 'method_definition', 'arrow_function'],
    '.ts': ['function_declaration', 'class_declaration', 'method_definition', 'arrow_function', 'interface_declaration', 'type_alias_declaration'],
    '.tsx': ['function_declaration', 'class_declaration', 'method_definition', 'arrow_function', 'interface_declaration', 'type_alias_declaration'],
    '.py': ['function_definition', 'class_definition'],
    '.css': ['rule_set'],
    '.scss': ['rule_set'],
    '.html': ['element'],
    '.htm': ['element'],
  };
  
  const relevantTypes = nodeTypesToExtract[extension] || [];
  
  // Helper function to recursively process nodes
  function processNode(node: Parser.SyntaxNode): CodeEntry | null {
    if (!relevantTypes.includes(node.type)) {
      return null;
    }
    
    let name = '';
    let children: CodeEntry[] = [];
    
    // Extract name based on node type
    if (node.type === 'function_declaration' || node.type === 'class_declaration' || 
        node.type === 'interface_declaration' || node.type === 'type_alias_declaration') {
      // For JS/TS functions and classes
      const nameNode = node.childForFieldName('name');
      if (nameNode) {
        name = nameNode.text;
      }
    } else if (node.type === 'method_definition') {
      // For JS/TS class methods
      const nameNode = node.childForFieldName('name');
      if (nameNode) {
        name = nameNode.text;
      }
    } else if (node.type === 'arrow_function') {
      // For arrow functions, use parent's name if available
      const parent = node.parent;
      if (parent && parent.type === 'variable_declarator') {
        const nameNode = parent.childForFieldName('name');
        if (nameNode) {
          name = nameNode.text;
        }
      }
    } else if (node.type === 'function_definition' || node.type === 'class_definition') {
      // For Python functions and classes
      const nameNode = node.childForFieldName('name');
      if (nameNode) {
        name = nameNode.text;
      }
    } else if (node.type === 'rule_set') {
      // For CSS rule sets
      const selectorNode = node.childForFieldName('selector');
      if (selectorNode) {
        name = selectorNode.text;
      }
    } else if (node.type === 'element') {
      // For HTML elements
      const tagNode = node.childForFieldName('tag_name');
      if (tagNode) {
        name = tagNode.text;
        
        // Add id if available
        const attributes = node.childForFieldName('attributes');
        if (attributes) {
          for (let i = 0; i < attributes.namedChildCount; i++) {
            const attr = attributes.namedChild(i);
            if (attr && attr.type === 'attribute') {
              const attrName = attr.childForFieldName('name');
              if (attrName && attrName.text === 'id') {
                const attrValue = attr.childForFieldName('value');
                if (attrValue) {
                  name += `#${attrValue.text}`;
                }
              }
            }
          }
        }
      }
    }
    
    // Skip if no name found
    if (!name) {
      return null;
    }
    
    // Process child nodes
    for (let i = 0; i < node.namedChildCount; i++) {
      const child = node.namedChild(i);
      if (child) {
        const childEntry = processNode(child);
        if (childEntry) {
          children.push(childEntry);
        }
      }
    }
    
    return {
      type: node.type,
      name: name,
      startLine: node.startPosition.row,
      endLine: node.endPosition.row,
      children: children.length > 0 ? children : undefined
    };
  }
  
  // Process all top-level nodes
  for (let i = 0; i < rootNode.namedChildCount; i++) {
    const child = rootNode.namedChild(i);
    if (child) {
      const entry = processNode(child);
      if (entry) {
        entries.push(entry);
      }
    }
  }
  
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
    if (extensionToParser[extension]) {
      const tree = parseFileContent(file.content, extension);
      if (tree) {
        const entries = extractCodeStructure(tree, extension);
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
  // Validate inputs
  if (!repo || !repo.owner || !repo.name) {
    throw new Error('Repository owner and name are required');
  }
  
  if (!octokit) {
    throw new Error('Octokit instance is required');
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
          // Skip binary files and files we can't parse
          const extension = path.extname(item.path || '');
          if (!extensionToParser[extension]) {
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