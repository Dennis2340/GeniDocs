---
id: src-app-layout
title: "layout.tsx"
sidebar_position: 2
---

# layout.tsx

## Overview

This React TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### RootLayout

This function appears in the codebase but could not be automatically documented.

### metadata

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```react typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navigation from "@/components/Navigation";

// Load Inter font with subsets
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Doc Builder",
  description: "AI-powered documentation generator for your codebase",
};

export default function RootLayout
...
```