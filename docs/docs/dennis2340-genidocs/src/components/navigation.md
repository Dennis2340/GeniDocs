---
id: src-components-navigation
title: "Navigation.tsx"
sidebar_position: 2
---

# Navigation.tsx

## Overview

This React TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### Navigation

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```react typescript
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  const isActive = (path: string) => {
    return pathname === path ? 'bg-blue-700' : '';
  };

  return (
    <nav className="bg-blue-600 text-white sha
...
```