---
id: src-app-dashboard-repository-repoid-page
title: "page.tsx"
sidebar_position: 2
---

# page.tsx

## Overview

This React TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### RepositoryDetails

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```react typescript
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/utils/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import GitHubPluginInstaller from '@/components/GitHubPluginInstaller';

export default async function RepositoryDetails({ params }: { params: Promise<{ repoId: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
   
...
```