---
id: src-app-api-docs-repository-route
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
import { User, Repository } from "@prisma/client";

type RepositoryWithSlug = Repository & {
  slug?: string;
  owner?: string;
};

type UserWithOrganization = User & {
  organization: {
    repositories: RepositoryWithSlug[];
  } | null;
};

export async function GET(request: NextRequest
...
```