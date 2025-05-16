---
id: docs-cleanup
title: "cleanup.js"
sidebar_position: 2
---

# cleanup.js

## Overview

This JavaScript file contains code that couldn't be fully documented automatically.

## Available Functions



## Source Code Preview

```javascript
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
  fs.unlinkSync(readmeP
...
```