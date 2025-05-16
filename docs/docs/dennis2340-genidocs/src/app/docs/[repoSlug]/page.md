---
id: src-app-docs-reposlug-page
title: "page.tsx"
sidebar_position: 2
---

# page.tsx

## Overview

This React TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### DocusaurusViewerPage

This function appears in the codebase but could not be automatically documented.

### fetchDocumentation

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```react typescript
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';

interface SidebarItem {
  file: string;
  label: string;
}

interface DocConfig {
  exists: boolean;
  files: string[];
  apiPath: stri
...
```