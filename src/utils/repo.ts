import { getOctokit } from "./octokit";
import { shouldDocumentFile } from "./ai";
import * as fs from "fs";
import * as path from "path";

/**
 * Get all relevant files from a GitHub repository
 * @param accessToken GitHub access token
 * @param owner Repository owner
 * @param repo Repository name
 * @returns Array of file content objects with path and content
 */
export async function fetchRepositoryFiles(
  accessToken: string,
  owner: string,
  repo: string
): Promise<Array<{ path: string; content: string }>> {
  const octokit = getOctokit(accessToken);
  const files: Array<{ path: string; content: string }> = [];

  // Recursively fetch files from repository
  async function fetchFilesFromDir(path = "") {
    try {
      const { data: contents } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });

      const items = Array.isArray(contents) ? contents : [contents];

      for (const item of items) {
        // Skip directories we don't care about
        if (
          item.type === "dir" &&
          !item.path.includes("node_modules") &&
          !item.path.startsWith(".") &&
          !["dist", "build", "out"].includes(item.path)
        ) {
          await fetchFilesFromDir(item.path);
        } else if (item.type === "file" && shouldDocumentFile(item.path)) {
          try {
            // Get file content
            const { data: fileData } = await octokit.rest.repos.getContent({
              owner,
              repo,
              path: item.path,
              mediaType: { format: "raw" },
            });

            // Add to files array if it's a string (content)
            if (typeof fileData === "string") {
              files.push({
                path: item.path,
                content: fileData,
              });
            }
          } catch (error) {
            console.error(`Error fetching content for ${item.path}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching repository contents at ${path}:`, error);
    }
  }

  await fetchFilesFromDir();
  return files;
}

/**
 * Create documentation files
 * @param docsPath The path where documentation should be saved
 * @param repoName Repository name for the folder structure
 * @param files Array of file content objects with path and markdown content
 */
export function createDocumentationFiles(
  docsPath: string,
  repoName: string,
  files: Array<{ path: string; content: string }>
): void {
  // Create the repository documentation directory
  const repoDocsPath = path.join(docsPath, repoName);

  // Create directory if it doesn't exist
  if (!fs.existsSync(repoDocsPath)) {
    fs.mkdirSync(repoDocsPath, { recursive: true });
  }

  // Write each file to the docs folder
  for (const file of files) {
    // Convert file path to a valid filename by replacing slashes with underscores
    const safeFilename = file.path.replace(/\//g, "_");
    const filePath = path.join(repoDocsPath, `${safeFilename}.md`);

    try {
      fs.writeFileSync(filePath, file.content);
    } catch (error) {
      console.error(
        `Error writing documentation file for ${file.path}:`,
        error
      );
    }
  }
}

/**
 * Create a Docusaurus configuration file
 * @param docsPath The root path where documentation is saved
 * @param owner Repository owner
 * @param repo Repository name
 */
export function createDocusaurusConfig(
  docsPath: string,
  owner: string,
  repo: string
): void {
  // Create standard Docusaurus structure
  const blogDir = path.join(docsPath, "blog");
  const docsDir = path.join(docsPath, "docs");
  const srcDir = path.join(docsPath, "src");
  const srcCssDir = path.join(srcDir, "css");
  const srcPagesDir = path.join(srcDir, "pages");
  const staticDir = path.join(docsPath, "static");
  const staticImgDir = path.join(staticDir, "img");

  // Create directories if they don't exist
  [blogDir, docsDir, srcCssDir, srcPagesDir, staticImgDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Create docusaurus.config.js
  const configPath = path.join(docsPath, "docusaurus.config.js");
  if (!fs.existsSync(configPath)) {
    const configContent = `// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const {themes} = require('prism-react-renderer');
const lightTheme = themes.github;
const darkTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: '${repo} Documentation',
  tagline: 'Automatically generated documentation',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://your-docusaurus-site.example.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: '${owner}', // Usually your GitHub org/user name.
  projectName: '${repo}', // Usually your repo name.

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/${owner}/${repo}/tree/main/docs/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/${owner}/${repo}/tree/main/docs/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: '${repo}',
        logo: {
          alt: 'Project Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Docs',
          },
          {to: '/blog', label: 'Blog', position: 'left'},
          {
            href: 'https://github.com/${owner}/${repo}',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Documentation',
                to: '/docs/intro',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/docusaurus',
              },
              {
                label: 'Discord',
                href: 'https://discordapp.com/invite/docusaurus',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/docusaurus',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/${owner}/${repo}',
              },
            ],
          },
        ],
        copyright: \`Copyright © \${new Date().getFullYear()} ${repo} Documentation. Built with Docusaurus.\`,
      },
      prism: {
        theme: lightTheme,
        darkTheme: darkTheme,
        additionalLanguages: ['typescript', 'bash', 'json'],
      },
    }),
};

module.exports = config;
`;

    fs.writeFileSync(configPath, configContent);
  }

  // Create sidebars.js
  const sidebarsPath = path.join(docsPath, "sidebars.js");
  if (!fs.existsSync(sidebarsPath)) {
    const sidebarsContent = `/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [{type: 'autogenerated', dirName: '.'}],

  // But you can create a sidebar manually
  /*
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Tutorial',
      items: ['intro', 'hello'],
    },
  ],
   */
};

module.exports = sidebars;
`;

    fs.writeFileSync(sidebarsPath, sidebarsContent);
  }

  // Create custom.css
  const cssPath = path.join(srcCssDir, "custom.css");
  if (!fs.existsSync(cssPath)) {
    const cssContent = `/**
 * Any CSS included here will be global. The classic template
 * bundles Infima by default. Infima is a CSS framework designed to
 * work well for content-centric websites.
 */

/* You can override the default Infima variables here. */
:root {
  --ifm-color-primary: #2e8555;
  --ifm-color-primary-dark: #29784c;
  --ifm-color-primary-darker: #277148;
  --ifm-color-primary-darkest: #205d3b;
  --ifm-color-primary-light: #33925d;
  --ifm-color-primary-lighter: #359962;
  --ifm-color-primary-lightest: #3cad6e;
  --ifm-code-font-size: 95%;
  --docusaurus-highlighted-code-line-bg: rgba(0, 0, 0, 0.1);
}

/* For readability concerns, you should choose a lighter palette in dark mode. */
[data-theme='dark'] {
  --ifm-color-primary: #25c2a0;
  --ifm-color-primary-dark: #21af90;
  --ifm-color-primary-darker: #1fa588;
  --ifm-color-primary-darkest: #1a8870;
  --ifm-color-primary-light: #29d5b0;
  --ifm-color-primary-lighter: #32d8b4;
  --ifm-color-primary-lightest: #4fddbf;
  --docusaurus-highlighted-code-line-bg: rgba(0, 0, 0, 0.3);
}
`;

    fs.writeFileSync(cssPath, cssContent);
  }

  // Create index.js in src/pages
  const indexPagePath = path.join(srcPagesDir, "index.js");
  if (!fs.existsSync(indexPagePath)) {
    const indexPageContent = `import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            View Documentation
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Documentation for ${repo}">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
`;

    fs.writeFileSync(indexPagePath, indexPageContent);
  }

  // Create index.module.css in src/pages
  const indexCssPath = path.join(srcPagesDir, "index.module.css");
  if (!fs.existsSync(indexCssPath)) {
    const indexCssContent = `/**
 * CSS files with the .module.css suffix will be treated as CSS modules
 * and scoped locally.
 */

.heroBanner {
  padding: 4rem 0;
  text-align: center;
  position: relative;
  overflow: hidden;
}

@media screen and (max-width: 996px) {
  .heroBanner {
    padding: 2rem;
  }
}

.buttons {
  display: flex;
  align-items: center;
  justify-content: center;
}
`;

    fs.writeFileSync(indexCssPath, indexCssContent);
  }

  // Create components directory and HomepageFeatures component
  const componentsDir = path.join(srcDir, "components");
  if (!fs.existsSync(componentsDir)) {
    fs.mkdirSync(componentsDir, { recursive: true });
  }

  const homepageFeaturesPath = path.join(
    componentsDir,
    "HomepageFeatures/index.js"
  );
  const homepageFeaturesDir = path.dirname(homepageFeaturesPath);

  if (!fs.existsSync(homepageFeaturesDir)) {
    fs.mkdirSync(homepageFeaturesDir, { recursive: true });
  }

  if (!fs.existsSync(homepageFeaturesPath)) {
    const homepageFeaturesContent = `import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Easy to Use',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        This documentation was automatically generated to help you understand the codebase quickly.
      </>
    ),
  },
  {
    title: 'Focus on What Matters',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Let the documentation help you focus on your code while we handle explaining it.
      </>
    ),
  },
  {
    title: 'Powered by AI',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        This documentation was generated using AI to analyze the codebase and create helpful explanations.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
`;

    fs.writeFileSync(homepageFeaturesPath, homepageFeaturesContent);
  }

  // Create styles.module.css for HomepageFeatures
  const homepageFeaturesCssPath = path.join(
    homepageFeaturesDir,
    "styles.module.css"
  );
  if (!fs.existsSync(homepageFeaturesCssPath)) {
    const homepageFeaturesCssContent = `.features {
  display: flex;
  align-items: center;
  padding: 2rem 0;
  width: 100%;
}

.featureSvg {
  height: 200px;
  width: 200px;
}
`;

    fs.writeFileSync(homepageFeaturesCssPath, homepageFeaturesCssContent);
  }

  // Create intro.md in docs directory
  const introPath = path.join(docsDir, "intro.md");
  if (!fs.existsSync(introPath)) {
    const introContent = `---
sidebar_position: 1
---

# Introduction

Welcome to the ${repo} documentation. This documentation was automatically generated to help you understand the codebase.

## Getting Started

Browse through the sidebar to explore different parts of the codebase.

## Repository Structure

The repository is organized into various directories, each containing specific functionality.

## Contributing

If you'd like to contribute to this project, please check out the repository on [GitHub](https://github.com/${owner}/${repo}).
`;

    fs.writeFileSync(introPath, introContent);
  }

  // Create sample blog post
  const welcomeBlogPath = path.join(blogDir, "2023-01-01-welcome.md");
  if (!fs.existsSync(welcomeBlogPath)) {
    const welcomeBlogContent = `---
slug: welcome
title: Welcome to the Documentation
authors: [docusaurus]
tags: [documentation, hello]
---

Welcome to the ${repo} documentation site! This blog post marks the creation of the documentation.

The documentation for this project is automatically generated to help developers understand the codebase quickly and efficiently.

## Features

- **Comprehensive Documentation**: Every file in the codebase is documented
- **Easy Navigation**: Browse through the sidebar to find what you need
- **Code Examples**: See examples of how to use different components

We hope this documentation helps you in your journey with ${repo}!
`;

    fs.writeFileSync(welcomeBlogPath, welcomeBlogContent);
  }

  // Create package.json for Docusaurus
  const packageJsonPath = path.join(docsPath, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    const packageJsonContent = `{
  "name": "${repo}-docs",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "docusaurus": "docusaurus",
    "start": "docusaurus start",
    "build": "docusaurus build",
    "swizzle": "docusaurus swizzle",
    "deploy": "docusaurus deploy",
    "clear": "docusaurus clear",
    "serve": "docusaurus serve",
    "write-translations": "docusaurus write-translations",
    "write-heading-ids": "docusaurus write-heading-ids"
  },
  "dependencies": {
    "@docusaurus/core": "3.7.0",
    "@docusaurus/preset-classic": "3.7.0",
    "@mdx-js/react": "^3.0.0",
    "clsx": "^2.0.0",
    "prism-react-renderer": "^2.3.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@docusaurus/module-type-aliases": "3.7.0",
    "@docusaurus/types": "3.7.0"
  },
  "browserslist": {
    "production": [
      ">0.5%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 3 chrome version",
      "last 3 firefox version",
      "last 5 safari version"
    ]
  },
  "engines": {
    "node": ">=18.0"
  }
}`;

    fs.writeFileSync(packageJsonPath, packageJsonContent);
  }

  // Add SVG files to static/img
  const svgFiles = [
    {
      name: "undraw_docusaurus_mountain.svg",
      content:
        '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="500" fill="none" viewBox="0 0 1080 500"><path fill="#2e8555" d="M520 78.5l-147 315h294l-147-315z"/></svg>',
    },
    {
      name: "undraw_docusaurus_tree.svg",
      content:
        '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="500" fill="none" viewBox="0 0 1080 500"><circle cx="540" cy="260" r="130" fill="#2e8555"/></svg>',
    },
    {
      name: "undraw_docusaurus_react.svg",
      content:
        '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="500" fill="none" viewBox="0 0 1080 500"><g fill="#2e8555"><circle cx="540" cy="260" r="70"/><circle cx="540" cy="130" r="30"/><circle cx="670" cy="260" r="30"/><circle cx="410" cy="260" r="30"/><circle cx="470" cy="370" r="30"/><circle cx="610" cy="370" r="30"/></g></svg>',
    },
  ];

  svgFiles.forEach((file) => {
    const filePath = path.join(staticImgDir, file.name);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, file.content);
    }
  });

  // Create favicon and logo
  const faviconPath = path.join(staticImgDir, "favicon.ico");
  if (!fs.existsSync(faviconPath)) {
    // Create a simple 16x16 ICO file (just a placeholder)
    const faviconContent = Buffer.from([
      0, 0, 1, 0, 1, 0, 16, 16, 0, 0, 1, 0, 24, 0, 24, 0, 0, 0, 22, 0, 0, 0, 40,
      0, 0, 0, 16, 0, 0, 0, 32, 0, 0, 0, 1, 0, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 133, 85, 0,
    ]);
    fs.writeFileSync(faviconPath, faviconContent);
  }

  const logoPath = path.join(staticImgDir, "logo.svg");
  if (!fs.existsSync(logoPath)) {
    const logoContent =
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" fill="none" viewBox="0 0 200 200"><rect width="150" height="150" x="25" y="25" fill="#2e8555" rx="20"/><path fill="#fff" d="M75 75h50v50H75z"/></svg>';
    fs.writeFileSync(logoPath, logoContent);
  }

  // Create README.md
  const readmePath = path.join(docsPath, "README.md");
  if (!fs.existsSync(readmePath)) {
    const readmeContent = `# ${repo} Documentation

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

### Installation

\`\`\`
$ npm install
\`\`\`

### Local Development

\`\`\`
$ npm start
\`\`\`

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

\`\`\`
$ npm run build
\`\`\`

This command generates static content into the \`build\` directory and can be served using any static contents hosting service.
`;

    fs.writeFileSync(readmePath, readmeContent);
  }

  console.log(`Docusaurus structure created successfully at ${docsPath}`);
}
