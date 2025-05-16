---
id: docs-scripts-organize
title: "organize.js"
sidebar_position: 2
---

# organize.js

## Overview

This JavaScript file contains code that couldn't be fully documented automatically.

## Available Functions

### organizeDocumentation

This function appears in the codebase but could not be automatically documented.

### getAllMarkdownFiles

This function appears in the codebase but could not be automatically documented.

### groupFilesByDirectory

This function appears in the codebase but could not be automatically documented.

### createDirectoryStructure

This function appears in the codebase but could not be automatically documented.

### generateIndexFiles

This function appears in the codebase but could not be automatically documented.

### generateSidebarConfig

This function appears in the codebase but could not be automatically documented.

### buildSidebarConfig

This function appears in the codebase but could not be automatically documented.

### getDirectories

This function appears in the codebase but could not be automatically documented.

### getFileLabel

This function appears in the codebase but could not be automatically documented.

### formatTitle

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```javascript
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
      
...
```