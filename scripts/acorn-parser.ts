import * as path from 'path';
import { Octokit } from '@octokit/rest';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

// Import JSX parser for acorn
import jsx from 'acorn-jsx';

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

// Extended acorn parser with JSX support
const acornJsxParser = acorn.Parser.extend(jsx());

// Map file extensions to parser options
const extensionToParserOptions: Record<string, any> = {
  '.js': { ecmaVersion: 2022, sourceType: 'module' },
  '.jsx': { ecmaVersion: 2022, sourceType: 'module', jsx: true },
  '.ts': { ecmaVersion: 2022, sourceType: 'module' },
  '.tsx': { ecmaVersion: 2022, sourceType: 'module', jsx: true },
  '.go': { parseGo: true }, // Special flag for Go files
};

// List of supported file extensions
const supportedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.go'];

/**
 * Simple Go parser that extracts basic code structures
 * @param content - Go file content
 * @returns Array of code entries
 */
function parseGoFile(content: string): CodeEntry[] {
  const entries: CodeEntry[] = [];
  const lines = content.split('\n');
  
  // Regex patterns for Go constructs
  const patterns = {
    package: /^package\s+(\w+)/,
    function: /^func\s+(\w+)\s*\(/,
    method: /^func\s+\([^)]*\)\s+(\w+)\s*\(/,
    struct: /^type\s+(\w+)\s+struct\s*{/,
    interface: /^type\s+(\w+)\s+interface\s*{/,
    type: /^type\s+(\w+)\s+(?!struct|interface)/,
    const: /^const\s+(\w+)/,
    var: /^var\s+(\w+)/,
    import: /^import\s*\(/,
  };
  
  let currentBlock: { type: string; name: string; startLine: number } | null = null;
  let braceCount = 0;
  let inImportBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNumber = i + 1;
    
    // Skip empty lines and comments
    if (!line || line.startsWith('//') || line.startsWith('/*')) {
      continue;
    }
    
    // Handle import blocks
    if (patterns.import.test(line)) {
      inImportBlock = true;
      continue;
    }
    
    if (inImportBlock) {
      if (line === ')') {
        inImportBlock = false;
      }
      continue;
    }
    
    // Count braces to track block endings
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    braceCount += openBraces - closeBraces;
    
    // Check for function declarations
    const funcMatch = line.match(patterns.function);
    if (funcMatch) {
      const funcName = funcMatch[1];
      // Check if this is a method by looking for receiver
      const methodMatch = line.match(/^func\s+\([^)]*\s+\*?(\w+)\)\s+(\w+)\s*\(/);
      
      if (methodMatch) {
        // This is a method
        entries.push({
          type: 'method',
          name: `${methodMatch[1]}.${methodMatch[2]}`,
          startLine: lineNumber,
          endLine: lineNumber, // Will be updated when we find the closing brace
        });
      } else {
        // This is a regular function
        entries.push({
          type: 'function',
          name: funcName,
          startLine: lineNumber,
          endLine: lineNumber, // Will be updated when we find the closing brace
        });
      }
      
      if (openBraces > 0) {
        currentBlock = {
          type: methodMatch ? 'method' : 'function',
          name: methodMatch ? `${methodMatch[1]}.${methodMatch[2]}` : funcName,
          startLine: lineNumber
        };
      }
      continue;
    }
    
    // Check for struct declarations
    const structMatch = line.match(patterns.struct);
    if (structMatch) {
      const structName = structMatch[1];
      entries.push({
        type: 'struct',
        name: structName,
        startLine: lineNumber,
        endLine: lineNumber, // Will be updated when we find the closing brace
        children: [],
      });
      
      if (openBraces > 0) {
        currentBlock = {
          type: 'struct',
          name: structName,
          startLine: lineNumber
        };
      }
      continue;
    }
    
    // Check for interface declarations
    const interfaceMatch = line.match(patterns.interface);
    if (interfaceMatch) {
      const interfaceName = interfaceMatch[1];
      entries.push({
        type: 'interface',
        name: interfaceName,
        startLine: lineNumber,
        endLine: lineNumber, // Will be updated when we find the closing brace
        children: [],
      });
      
      if (openBraces > 0) {
        currentBlock = {
          type: 'interface',
          name: interfaceName,
          startLine: lineNumber
        };
      }
      continue;
    }
    
    // Check for type declarations
    const typeMatch = line.match(patterns.type);
    if (typeMatch) {
      const typeName = typeMatch[1];
      entries.push({
        type: 'type',
        name: typeName,
        startLine: lineNumber,
        endLine: lineNumber,
      });
      continue;
    }
    
    // Check for const declarations
    const constMatch = line.match(patterns.const);
    if (constMatch) {
      const constName = constMatch[1];
      entries.push({
        type: 'const',
        name: constName,
        startLine: lineNumber,
        endLine: lineNumber,
      });
      continue;
    }
    
    // Check for var declarations
    const varMatch = line.match(patterns.var);
    if (varMatch) {
      const varName = varMatch[1];
      entries.push({
        type: 'var',
        name: varName,
        startLine: lineNumber,
        endLine: lineNumber,
      });
      continue;
    }
    
    // Update end line for current block when we encounter closing braces
    if (currentBlock && closeBraces > 0 && braceCount === 0) {
      const entry = entries.find(e => 
        e.name === currentBlock!.name && 
        e.startLine === currentBlock!.startLine
      );
      if (entry) {
        entry.endLine = lineNumber;
      }
      currentBlock = null;
    }
  }
  
  return entries;
}

/**
 * Parse file content using appropriate parser based on extension
 * @param content - File content
 * @param extension - File extension
 * @returns AST or null if parser not available
 */
function parseFileContent(content: string, extension: string): any | null {
  try {
    // Handle Go files with custom parser
    if (extension === '.go') {
      return { type: 'GoFile', entries: parseGoFile(content) };
    }
    
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
    
    // Use acorn with JSX support for .js and .jsx files
    const options = extensionToParserOptions[extension];
    if (!options) {
      return null;
    }

    const parserOptions = {
      ...options,
      locations: true,
    };
    
    let ast: any;
    
    // Use JSX-enabled parser for .jsx files and regular acorn for .js files
    if (extension === '.jsx') {
      ast = acornJsxParser.parse(content, parserOptions);
    } else {
      ast = acorn.parse(content, parserOptions);
    }
    
    return ast;
  } catch (error) {
    console.warn(`Error parsing file with extension ${extension}:`, error);
    return null;
  }
}

/**
 * Extract code structure from AST (works with Acorn, TypeScript ASTs, and Go parser results)
 * @param ast - Parsed AST or Go parser result
 * @param content - Original file content (for line counting)
 * @returns Array of code entries
 */
function extractCodeStructure(ast: any, content: string): CodeEntry[] {
  // Handle Go files - entries are already extracted by parseGoFile
  if (ast && ast.type === 'GoFile' && ast.entries) {
    return ast.entries;
  }
  
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

  // Helper function to extract React component information
  function extractReactComponent(node: any): CodeEntry | null {
    // Check for React functional components (arrow functions returning JSX)
    if (node.type === 'VariableDeclaration' && node.declarations) {
      for (const decl of node.declarations) {
        if (decl.id && decl.id.name && decl.init) {
          // Arrow function component
          if (decl.init.type === 'ArrowFunctionExpression' && hasJSXReturn(decl.init)) {
            const lines = getLineNumber(node);
            return {
              type: 'react_component',
              name: decl.id.name,
              startLine: lines.start,
              endLine: lines.end,
            };
          }
          // Function expression component
          if (decl.init.type === 'FunctionExpression' && hasJSXReturn(decl.init)) {
            const lines = getLineNumber(node);
            return {
              type: 'react_component',
              name: decl.id.name,
              startLine: lines.start,
              endLine: lines.end,
            };
          }
        }
      }
    }
    
    // Check for React function declaration components
    if (node.type === 'FunctionDeclaration' && node.id && hasJSXReturn(node)) {
      const lines = getLineNumber(node);
      return {
        type: 'react_component',
        name: node.id.name,
        startLine: lines.start,
        endLine: lines.end,
      };
    }
    
    return null;
  }

  // Helper function to check if a function returns JSX
  function hasJSXReturn(funcNode: any): boolean {
    if (!funcNode.body) return false;
    
    // Check for immediate JSX return (arrow function)
    if (funcNode.body.type && funcNode.body.type.startsWith('JSX')) {
      return true;
    }
    
    // Check for JSX in return statements (function body)
    if (funcNode.body.type === 'BlockStatement' && funcNode.body.body) {
      return funcNode.body.body.some((stmt: any) => {
        if (stmt.type === 'ReturnStatement' && stmt.argument) {
          return stmt.argument.type && stmt.argument.type.startsWith('JSX');
        }
        return false;
      });
    }
    
    return false;
  }

  // Recursive function to walk the AST
  function walkNode(node: any) {
    if (!node || typeof node !== 'object') return;

    // Check for React components first (for JSX files)
    const reactComponent = extractReactComponent(node);
    if (reactComponent) {
      entries.push(reactComponent);
      // Continue processing for other patterns
    }

    switch (node.type) {
      case 'FunctionDeclaration':
        if (node.id && node.id.name) {
          const lines = getLineNumber(node);
          // Check if it's already identified as a React component
          const isReactComponent = entries.some(e => 
            e.type === 'react_component' && 
            e.name === node.id.name && 
            e.startLine === lines.start
          );
          
          if (!isReactComponent) {
            entries.push({
              type: 'function',
              name: node.id.name,
              startLine: lines.start,
              endLine: lines.end,
            });
          }
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
            // Skip if already processed as React component
            const isReactComponent = entries.some(e => 
              e.type === 'react_component' && 
              decl.id && e.name === decl.id.name
            );
            
            if (!isReactComponent && decl.id && decl.id.name && 
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
            const funcType = hasJSXReturn(node.declaration) ? 'exported_react_component' : 'exported_function';
            entries.push({
              type: funcType,
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
            const funcType = hasJSXReturn(node.declaration) ? 'default_exported_react_component' : 'default_exported_function';
            entries.push({
              type: funcType,
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
          // Handle default export of arrow function components
          else if (node.declaration.type === 'ArrowFunctionExpression' && hasJSXReturn(node.declaration)) {
            const lines = getLineNumber(node);
            entries.push({
              type: 'default_exported_react_component',
              name: 'default', // Anonymous default export
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
  
  // Enhanced heuristics for grouping (including Go-specific patterns and React components)
  const featureKeywords: Record<string, string[]> = {
    'Authentication': ['auth', 'login', 'register', 'password', 'user', 'jwt', 'token'],
    'API': ['api', 'endpoint', 'route', 'controller', 'handler', 'router', 'server'],
    'Database': ['db', 'database', 'model', 'schema', 'query', 'repository', 'orm', 'sql', 'migration'],
    'UI Components': ['component', 'view', 'page', 'template', 'ui', 'frontend', 'react', 'jsx', 'tsx'],
    'Styling': ['style', 'css', 'scss', 'styled', 'theme'],
    'Utilities': ['util', 'helper', 'common', 'shared', 'tools'],
    'Testing': ['test', 'spec', 'mock', 'benchmark'],
    'Configuration': ['config', 'setting', 'env', 'flags'],
    'Security': ['security', 'permission', 'role', 'encrypt', 'crypto'],
    'Logging': ['log', 'logger', 'trace', 'debug'],
    'Middleware': ['middleware', 'interceptor', 'filter'],
    'CLI': ['cmd', 'cli', 'command', 'flag'],
    'HTTP': ['http', 'client', 'request', 'response'],
    'JSON': ['json', 'marshal', 'unmarshal'],
    'Validation': ['validate', 'validator', 'validation'],
    'Error Handling': ['error', 'err', 'exception'],
    'State Management': ['store', 'state', 'redux', 'context', 'provider'],
    'Hooks': ['hook', 'use'],
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
    
    // Special handling for React components
    if (entries && entries.some(e => e.type.includes('react_component'))) {
      return 'UI Components';
    }
    
    // Special handling for TypeScript definition files
    if (fileName.endsWith('.d.ts')) {
      return 'Configuration';
    }
    
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
      const allTypes = entries.map(entry => entry.type.toLowerCase()).join(' ');
      
      for (const [feature, keywords] of Object.entries(featureKeywords)) {
        for (const keyword of keywords) {
          if (allNames.includes(keyword) || allTypes.includes(keyword)) {
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
          const dirsToIgnore = ['node_modules', '.git', 'dist', 'build', 'target', 'out', 'bin', 'obj', '.next', 'coverage', 'vendor'];
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