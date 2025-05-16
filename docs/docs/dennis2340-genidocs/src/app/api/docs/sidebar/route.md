---
id: src-app-api-docs-sidebar-route
title: "route.ts"
sidebar_position: 2
---

# route.ts

## Overview

This TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### GET

This function appears in the codebase but could not be automatically documented.

### generateSidebarFromFiles

This function appears in the codebase but could not be automatically documented.

### getMarkdownFiles

This function appears in the codebase but could not be automatically documented.

### getDirectories

This function appears in the codebase but could not be automatically documented.

### getFileLabel

This function appears in the codebase but could not be automatically documented.

### formatLabel

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/utils/db";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    // Get the session to check if the user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextRespo
...
```