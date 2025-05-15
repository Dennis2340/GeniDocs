const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Define paths
const docusaurusDir = __dirname;
const cacheDir = path.join(docusaurusDir, ".docusaurus");
const nodeModulesDir = path.join(docusaurusDir, "node_modules/.cache");

// Function to delete directory recursively
function deleteFolderRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursive call for directories
        deleteFolderRecursive(curPath);
      } else {
        // Delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
    console.log(`Deleted directory: ${dirPath}`);
  }
}

// Clear Docusaurus cache
if (fs.existsSync(cacheDir)) {
  deleteFolderRecursive(cacheDir);
} else {
  console.log(".docusaurus cache directory does not exist");
}

// Clear node_modules cache if it exists
if (fs.existsSync(nodeModulesDir)) {
  deleteFolderRecursive(nodeModulesDir);
} else {
  console.log("node_modules/.cache directory does not exist");
}

console.log("Cache cleared successfully!");

// Run Docusaurus build to verify everything works
try {
  console.log("Building Docusaurus to verify configuration...");
  execSync("npm run build", { stdio: "inherit" });
  console.log("Build completed successfully!");
} catch (error) {
  console.error("Build failed:", error.message);
}
