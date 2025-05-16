---
id: src-utils-octokit
title: "octokit.ts"
sidebar_position: 2
---

# octokit.ts

## Overview

This TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### getOctokit

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```typescript
import { Octokit } from '@octokit/rest';

// Define a type for the global object to store the Octokit instance
const globalForOctokit = globalThis as unknown as {
  octokit: Octokit | undefined;
};

// Singleton instance of Octokit
let octokitInstance: Octokit | undefined = globalForOctokit.octokit;

// Function to initialize or reuse Octokit with a given access token
export const getOctokit = (accessToken: string): Octokit => {
  // If an instance exists and the token matches, reuse it
  if (oc
...
```