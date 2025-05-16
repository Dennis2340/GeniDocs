---
id: docs-clear-cache
title: "clear-cache.js"
sidebar_position: 2
---

# clear-cache.js

## Overview

This JavaScript file contains code that couldn't be fully documented automatically.

## Available Functions

### deleteFolderRecursive

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```javascript
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
  
...
```