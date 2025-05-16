---
id: src-components-ui-button
title: "Button.tsx"
sidebar_position: 2
---

# Button.tsx

## Overview

This React TypeScript file contains code that couldn't be fully documented automatically.

## Available Functions

### Button

This function appears in the codebase but could not be automatically documented.



## Source Code Preview

```react typescript
'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import { theme } from '@/styles/theme';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export default function Button({
  children,
  varian
...
```