const fs = require("fs");
const path = require("path");

// Define paths
const docsDir = path.join(__dirname, "docs");
const indexPath = path.join(docsDir, "index.md");
const readmePath = path.join(docsDir, "README.md.md");

// Remove index.md to avoid duplicate routes with intro.md
if (fs.existsSync(indexPath)) {
  fs.unlinkSync(indexPath);
  console.log("Removed index.md to avoid duplicate routes");
}

// Remove README.md.md if it exists
if (fs.existsSync(readmePath)) {
  fs.unlinkSync(readmePath);
  console.log("Removed README.md.md");
}

// Create a standard README.md in the docs directory
const readmeContent = `# Documentation

This directory contains the documentation for the project.

## Structure

- **Introduction**: Overview of the project
- **Components**: UI, Layout, and Feature components
- **Pages**: Application pages and routes
- **API**: API endpoints and services
- **Utilities**: Helper functions and utilities
- **Configuration**: Project configuration files

## How to Use

Browse the documentation using the sidebar navigation.
`;

fs.writeFileSync(path.join(docsDir, "README.md"), readmeContent);
console.log("Created standard README.md");

// Create empty .nojekyll file to prevent GitHub Pages from ignoring files that begin with an underscore
fs.writeFileSync(path.join(__dirname, ".nojekyll"), "");
console.log("Created .nojekyll file");

console.log("Cleanup completed successfully!");
