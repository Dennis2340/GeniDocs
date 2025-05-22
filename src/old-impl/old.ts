/**
 * Generate documentation for a repository
 */
// async function generateDocumentation(repository: any, token: string | null) {
//   try {
//     const { fullName, id } = repository;
//     const [owner, repo] = fullName.split("/");

//     // Initialize progress tracking
//     addLogEntry(
//       repository.id,
//       "Starting documentation generation process",
//       5,
//       "initializing"
//     );

//     // Create authenticated Octokit instance if token is available
//     const githubClient = token ? new Octokit({ auth: token }) : octokit;

//     // Create repository slug for directory name
//     const repoSlug = getRepoSlug(fullName);

//     // Set up the repository directory
//     const repoDir = path.join(DOCS_DIR, repoSlug);

//     // Create directory if it doesn't exist
//     if (!fs.existsSync(repoDir)) {
//       fs.mkdirSync(repoDir, { recursive: true });
//       addLogEntry(
//         id,
//         `Created documentation directory for ${fullName}`,
//         12,
//         "initializing"
//       );
//     }

//     addLogEntry(id, "Setting up Docusaurus structure", 10, "initializing");

//     // Create Docusaurus configuration files if they don't exist
//     addLogEntry(
//       repository.id,
//       `Setting up Docusaurus for ${fullName}`,
//       15,
//       "initializing"
//     );
//     setupDocusaurusConfig(repoSlug, fullName);

//     // Create intro file
//     addLogEntry(repository.id, "Creating introduction page", 15, "analyzing");
//     await createIntroFile(repository);

//     // Get repository contents
//     addLogEntry(
//       repository.id,
//       "Fetching repository contents from GitHub",
//       20,
//       "analyzing"
//     );
//     const { data: contentsRaw } = await githubClient.repos.getContent({
//       owner,
//       repo,
//       path: "",
//     });

//     // Normalize contents to always be an array
//     const contents = Array.isArray(contentsRaw) ? contentsRaw : [contentsRaw];

//     // Track documented files
//     const documentedFiles: string[] = [];

//     addLogEntry(
//       repository.id,
//       "Analyzing repository structure",
//       25,
//       "analyzing"
//     );

//     // Process repository contents
//     await processRepoContent(
//       owner,
//       repo,
//       "",
//       contents,
//       repoDir,
//       documentedFiles,
//       githubClient,
//       id
//     );

//     // Generate index page with links to all documented files
//     addLogEntry(
//       repository.id,
//       "Generating main documentation index",
//       85,
//       "finalizing"
//     );
//     // Convert documentedFiles array to a string with file names
//     const filesList = documentedFiles.join("\n");
//     const indexContent = await generateIndexPage(fullName, filesList);
//     fs.writeFileSync(
//       path.join(repoDir, "index.md"),
//       addFrontMatter(indexContent, "index", `${fullName} Documentation`, 1)
//     );

//     // Generate Docusaurus sidebar configuration
//     addLogEntry(
//       repository.id,
//       "Configuring Docusaurus sidebar",
//       90,
//       "finalizing"
//     );
//     await createSidebar(repoSlug, documentedFiles, repoDir);
//     addLogEntry(
//       repository.id,
//       `Configured Docusaurus sidebar for ${fullName}`,
//       92,
//       "finalizing"
//     );

//     // Ensure Docusaurus configuration is properly set up
//     addLogEntry(
//       repository.id,
//       "Ensuring Docusaurus configuration is properly set up",
//       94,
//       "finalizing"
//     );
//     try {
//       await ensureDocusaurusConfig(repoSlug);
//       addLogEntry(
//         repository.id,
//         `Docusaurus configuration updated successfully`,
//         96,
//         "finalizing"
//       );
//     } catch (configError) {
//       console.error("Error updating Docusaurus configuration:", configError);
//       addLogEntry(
//         repository.id,
//         `Warning: Could not update Docusaurus configuration: ${configError}`,
//         96,
//         "finalizing"
//       );
//     }

//     // Set the documentation URL
//     const docusaurusUrl = `/docs/${repoSlug}`;

//     // Update the documentation record with the URL
//     try {
//       await prisma.documentation.update({
//         where: { repositoryId: id },
//         data: {
//           generatedUrl: docusaurusUrl,
//           status: "COMPLETED",
//         },
//       });
//       addLogEntry(
//         repository.id,
//         `Updated documentation record in database`,
//         98,
//         "finalizing"
//       );
//     } catch (dbError) {
//       console.error("Error updating documentation record:", dbError);
//       addLogEntry(
//         repository.id,
//         `Warning: Could not update documentation record in database`,
//         98,
//         "finalizing"
//       );
//     }

//     addLogEntry(
//       repository.id,
//       "Documentation generation completed successfully",
//       100,
//       "completed"
//     );

//     // Auto-deploy the documentation
//     addLogEntry(
//       repository.id,
//       "Starting automatic documentation deployment",
//       100,
//       "deploying"
//     );
//     try {
//       await autoDeploy(repository.id);
//       addLogEntry(
//         repository.id,
//         "Documentation deployed successfully",
//         100,
//         "completed"
//       );
//     } catch (deployError) {
//       console.error("Error deploying documentation:", deployError);
//       addLogEntry(
//         repository.id,
//         `Warning: Could not auto-deploy documentation: ${deployError}`,
//         100,
//         "completed"
//       );
//     }

//     // Return success
//     return {
//       success: true,
//       message: "Documentation generated successfully",
//       path: repoDir,
//       url: docusaurusUrl,
//     };
//   } catch (error) {
//     console.error("Error generating documentation:", error);
//     // Make sure repository.id is defined to prevent errors
//     if (repository && repository.id) {
//       addLogEntry(
//         repository.id,
//         `Error generating documentation: ${error}`,
//         0,
//         "error"
//       );
//     } else {
//       console.error("Repository ID is undefined in error handler");
//     }
//     throw error;
//   }
// }


/**
 * Create the intro file for a repository
 */
// async function createIntroFile(repository: any) {
//     try {
//       const repoSlug = getRepoSlug(repository.fullName);
//       const repoDir = path.join(DOCS_DIR, repoSlug);
  
//       // Ensure the repository directory exists
//       if (!fs.existsSync(repoDir)) {
//         fs.mkdirSync(repoDir, { recursive: true });
//       }
  
//       // Create intro file with repository information
//       const [owner, repo] = repository.fullName.split("/");
  
//       const introContent = `---
//   id: "intro"
//   title: "${sanitizeFrontMatterValue(repository.name)} Documentation"
//   sidebar_position: 1
//   slug: "/docs/${repoSlug}"
//   ---
  
//   # ${repository.name} Documentation
  
//   This documentation is automatically generated from the codebase using AI analysis.
  
//   ## Repository Information
  
//   - **Owner**: ${owner}
//   - **Repository**: ${repo}
//   - **URL**: https://github.com/${repository.fullName}
  
//   ## Getting Started
  
//   Browse the documentation using the sidebar navigation to explore different parts of the codebase.
//   `;
  
//       // Write the intro file
//       fs.writeFileSync(path.join(repoDir, "intro.md"), introContent);
//       console.log(`Created intro file for ${repository.fullName}`);
//     } catch (error) {
//       console.error(
//         `Error creating intro file for ${repository.fullName}:`,
//         error
//       );
//     }
//   }
  
  
  
//   /**
//    * Process repository content recursively
//    */
//   async function processRepoContent(
//     owner: string,
//     repo: string,
//     path: string,
//     contentItems: any[],
//     repoDir: string,
//     documentedFiles: string[],
//     githubClient?: Octokit,
//     repositoryId?: string
//   ) {
//     // Use provided GitHub client or default to unauthenticated client
//     const client = githubClient || octokit;
  
//     // Create directories for structure in repository subdirectory
//     for (const item of contentItems) {
//       if (item.type === "dir") {
//         // Skip common directories that don't need documentation
//         const skipDirs = [
//           "node_modules",
//           ".git",
//           "dist",
//           "build",
//           "out",
//           "public",
//           ".next",
//           ".github",
//           "coverage",
//           "__tests__",
//           "__mocks__",
//         ];
//         if (skipDirs.includes(item.name)) {
//           if (repositoryId) {
//             addLogEntry(
//               repositoryId,
//               `Skipping directory: ${item.name} (common directory)`
//             );
//           }
//           continue;
//         }
  
//         const subdirPath = path ? `${path}/${item.name}` : item.name;
  
//         // Create corresponding directory in docs
//         // Ensure the path is relative to the repository directory
//         const relativePath = path ? `${path}/${item.name}` : item.name;
//         const docsSubdir = path
//           ? `${repoDir}/${relativePath}`
//           : `${repoDir}/${item.name}`;
  
//         if (!fs.existsSync(docsSubdir)) {
//           fs.mkdirSync(docsSubdir, { recursive: true });
//           if (repositoryId) {
//             addLogEntry(repositoryId, `Created directory: ${docsSubdir}`);
//           }
//         }
  
//         // Fetch subdirectory content
//         try {
//           const subDirContent = await client.repos.getContent({
//             owner,
//             repo,
//             path: subdirPath,
//           });
  
//           if (Array.isArray(subDirContent.data)) {
//             // Process subdirectory content recursively
//             await processRepoContent(
//               owner,
//               repo,
//               subdirPath,
//               subDirContent.data,
//               repoDir,
//               documentedFiles,
//               client,
//               repositoryId
//             );
//           }
//         } catch (error) {
//           console.error(
//             `Error fetching subdirectory content for ${subdirPath}:`,
//             error
//           );
//           if (repositoryId) {
//             addLogEntry(
//               repositoryId,
//               `Error fetching subdirectory content for ${subdirPath}: ${error}`
//             );
//           }
//         }
//       } else if (item.type === "file") {
//         // Process individual file
//         try {
//           const filePath = path ? `${path}/${item.name}` : item.name;
  
//           // Get file content
//           const fileContent = await client.repos.getContent({
//             owner,
//             repo,
//             path: filePath,
//           });
  
//           // If file content is available
//           if (fileContent.data && "content" in fileContent.data) {
//             // Decode Base64 content
//             const content = Buffer.from(
//               fileContent.data.content,
//               "base64"
//             ).toString();
  
//             // Analyze file to determine if it should be documented and its priority
//             const { shouldDocument, priority, reason } =
//               analyzeFileForDocumentation(item.name, content);
  
//             // Log the analysis result to server console and add to repository logs
//             const analysisMessage = `File ${item.name}: ${
//               shouldDocument ? "Will document" : "Skipping"
//             } (${priority} priority - ${reason})`;
//             console.log(analysisMessage);
  
//             // Add to repository logs if this is a file we're documenting or skipping a potentially important file
//             if (repositoryId && (shouldDocument || priority !== "low")) {
//               addLogEntry(repositoryId, analysisMessage);
//             }
  
//             // Skip files that shouldn't be documented
//             if (!shouldDocument) {
//               continue;
//             }
  
//             // Generate documentation for the file
//             const documentation = await generateFileDocumentation(
//               item.name,
//               content
//             );
  
//             // Determine the directory path for the documentation file
//             // If the file is in a subdirectory, create the same structure in docs
//             let dirPathInDocs;
//             if (path) {
//               dirPathInDocs = `${repoDir}/${path}`;
//               if (!fs.existsSync(dirPathInDocs)) {
//                 fs.mkdirSync(dirPathInDocs, { recursive: true });
//                 if (repositoryId) {
//                   addLogEntry(
//                     repositoryId,
//                     `Created directory: ${dirPathInDocs}`
//                   );
//                 }
//               }
//             } else {
//               dirPathInDocs = repoDir;
//             }
  
//             // Sanitize the filename for the docs
//             const docFilename = item.name
//               .replace(/\.[^/.]+$/, "")
//               .replace(/\s+/g, "-")
//               .toLowerCase();
  
//             // Create the proper path for the sidebar
//             const docPath = path ? `${path}/${docFilename}` : docFilename;
  
//             // Determine sidebar position based on priority
//             let position;
//             switch (priority) {
//               case "high":
//                 position = 2;
//                 break;
//               case "medium":
//                 position = 5;
//                 break;
//               case "low":
//               default:
//                 position = 10;
//                 break;
//             }
  
//             // Sanitize title for front matter
//             const sanitizedTitle = sanitizeFrontMatterValue(item.name);
  
//             // Add front matter to the documentation
//             const docWithFrontMatter = addFrontMatter(
//               documentation,
//               docPath, // Use the full path for the ID
//               sanitizedTitle,
//               position
//             );
  
//             // Write the documentation file
//             const docFilePath = `${dirPathInDocs}/${docFilename}.md`;
//             fs.writeFileSync(docFilePath, docWithFrontMatter);
  
//             // Add to the list of documented files with the proper path for Docusaurus
//             documentedFiles.push(`${docPath}`);
  
//             if (repositoryId) {
//               addLogEntry(
//                 repositoryId,
//                 `Generated documentation for ${filePath} at ${docFilePath}`
//               );
//             }
//             console.log(
//               `Generated documentation for ${filePath} at ${docFilePath}`
//             );
//           }
//         } catch (error) {
//           console.error(`Error processing file ${item.name}:`, error);
//           if (repositoryId) {
//             addLogEntry(
//               repositoryId,
//               `Error processing file ${item.name}: ${error}`
//             );
//           }
//         }
//       }
//     }
//   }
  
//   /**
//    * Get all markdown files in a directory recursively
//    */
//   function getAllFiles(dir: string, baseDir: string): string[] {
//     let results: string[] = [];
//     const list = fs.readdirSync(dir);
  
//     for (const file of list) {
//       const filePath = path.join(dir, file);
//       const stat = fs.statSync(filePath);
  
//       if (stat.isDirectory()) {
//         // Recursively scan subdirectories
//         results = results.concat(getAllFiles(filePath, baseDir));
//       } else if (file.endsWith(".md")) {
//         // Convert absolute path to relative path from baseDir
//         const relativePath = filePath.slice(
//           path.join(DOCS_DIR, baseDir).length + 1
//         );
  
//         // Format for Docusaurus sidebar (prefix with repo directory)
//         const sidebarPath = `${baseDir}/${relativePath.replace(/\\/g, "/")}`;
//         results.push(sidebarPath);
//       }
//     }
  
//     return results;
//   }
  
//   /**
//    * Ensure all necessary directories exist
//    */
//   function ensureDirectoriesExist() {
//     // Main documentation directory
//     if (!fs.existsSync(DOCS_DIR)) {
//       fs.mkdirSync(DOCS_DIR, { recursive: true });
//     }
  
//     // Create Docusaurus docs directory if it doesn't exist
//     const docusaurusDocsDir = path.join(process.cwd(), "docs");
//     if (!fs.existsSync(docusaurusDocsDir)) {
//       fs.mkdirSync(docusaurusDocsDir, { recursive: true });
//     }
//   }
  
//   /**
//    * Get a slug from the repository full name
//    * @param fullName The full name of the repository (owner/repo)
//    * @returns A sanitized slug for use in URLs and file paths
//    */
//   function getRepoSlug(fullName: string): string {
//     // Replace slashes and non-alphanumeric characters with dashes
//     return fullName
//       .replace(/\//g, "-")
//       .replace(/[^\w-]/g, "-")
//       .toLowerCase();
//   }
  
//   /**
//    * Setup Docusaurus configuration for a repository
//    * @param repoSlug The repository slug
//    * @param fullName The full name of the repository
//    */
//   function setupDocusaurusConfig(repoSlug: string, fullName: string) {
//     try {
//       // Create the Docusaurus config directory if it doesn't exist
//       const docusaurusDir = path.join(process.cwd(), "docs");
//       if (!fs.existsSync(docusaurusDir)) {
//         fs.mkdirSync(docusaurusDir, { recursive: true });
//       }
  
//       // Create docs directory for this repository
//       const repoDocsDir = path.join(DOCS_DIR, repoSlug);
//       if (!fs.existsSync(repoDocsDir)) {
//         fs.mkdirSync(repoDocsDir, { recursive: true });
//       }
  
//       // Create sidebars.js file if it doesn't exist
//       const sidebarsPath = path.join(docusaurusDir, "sidebars.js");
//       if (!fs.existsSync(sidebarsPath)) {
//         const sidebarContent = `/**
//    * Creating a sidebar enables you to:
//    * - create an ordered group of docs
//    * - render a sidebar for each doc of that group
//    * - provide next/previous navigation
//    */
  
//   module.exports = {
//     docs: [
//       {
//         type: 'category',
//         label: 'Documentation',
//         items: [],
//       },
//     ],
//   };
//   `;
//         fs.writeFileSync(sidebarsPath, sidebarContent);
//       }
  
//       // Create or update docusaurus.config.js if needed
//       const configPath = path.join(docusaurusDir, "docusaurus.config.js");
//       if (!fs.existsSync(configPath)) {
//         // Create a basic Docusaurus configuration
//         const configContent = `/**
//    * Docusaurus configuration file
//    */
//   module.exports = {
//     title: 'GeniDocs Documentation',
//     tagline: 'AI-Generated Documentation for your repositories',
//     url: process.env.SITE_URL || 'https://your-docusaurus-site.com',
//     baseUrl: '/',
//     onBrokenLinks: 'warn',
//     onBrokenMarkdownLinks: 'warn',
//     favicon: 'img/favicon.ico',
//     organizationName: 'GeniDocs',
//     projectName: 'documentation',
//     presets: [
//       [
//         '@docusaurus/preset-classic',
//         {
//           docs: {
//             sidebarPath: require.resolve('./sidebars.js'),
//             editUrl: 'https://github.com/your-org/your-repo/edit/main/docs/',
//           },
//           theme: {
//             customCss: require.resolve('./src/css/custom.css'),
//           },
//         },
//       ],
//     ],
//     themeConfig: {
//       navbar: {
//         title: 'GeniDocs',
//         logo: {
//           alt: 'GeniDocs Logo',
//           src: 'img/logo.svg',
//         },
//         items: [
//           {
//             to: 'docs/',
//             activeBasePath: 'docs',
//             label: 'Documentation',
//             position: 'left',
//           },
//           {
//             href: 'https://github.com/your-org/your-repo',
//             label: 'GitHub',
//             position: 'right',
//           },
//         ],
//       },
//       footer: {
//         style: 'dark',
//         links: [
//           {
//             title: 'Documentation',
//             items: [
//               {
//                 label: 'Getting Started',
//                 to: 'docs/',
//               },
//             ],
//           },
//         ],
//         copyright: 'Copyright © ' + new Date().getFullYear() + ' GeniDocs.',
//       },
//     },
//   };`;
//         fs.writeFileSync(configPath, configContent);
//       }
  
//       console.log(`Setup Docusaurus configuration for ${fullName}`);
//     } catch (error) {
//       console.error(`Error setting up Docusaurus config for ${fullName}:`, error);
//     }
//   }
  
//   /**
//    * Update the main sidebar.js file to include the repository
//    * This function is used after generating the repository-specific sidebar
//    * @param repoSlug The repository slug to add to the main sidebar
//    */
//   function updateMainSidebar(repoSlug: string) {
//     try {
//       const docusaurusDir = path.join(process.cwd(), "docs");
//       const sidebarsPath = path.join(docusaurusDir, "sidebars.js");
  
//       if (fs.existsSync(sidebarsPath)) {
//         let sidebarContent = fs.readFileSync(sidebarsPath, "utf8");
  
//         // Check if the repository is already in the sidebar
//         if (!sidebarContent.includes(`'${repoSlug}'`)) {
//           // Simple string replacement to add the repository to the sidebar
//           // This is a basic approach - for more complex sidebars, consider using a proper parser
//           sidebarContent = sidebarContent.replace(
//             "items: [],",
//             `items: [
//         {
//           type: 'doc',
//           id: '${repoSlug}/index',
//           label: '${repoSlug}',
//         },
//       ],`
//           );
  
//           fs.writeFileSync(sidebarsPath, sidebarContent);
//           console.log(`Updated main sidebar to include ${repoSlug}`);
//         }
//       }
//     } catch (error) {
//       console.error(`Error updating main sidebar for ${repoSlug}:`, error);
//     }
//   }