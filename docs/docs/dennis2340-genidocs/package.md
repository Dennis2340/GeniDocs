---
id: package
title: "package.json"
sidebar_position: 10
---

# package.json

## Overview

This JSON file contains code that couldn't be fully documented automatically.

## Available Functions



## Source Code Preview

```json
{
  "name": "doc-builder",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "docs:start": "cd docs && npm start",
    "docs:start:ps": "powershell -Command \"Set-Location -Path docs; npm start\"",
    "docs:build": "cd docs && npm run build",
    "docs:serve": "cd docs && npm run serve",
    "docs:build-and-serve": "cd docs && npm run build && npm run serve",
    "docs:dep
...
```