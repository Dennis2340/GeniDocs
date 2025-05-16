---
id: src-utils-db
title: "db.ts"
sidebar_position: 2
---

# db.ts

## Overview

This TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### prisma

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

...
```