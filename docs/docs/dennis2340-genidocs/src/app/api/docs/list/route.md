---
id: src-app-api-docs-list-route
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
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/utils/db";
import fs from "fs";
import path from "path";

interface DocumentedRepository {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  slug: string;
  status: string;
  updatedAt: string;
}

/**
 * API endpoint to list repositories with documentation
 */
export async 
...
```