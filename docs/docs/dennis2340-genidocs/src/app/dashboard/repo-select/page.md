---
id: src-app-dashboard-repo-select-page
title: "page.tsx"
sidebar_position: 2
---

# page.tsx

## Overview

This React TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### RepoSelect

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```react typescript
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  private: boolean;
  updatedAt: string;
  language: string | null;
  stars: number;
  forks: number;
}

export default function RepoSelect() {
  const { data: session, status } = useSession();
  cons
...
```