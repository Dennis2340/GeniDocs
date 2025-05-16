---
id: src-utils-repo
title: "repo.ts"
sidebar_position: 2
---

# repo.ts

## Overview

This TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### fetchRepositoryFiles

This function appears in the codebase but could not be automatically documented.

### fetchFilesFromDir

This function appears in the codebase but could not be automatically documented.

### createDocumentationFiles

This function appears in the codebase but could not be automatically documented.

### createDocusaurusConfig

This function appears in the codebase but could not be automatically documented.

### HomepageHeader

This function appears in the codebase but could not be automatically documented.

### Home

This function appears in the codebase but could not be automatically documented.

### Feature

This function appears in the codebase but could not be automatically documented.

### HomepageFeatures

This function appears in the codebase but could not be automatically documented.

### createDocumentationFiles

This function appears in the codebase but could not be automatically documented.

### createDocusaurusConfig

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```typescript
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
): Promise<Array<{ path: string;
...
```