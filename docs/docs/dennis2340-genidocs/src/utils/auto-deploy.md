---
id: src-utils-auto-deploy
title: "auto-deploy.ts"
sidebar_position: 2
---

# auto-deploy.ts

## Overview

This TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### log

This function appears in the codebase but could not be automatically documented.

### executeCommand

This function appears in the codebase but could not be automatically documented.

### autoDeploy

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```typescript
/**
 * Auto-Deploy Documentation Utility
 * 
 * This utility is called automatically after documentation generation
 * to deploy the Docusaurus documentation.
 */

import { exec, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

// Configuration
const DOCS_DIR = path.join(process.cwd(), 'docs');
const LOG_FILE = path.join(process.cwd(), 'docs-deploy.log');
const IS_PRODUCTION = p
...
```