---
id: src-utils-sanitize
title: "sanitize.ts"
sidebar_position: 2
---

# sanitize.ts

## Overview

This TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### sanitizeFrontMatterValue

This function appears in the codebase but could not be automatically documented.

### sanitizeId

This function appears in the codebase but could not be automatically documented.

### sanitizeFrontMatterValue

This function appears in the codebase but could not be automatically documented.

### sanitizeId

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```typescript
/**
 * Sanitize a string value for use in YAML front matter
 * Escapes special characters that could cause YAML parsing issues
 *
 * @param value The string value to sanitize
 * @returns Sanitized string safe for YAML front matter
 */
export function sanitizeFrontMatterValue(value: string): string {
  if (!value) return "";

  // Escape quotes to prevent YAML parsing issues
  let sanitized = value.replace(/"/g, '\\"');

  // Escape other special characters that might cause issues
  sanitized = s
...
```