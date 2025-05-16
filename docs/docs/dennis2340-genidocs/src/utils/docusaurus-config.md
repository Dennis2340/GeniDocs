---
id: src-utils-docusaurus-config
title: "docusaurus-config.ts"
sidebar_position: 2
---

# docusaurus-config.ts

## Overview

This TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### ensureDocusaurusConfig

This function appears in the codebase but could not be automatically documented.

### startDocusaurusServer

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```typescript
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Ensures the Docusaurus configuration is properly set up
 * @param repoSlug The repository slug
 */
export async function ensureDocusaurusConfig(repoSlug: string): Promise<void> {
  try {
    const docsDir = path.join(process.cwd(), 'docs');
    const configPath = path.join(docsDir, 'docusaurus.config.js');
    const sidebarPath = path.j
...
```