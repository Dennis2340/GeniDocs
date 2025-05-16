---
id: src-app-api-repos-repoid-plugin-status-route
title: "route.ts"
sidebar_position: 2
---

# route.ts

## Overview

This TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### POST

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/utils/db";

/**
 * Update the plugin installation status for a repository
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    if (!
...
```