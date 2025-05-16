---
id: start
title: "start.js"
sidebar_position: 2
---

# start.js

## Overview

This JavaScript file contains code that couldn't be fully documented automatically.

## Available Functions



## Source Code Preview

```javascript
/**
 * Custom starter script for the GeniDocs plugin
 * This script sets up a persistent connection for webhooks
 */

import { run } from "probot";
import app from "./index.js";
import dotenv from "dotenv";
import SmeeClient from "smee-client";

// Load environment variables
dotenv.config();

// Set the PORT environment variable to 3002 (or any other available port)
process.env.PORT = process.env.PORT || "3002";

// Get webhook proxy URL from environment
const webhookProxyUrl = process.env.WEBHO
...
```