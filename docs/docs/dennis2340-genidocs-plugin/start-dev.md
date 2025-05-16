---
id: start-dev
title: "start-dev.js"
sidebar_position: 2
---

# start-dev.js

## Overview

This JavaScript file contains code that couldn't be fully documented automatically.

## Available Functions



## Source Code Preview

```javascript
/**
 * Development starter script for GeniDocs plugin
 * This script starts both the Smee client and the Probot app
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

// Configuration
const PORT = process.env.PORT || 3002;
const WEBHOOK_PROXY_URL = process.env.WEBHOOK_PROXY_URL;

if (!WEBHOOK_PROXY_URL) {
  console.error('ERROR: WEBHOOK_PROXY_URL is not set in .env file');

...
```