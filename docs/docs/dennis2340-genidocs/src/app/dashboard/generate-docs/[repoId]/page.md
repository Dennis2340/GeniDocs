---
id: src-app-dashboard-generate-docs-repoid-page
title: "page.tsx"
sidebar_position: 2
---

# page.tsx

## Overview

This React TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### GenerateDocs

This function appears in the codebase but could not be automatically documented.

### fetchRepoDetails

This function appears in the codebase but could not be automatically documented.

### generateDocs

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```react typescript
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function GenerateDocs() {
  const params = useParams();
  const repoId = params?.repoId as string;
  const [status, setStatus] = useState('Initializing...');
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [log
...
```