---
id: src-components-layout-pagelayout
title: "PageLayout.tsx"
sidebar_position: 2
---

# PageLayout.tsx

## Overview

This React TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### PageLayout

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```react typescript
'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  showBackButton?: boolean;
  backUrl?: string;
  actions?: ReactNode;
}

export default function PageLayout({
  children,
  title,
  showBackButton = false,
  backUrl = '/dashboard',
  actions,
}: PageLayoutProps) {
  const pathname = usePathname();
  const
...
```