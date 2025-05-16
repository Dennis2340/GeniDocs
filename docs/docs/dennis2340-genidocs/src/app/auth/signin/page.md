---
id: src-app-auth-signin-page
title: "page.tsx"
sidebar_position: 2
---

# page.tsx

## Overview

This React TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### SignIn

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```react typescript
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';

export default async function SignIn() {
  const session = await getServerSession();
  console.log("session: ", session)
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
       
...
```