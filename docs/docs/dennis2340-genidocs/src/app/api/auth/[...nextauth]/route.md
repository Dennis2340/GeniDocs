---
id: src-app-api-auth-nextauth-route
title: "route.ts"
sidebar_position: 2
---

# route.ts

## Overview

This TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### authOptions

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```typescript
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { AuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { prisma } from "@/utils/db";

console.log("Auth setup - environment check:", {
  hasGithubId: !!process.env.GITHUB_ID,
  hasGithubSecret: !!process.env.GITHUB_SECRET,
  hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
  hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
});

export const authOptions: AuthOptions = {
  adapter: PrismaA
...
```