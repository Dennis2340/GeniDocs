---
id: src-utils-docusaurus
title: "docusaurus.ts"
sidebar_position: 2
---

# docusaurus.ts

## Overview

This TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### organizeDocusaurusFiles

This function appears in the codebase but could not be automatically documented.

### generateCategoryIndexFiles

This function appears in the codebase but could not be automatically documented.

### generateSidebarConfig

This function appears in the codebase but could not be automatically documented.

### buildSidebarConfig

This function appears in the codebase but could not be automatically documented.

### getDirectories

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```typescript
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
  if (!fs.existsS
...
```