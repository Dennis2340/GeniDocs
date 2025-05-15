/**
 * Documentation standardization script
 * This script ensures all documentation files follow the same format and structure
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const DOCS_DIR = path.join(process.cwd(), 'docs', 'docs');

/**
 * Main function to standardize documentation
 */
async function standardizeDocs() {
  console.log('Starting documentation standardization...');
  
  try {
    // Check if docs directory exists
    if (!fs.existsSync(DOCS_DIR)) {
      console.log('Documentation directory not found. Creating it...');
      fs.mkdirSync(DOCS_DIR, { recursive: true });
    }
    
    // Step 1: Standardize Markdown files
    await standardizeMarkdownFiles();
    
    // Step 2: Organize documentation structure
    await organizeDocumentation();
    
    // Step 3: Fix frontmatter in all files
    await fixFrontmatter();
    
    // Step 4: Update sidebar configuration
    await updateSidebar();
    
    console.log('Documentation standardization completed successfully!');
  } catch (error) {
    console.error('Error standardizing documentation:', error);
    process.exit(1);
  }
}

/**
 * Standardize all markdown files
 */
async function standardizeMarkdownFiles() {
  console.log('Standardizing markdown files...');
  
  // Check if docs directory exists
  if (!fs.existsSync(DOCS_DIR)) {
    console.log('Documentation directory not found. Nothing to standardize.');
    return;
  }
  
  // Get all repository directories
  const repoDirs = fs.readdirSync(DOCS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  console.log(`Found ${repoDirs.length} repository directories to standardize`);
  
  // Process each repository
  for (const repoDir of repoDirs) {
    const repoPath = path.join(DOCS_DIR, repoDir);
    console.log(`Standardizing documentation for ${repoDir}...`);
    
    // Process all markdown files in the repository directory
    await processDirectory(repoPath, repoDir);
  }
}

/**
 * Process all markdown files in a directory recursively
 */
async function processDirectory(dirPath, repoSlug, relativePath = '') {
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);
    
    if (file.isDirectory()) {
      // Process subdirectory
      const newRelativePath = relativePath ? `${relativePath}/${file.name}` : file.name;
      await processDirectory(fullPath, repoSlug, newRelativePath);
    } else if (file.name.endsWith('.md')) {
      // Process markdown file
      await standardizeMarkdownFile(fullPath, repoSlug, relativePath);
    }
  }
}

/**
 * Standardize a markdown file
 */
async function standardizeMarkdownFile(filePath, repoSlug, relativePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if front matter exists
    if (!content.startsWith('---')) {
      const fileName = path.basename(filePath, '.md');
      const position = 1; // Default position
      
      // Add front matter
      content = `---
id: "${fileName}"
title: "${formatTitle(fileName)}"
sidebar_position: ${position}
---

${content}`;
    }
    
    // Write standardized content back to file
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (error) {
    console.error(`Error standardizing file ${filePath}:`, error);
  }
}

/**
 * Organize documentation structure
 */
async function organizeDocumentation() {
  console.log('Organizing documentation structure...');
  try {
    // Run the organization script
    await execAsync('node docs/scripts/organize.js');
  } catch (error) {
    console.error('Error organizing documentation:', error);
  }
}

/**
 * Fix frontmatter in all files
 */
async function fixFrontmatter() {
  console.log('Fixing frontmatter in all files...');
  try {
    // Check if the fix-frontmatter script exists
    const scriptPath = path.join(process.cwd(), 'docs', 'scripts', 'fix-frontmatter.js');
    if (fs.existsSync(scriptPath)) {
      await execAsync('node docs/scripts/fix-frontmatter.js');
    } else {
      console.log('fix-frontmatter.js script not found. Skipping this step.');
    }
  } catch (error) {
    console.error('Error fixing frontmatter:', error);
  }
}

/**
 * Update sidebar configuration
 */
async function updateSidebar() {
  console.log('Updating sidebar configuration...');
  try {
    // Check if the auto-generate-sidebar script exists
    const scriptPath = path.join(process.cwd(), 'docs', 'scripts', 'auto-generate-sidebar.js');
    if (fs.existsSync(scriptPath)) {
      await execAsync('node docs/scripts/auto-generate-sidebar.js');
    } else {
      console.log('auto-generate-sidebar.js script not found. Skipping this step.');
    }
  } catch (error) {
    console.error('Error updating sidebar:', error);
  }
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

// Run the standardization
standardizeDocs();
