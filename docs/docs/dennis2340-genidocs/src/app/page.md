---
id: src-app-page
title: "page.tsx"
sidebar_position: 2
---

# page.tsx

## Overview

This React TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### Home

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```react typescript
'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signIn } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-6">GeniDocs</h1>
         
...
```