---
id: utils-api
title: "api.js"
sidebar_position: 2
---

# api.js

## Overview

This JavaScript file contains code that couldn't be fully documented automatically.

## Available Functions

### sendToDocumentationServer

This function appears in the codebase but could not be automatically documented.

### shouldDocumentFile

This function appears in the codebase but could not be automatically documented.

### shouldDocumentFile

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```javascript
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Send file changes to the documentation server
 * @param {Object} data - The data containing file changes
 * @param {string} data.owner - Repository owner
 * @param {string} data.repo - Repository name
 * @param {string} data.branch - Branch name
 * @param {Array} data.files - Array of file objects with path, content, and changeType
 * @returns {Promise<Object>} - Response from the documentation server
 */
export as
...
```