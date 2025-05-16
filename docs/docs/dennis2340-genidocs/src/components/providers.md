---
id: src-components-providers
title: "Providers.tsx"
sidebar_position: 2
---

# Providers.tsx

## Overview

This React TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### Providers

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```react typescript
'use client';

import { SessionProvider } from 'next-auth/react';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
} 
...
```