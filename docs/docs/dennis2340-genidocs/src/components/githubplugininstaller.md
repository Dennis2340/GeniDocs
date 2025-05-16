---
id: src-components-githubplugininstaller
title: "GitHubPluginInstaller.tsx"
sidebar_position: 2
---

# GitHubPluginInstaller.tsx

## Overview

This React TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### GitHubPluginInstaller

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```react typescript
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface GitHubPluginInstallerProps {
  repositoryId: string;
  repositoryFullName: string;
}

export default function GitHubPluginInstaller({ repositoryId, repositoryFullName, repository }: GitHubPluginInstallerProps & { repository?: any }) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(fal
...
```