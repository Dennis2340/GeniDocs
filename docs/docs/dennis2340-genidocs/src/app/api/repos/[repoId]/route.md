---
id: src-app-api-repos-repoid-route
title: "route.ts"
sidebar_position: 2
---

# route.ts

## Overview

This TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### GET

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```typescript
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(
  request: Request,
  { params }: { params: { repoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Not logged in" },
        { status: 401 }
      );
    }

    c
...
```