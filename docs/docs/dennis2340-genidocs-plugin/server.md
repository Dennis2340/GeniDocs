---
id: server
title: "server.js"
sidebar_position: 2
---

# server.js

## Overview

This JavaScript file contains code that couldn't be fully documented automatically.

## Available Functions



## Source Code Preview

```javascript
/**
 * Custom server for GeniDocs plugin
 * This ensures the app stays running and processes all GitHub events
 */

import { Server, Probot } from 'probot';
import app from './index.js';
import dotenv from 'dotenv';
import SmeeClient from 'smee-client';

// Load environment variables
dotenv.config();

// Configuration
const PORT = process.env.PORT || 3002;
const WEBHOOK_PROXY_URL = process.env.WEBHOOK_PROXY_URL;
const APP_ID = process.env.APP_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
cons
...
```