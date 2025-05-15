/**
 * Documentation organization script
 * This script organizes documentation files into a proper hierarchical structure for Docusaurus
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(process.cwd(), 'docs', 'docs');

/**
 * Main function to organize documentation
 */
async function organizeDocumentation() {
  console.log('Starting documentation organization...');
  
  try {
    // Check if docs directory exists
    if (!fs.existsSync(DOCS_DIR)) {
      console.log('Documentation directory not found. Creating it...');
      fs.mkdirSync(DOCS_DIR, { recursive: true });
      return;
    }
    
    // Get all repository directories
    const repoDirs = fs.readdirSync(DOCS_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    console.log(`Found ${repoDirs.length} repository directories to organize`);
    
    // Process each repository
    for (const repoDir of repoDirs) {
      const repoPath = path.join(DOCS_DIR, repoDir);
      console.log(`Organizing documentation for ${repoDir}...`);
      
      // Get all markdown files in the repository
      const markdownFiles = getAllMarkdownFiles(repoPath);
      
      // Group files by directory structure
      const filesByDirectory = groupFilesByDirectory(markdownFiles, repoPath);
      
      // Create directory structure and move files
      createDirectoryStructure(filesByDirectory, repoPath);
      
      // Generate index files for directories
      generateIndexFiles(repoPath);
      
      // Generate sidebar configuration
      generateSidebarConfig(repoPath, repoDir);
    }
    
    console.log('Documentation organization completed successfully!');
  } catch (error) {
    console.error('Error organizing documentation:', error);
    process.exit(1);
  }
}

/**
 * Get all markdown files in a directory recursively
 * @param {string} dir - Directory to search
 * @returns {string[]} - Array of file paths
 */
function getAllMarkdownFiles(dir) {
  let results = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        results = results.concat(getAllMarkdownFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        // Add markdown file to results
        results.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return results;
}

/**
 * Group files by directory structure
 * @param {string[]} files - Array of file paths
 * @param {string} baseDir - Base directory
 * @returns {Object} - Object with directory paths as keys and arrays of files as values
 */
function groupFilesByDirectory(files, baseDir) {
  const filesByDirectory = {};
  
  for (const file of files) {
    const relativePath = path.relative(baseDir, file);
    const dir = path.dirname(relativePath);
    
    if (!filesByDirectory[dir]) {
      filesByDirectory[dir] = [];
    }
    
    filesByDirectory[dir].push(file);
  }
  
  return filesByDirectory;
}

/**
 * Create directory structure and move files
 * @param {Object} filesByDirectory - Object with directory paths as keys and arrays of files as values
 * @param {string} baseDir - Base directory
 */
function createDirectoryStructure(filesByDirectory, baseDir) {
  for (const dir in filesByDirectory) {
    const targetDir = dir === '.' ? baseDir : path.join(baseDir, dir);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Process files in this directory
    for (const file of filesByDirectory[dir]) {
      const fileName = path.basename(file);
      const targetFile = path.join(targetDir, fileName);
      
      // Skip if the file is already in the right place
      if (file === targetFile) {
        continue;
      }
      
      // Read file content
      const content = fs.readFileSync(file, 'utf8');
      
      // Add frontmatter if not present
      let newContent = content;
      if (!content.startsWith('---')) {
        const fileNameWithoutExt = path.basename(fileName, '.md');
        newContent = `---
id: "${fileNameWithoutExt}"
title: "${formatTitle(fileNameWithoutExt)}"
sidebar_position: 1
---

${content}`;
      }
      
      // Write to the target file
      fs.writeFileSync(targetFile, newContent, 'utf8');
      
      // Delete the original file if it's not in the target directory
      if (path.dirname(file) !== targetDir) {
        fs.unlinkSync(file);
      }
    }
  }
}

/**
 * Generate index files for directories
 * @param {string} baseDir - Base directory
 */
function generateIndexFiles(baseDir) {
  const dirs = getDirectories(baseDir);
  
  // For each directory, create an index.md file if it doesn't exist
  for (const dir of dirs) {
    const indexFile = path.join(dir, 'index.md');
    if (!fs.existsSync(indexFile)) {
      const dirName = path.basename(dir);
      const content = `---
id: "${dirName}-index"
title: "${formatTitle(dirName)}"
sidebar_position: 1
---

# ${formatTitle(dirName)}

This section contains documentation related to ${formatTitle(dirName)}.
`;
      fs.writeFileSync(indexFile, content, 'utf8');
    }
    
    // Recursively process subdirectories
    generateIndexFiles(dir);
  }
}

/**
 * Generate sidebar configuration
 * @param {string} repoDir - Repository directory
 * @param {string} repoSlug - Repository slug
 */
function generateSidebarConfig(repoDir, repoSlug) {
  const sidebarConfig = buildSidebarConfig(repoDir, repoSlug);
  
  // Write the sidebar.js file
  const sidebarFile = path.join(repoDir, 'sidebar.js');
  const content = `module.exports = ${JSON.stringify(sidebarConfig, null, 2)};`;
  fs.writeFileSync(sidebarFile, content, 'utf8');
}

/**
 * Build sidebar configuration
 * @param {string} dir - Directory to scan
 * @param {string} label - Label for this section
 * @param {string} prefix - ID prefix for this section
 * @returns {Object} - Sidebar configuration object
 */
function buildSidebarConfig(dir, label, prefix = '') {
  const items = [];
  
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
    .map(file => path.join(dir, file));
  
  // Sort files by name
  files.sort((a, b) => {
    // Put README.md at the top if index.md doesn't exist
    if (path.basename(a) === 'README.md') return -1;
    if (path.basename(b) === 'README.md') return 1;
    return path.basename(a).localeCompare(path.basename(b));
  });
  
  // Add files to sidebar
  for (const file of files) {
    const fileName = path.basename(file, '.md');
    const id = prefix ? `${prefix}/${fileName}` : fileName;
    
    items.push({
      type: 'doc',
      id,
      label: getFileLabel(file),
    });
  }
  
  // Get all directories
  const directories = getDirectories(dir);
  
  // Process each directory
  for (const directory of directories) {
    const dirName = path.basename(directory);
    const newPrefix = prefix ? `${prefix}/${dirName}` : dirName;
    const dirItems = buildSidebarConfig(directory, dirName, newPrefix);
    
    if (dirItems.length > 0) {
      items.push({
        type: 'category',
        label: formatTitle(dirName),
        items: dirItems,
      });
    }
  }
  
  return items;
}

/**
 * Get all directories in a directory (non-recursive)
 * @param {string} dir - Directory to scan
 * @returns {string[]} - Array of directory paths
 */
function getDirectories(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => path.join(dir, dirent.name));
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
    return [];
  }
}

/**
 * Get a human-readable label from a file path
 * @param {string} filePath - File path
 * @returns {string} - Human-readable label
 */
function getFileLabel(filePath) {
  const fileName = path.basename(filePath, '.md');
  
  // Try to extract title from frontmatter
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const titleMatch = content.match(/title:\s*["'](.+?)["']/);
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1];
    }
  } catch (error) {
    // Ignore errors
  }
  
  return formatTitle(fileName);
}

/**
 * Format a string as a title
 * @param {string} str - String to format
 * @returns {string} - Formatted title
 */
function formatTitle(str) {
  return str
    .replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

// Run the organization
organizeDocumentation();
