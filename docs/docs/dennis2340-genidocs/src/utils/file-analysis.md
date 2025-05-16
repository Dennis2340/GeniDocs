---
id: src-utils-file-analysis
title: "file-analysis.ts"
sidebar_position: 2
---

# file-analysis.ts

## Overview

This TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### analyzeFileForDocumentation

This function appears in the codebase but could not be automatically documented.

### generateFileDocumentation

This function appears in the codebase but could not be automatically documented.

### isBinaryFile

This function appears in the codebase but could not be automatically documented.

### isMinified

This function appears in the codebase but could not be automatically documented.

### extractImports

This function appears in the codebase but could not be automatically documented.

### extractFunctions

This function appears in the codebase but could not be automatically documented.

### analyzeFileForDocumentation

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```typescript
/**
 * Utility functions for analyzing files and generating documentation
 */

/**
 * Analyze a file to determine if it should be documented and its priority
 * @param fileName The name of the file
 * @param content The content of the file
 * @returns Object with shouldDocument, priority, and reason
 */
export function analyzeFileForDocumentation(fileName: string, content: string): {
  shouldDocument: boolean;
  priority: 'high' | 'medium' | 'low';
  reason: string;
} {
  // Skip binary files an
...
```