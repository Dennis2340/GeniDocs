import fs from 'fs';
import path from 'path';

/**
 * Creates a proper hierarchical folder structure for Docusaurus documentation
 * @param docsDir The base directory for documentation
 * @param repoSlug The repository slug
 * @param files List of files to organize
 */
export async function organizeDocusaurusFiles(docsDir: string, repoSlug: string, files: string[]) {
  // Create the repository directory if it doesn't exist
  const repoDir = path.join(docsDir, 'docs', repoSlug);
  if (!fs.existsSync(repoDir)) {
    fs.mkdirSync(repoDir, { recursive: true });
  }

  // Group files by directory
  const filesByDirectory: Record<string, string[]> = {};
  
  files.forEach(file => {
    // Skip files that don't exist
    if (!fs.existsSync(path.join(docsDir, file))) {
      return;
    }
    
    // Determine directory path
    const dir = file.includes('/') 
      ? file.substring(0, file.lastIndexOf('/')) 
      : '';
    
    if (!filesByDirectory[dir]) {
      filesByDirectory[dir] = [];
    }
    
    filesByDirectory[dir].push(file);
  });

  // Create directories and move files
  for (const dir in filesByDirectory) {
    const targetDir = dir ? path.join(repoDir, dir) : repoDir;
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Move files to their respective directories
    for (const file of filesByDirectory[dir]) {
      const fileName = path.basename(file);
      const sourceFile = path.join(docsDir, file);
      const targetFile = path.join(targetDir, fileName);
      
      // Read file content
      const content = fs.readFileSync(sourceFile, 'utf8');
      
      // Add frontmatter if not present
      let newContent = content;
      if (!content.startsWith('---')) {
        const fileNameWithoutExt = path.basename(fileName, '.md');
        newContent = `---
id: "${fileNameWithoutExt}"
title: "${fileNameWithoutExt.replace(/-/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())}"
sidebar_position: 1
---

${content}`;
      }
      
      // Write to the target file
      fs.writeFileSync(targetFile, newContent, 'utf8');
    }
  }
  
  // Generate category index files for each directory
  generateCategoryIndexFiles(repoDir);
  
  // Generate sidebar.js file
  generateSidebarConfig(repoDir, repoSlug);
}

/**
 * Generate index.md files for each directory to serve as category introductions
 * @param baseDir The base directory to scan
 */
function generateCategoryIndexFiles(baseDir: string) {
  const dirs = getDirectories(baseDir);
  
  // For each directory, create an index.md file if it doesn't exist
  dirs.forEach(dir => {
    const indexFile = path.join(dir, 'index.md');
    if (!fs.existsSync(indexFile)) {
      const dirName = path.basename(dir);
      const content = `---
id: "${dirName}-index"
title: "${dirName.replace(/-/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())}"
sidebar_position: 1
---

# ${dirName.replace(/-/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())}

This section contains documentation related to ${dirName.replace(/-/g, ' ')}.
`;
      fs.writeFileSync(indexFile, content, 'utf8');
    }
    
    // Recursively process subdirectories
    generateCategoryIndexFiles(dir);
  });
}

/**
 * Generate a sidebar.js file for Docusaurus
 * @param repoDir The repository directory
 * @param repoSlug The repository slug
 */
function generateSidebarConfig(repoDir: string, repoSlug: string) {
  const sidebarConfig = buildSidebarConfig(repoDir, repoSlug);
  
  // Write the sidebar.js file
  const sidebarFile = path.join(repoDir, 'sidebar.js');
  const content = `module.exports = ${JSON.stringify(sidebarConfig, null, 2)};`;
  fs.writeFileSync(sidebarFile, content, 'utf8');
}

/**
 * Build the sidebar configuration object
 * @param dir The directory to scan
 * @param label The label for this section
 * @param prefix The ID prefix for this section
 * @returns The sidebar configuration object
 */
function buildSidebarConfig(dir: string, label: string, prefix: string = '') {
  const items: any[] = [];
  
  // Add index.md as the first item if it exists
  const indexFile = path.join(dir, 'index.md');
  if (fs.existsSync(indexFile)) {
    const id = prefix ? `${prefix}/index` : 'index';
    items.push({
      type: 'doc',
      id,
      label: 'Overview',
    });
  }
  
  // Get all markdown files except index.md
  const files = fs.readdirSync(dir)
    .filter(file => file.endsWith('.md') && file !== 'index.md')
    .map(file => {
      const id = prefix ? `${prefix}/${path.basename(file, '.md')}` : path.basename(file, '.md');
      return {
        type: 'doc',
        id,
        label: path.basename(file, '.md').replace(/-/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase()),
      };
    });
  
  // Add files to items
  items.push(...files);
  
  // Process subdirectories
  const dirs = getDirectories(dir);
  dirs.forEach(subDir => {
    const dirName = path.basename(subDir);
    const newPrefix = prefix ? `${prefix}/${dirName}` : dirName;
    const subItems = buildSidebarConfig(subDir, dirName, newPrefix);
    
    items.push({
      type: 'category',
      label: dirName.replace(/-/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase()),
      items: subItems,
    });
  });
  
  return items;
}

/**
 * Get all directories in a directory
 * @param dir The directory to scan
 * @returns Array of directory paths
 */
function getDirectories(dir: string): string[] {
  return fs.readdirSync(dir)
    .filter(file => fs.statSync(path.join(dir, file)).isDirectory())
    .map(file => path.join(dir, file));
}
