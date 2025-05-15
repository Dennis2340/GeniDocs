/**
 * Auto-Deploy Documentation Utility
 * 
 * This utility is called automatically after documentation generation
 * to deploy the Docusaurus documentation.
 */

import { exec, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

// Configuration
const DOCS_DIR = path.join(process.cwd(), 'docs');
const LOG_FILE = path.join(process.cwd(), 'docs-deploy.log');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Determine the correct npm command based on the operating system
const isWindows = os.platform() === 'win32';
const NPM_CMD = isWindows ? 'npm.cmd' : 'npm';


/**
 * Log a message to both console and log file
 */
function log(message: string): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

/**
 * Execute a command and return the result
 */
async function executeCommand(command: string, cwd = DOCS_DIR): Promise<boolean> {
  try {
    log(`Executing: ${command}`);
    
    // Handle npm commands specially to avoid ENOENT errors
    if (command.startsWith('npm ')) {
      const npmArgs = command.slice(4).trim().split(' ');
      const { stdout, stderr } = await execAsync(`${NPM_CMD} ${npmArgs.join(' ')}`, { 
        cwd, 
        env: { ...process.env, FORCE_COLOR: '1' } // Preserve colors in output
      });
      
      if (stdout) log(stdout);
      if (stderr) log(stderr);
    } else {
      // For non-npm commands, use the original approach
      const { stdout, stderr } = await execAsync(command, { 
        cwd, 
        env: { ...process.env, FORCE_COLOR: '1' } // Preserve colors in output
      });
      
      if (stdout) log(stdout);
      if (stderr) log(stderr);
    }
    
    return true;
  } catch (error: any) {
    log(`Error executing command: ${command}`);
    log(error.message);
    return false;
  }
}

/**
 * Auto-deploy the documentation
 * This function is called after documentation generation
 */
export async function autoDeploy(repoId?: string): Promise<void> {
  log(`Starting automatic documentation deployment${repoId ? ` for repository ${repoId}` : ''}`);
  
  // Check if docs directory exists
  if (!fs.existsSync(DOCS_DIR)) {
    log('Error: Docs directory not found');
    return;
  }
  
  // Check if package.json exists in the docs directory
  if (!fs.existsSync(path.join(DOCS_DIR, 'package.json'))) {
    log('Error: package.json not found in docs directory');
    return;
  }
  
  // Install dependencies if node_modules doesn't exist
  if (!fs.existsSync(path.join(DOCS_DIR, 'node_modules'))) {
    log('Installing dependencies...');
    if (!await executeCommand('npm install')) {
      log('Failed to install dependencies');
      return;
    }
  }
  
  if (IS_PRODUCTION) {
    // Production mode - build and serve
    log('Building Docusaurus for production...');
    if (!await executeCommand('npm run build')) {
      log('Build failed');
      return;
    }
    
    log('Starting production server...');
    await executeCommand('npm run serve');
  } else {
    // Development mode - start the development server
    log('Starting Docusaurus in development mode...');
    
    // Check if a Docusaurus server is already running
    try {
      const { stdout } = await execAsync('netstat -ano | findstr :3001');
      if (stdout && stdout.includes('LISTENING')) {
        log('Docusaurus server is already running on port 3001');
        log('You can access the documentation at: http://localhost:3001');
        return;
      }
    } catch (error) {
      // No server running on port 3001, which is fine
    }
    
    // Start the server in a detached process
    log('Starting Docusaurus server in background...');
    
    // Use spawn to create a detached process
    const child = spawn(NPM_CMD, ['start'], {
      cwd: DOCS_DIR,
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, FORCE_COLOR: '1' },
      shell: false
    });
    
    // Unref the child to allow the parent process to exit
    child.unref();
    
    log('Docusaurus server started in background');
    log('You can access the documentation at: http://localhost:3001');
  }
}
