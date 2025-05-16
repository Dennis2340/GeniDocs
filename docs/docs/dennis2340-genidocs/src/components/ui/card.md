---
id: src-components-ui-card
title: "Card.tsx"
sidebar_position: 2
---

# Card.tsx

## Overview

This React TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### Card

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```react typescript
'use client';

import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  footer?: ReactNode;
  noPadding?: boolean;
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  onClick?: () => void;
}

export default function Card({
  children,
  className,
  title,
  description,
  footer,
  noPadding = false,
  variant = 'default',
  onClick,
}: CardProps) {
  const
...
```