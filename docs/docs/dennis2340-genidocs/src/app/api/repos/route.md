---
id: src-app-api-repos-route
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
import { Octokit } from "@octokit/rest";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No access token" },
        { status: 401 }
      );
    }

    const octokit = new Octokit({
      auth: session.a
...
```