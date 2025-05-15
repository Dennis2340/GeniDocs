/**
 * Deploy Docusaurus Documentation Script
 * 
 * This script automates the process of building and serving Docusaurus documentation.
 * It can be used in both development and production environments.
 * 
 * Usage:
 *   node deploy-docs.js [--dev|--prod]
 *   
 *   --dev: Starts the Docusaurus development server (default)
 *   --prod: Builds the documentation and serves the static files
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const LOG_FILE = path.join(__dirname, '..', 'docs-deploy.log');

// Check if the docs directory exists
if (!fs.existsSync(DOCS_DIR)) {
  console.error(`Error: Docs directory not found at ${DOCS_DIR}`);
  console.error('Make sure documentation has been generated first.');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const isProd = args.includes('--prod');
const isDev = args.includes('--dev') || !isProd; // Default to dev mode

// Log function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

// Execute command function
function executeCommand(command, cwd = DOCS_DIR) {
  try {
    log(`Executing: ${command}`);
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' } // Preserve colors in output
    });
    return true;
  } catch (error) {
    log(`Error executing command: ${command}`);
    log(error.message);
    return false;
  }
}

// Main function
async function main() {
  log('Starting Docusaurus deployment process');
  
  // Check if package.json exists in the docs directory
  if (!fs.existsSync(path.join(DOCS_DIR, 'package.json'))) {
    log('Error: package.json not found in docs directory');
    process.exit(1);
  }
  
  // Install dependencies if node_modules doesn't exist
  if (!fs.existsSync(path.join(DOCS_DIR, 'node_modules'))) {
    log('Installing dependencies...');
    if (!executeCommand('npm install')) {
      log('Failed to install dependencies');
      process.exit(1);
    }
  }
  
  if (isDev) {
    // Development mode - start the development server
    log('Starting Docusaurus in development mode...');
    executeCommand('npm start');
  } else {
    // Production mode - build and serve
    log('Building Docusaurus for production...');
    if (!executeCommand('npm run build')) {
      log('Build failed');
      process.exit(1);
    }
    
    log('Starting production server...');
    executeCommand('npm run serve');
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
