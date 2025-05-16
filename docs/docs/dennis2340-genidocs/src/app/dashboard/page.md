---
id: src-app-dashboard-page
title: "page.tsx"
sidebar_position: 2
---

# page.tsx

## Overview

This React TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### Dashboard

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```react typescript
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/utils/db';
import { authOptions } from '../api/auth/[...nextauth]/route';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect('/auth/signin');
  }

  // Try to find the user, if not found, create a new user record
  let user = await prisma.user.findU
...
```