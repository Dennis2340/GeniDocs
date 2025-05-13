---
id: "overview"
title: "Overview"
sidebar_position: 2
---

# Go Practice Documentation

Welcome to the **Go Practice** documentation! This repository serves as a collection of projects and exercises to practice and master the Go programming language (Golang). It includes various standalone projects and modules that demonstrate different aspects of Go, such as building RESTful APIs, working with databases, and creating web servers.

Whether you're a beginner looking to learn Go or an experienced developer seeking to refine your skills, this repository provides practical examples and code snippets to help you on your journey.

## Table of Contents

- [Overview](#overview)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Projects](#projects)
  - [Bookstore](#bookstore)
  - [CRUD API](#crud-api)
  - [Go Database](#go-database)
  - [Web Server](#web-server)

## Overview

The **Go Practice** repository is organized into multiple subdirectories, each representing a distinct project or concept in Go. These projects cover a range of topics, including API development, database interactions, and web server implementation. Each directory contains relevant code and documentation to help you understand the specific use case.

## Repository Structure

Below is an overview of the main directories and key files in the repository:

| **Directory**            | **Description**                          | **Key Files**                              |
|--------------------------|------------------------------------------|--------------------------------------------|
| `/bookstore`             | A bookstore application with a modular structure for learning Go web development. | `cmd/main/main.md`, `pkg/config/app.md`, `pkg/controllers/book.controller.md`, `pkg/models/book.model.md`, `pkg/routes/bookstore.route.md`, `pkg/utils/utils.md` |
| `/crud-api`              | A basic CRUD API implementation in Go.   | `main.md`                                 |
| `/go-db`                 | Examples of database operations in Go.   | `database.md`, `database_test.md`         |
| `/web-server`            | A simple web server built with Go.       | `main.md`                                 |
| `/` (root)               | Root directory with general information. | `readme.md`                               |

## Getting Started

To get started with the projects in this repository, follow these general steps. Specific instructions for each project may vary and can be found in the respective directories.

### Prerequisites
- **Go**: Ensure you have Go installed on your system. You can download it from the [official Go website](https://golang.org/dl/).
- **Git**: To clone the repository.
- A code editor or IDE of your choice (e.g., VS Code, GoLand).

### Installation
1. Clone the repository to your local machine:
   ```bash
   git clone https://github.com/yourusername/go-practice.git
   cd go-practice
   ```
2. Navigate to the specific project directory you're interested in (e.g., `bookstore`, `crud-api`, etc.).
3. Follow the instructions in the respective project's documentation or `readme.md` file for setup and running the code.

### Running a Project
Most projects in this repository can be run using the `go run` command. For example, to run the `web-server` project:
```bash
cd web-server
go run main.go
```
Check the specific project documentation for detailed instructions.

## Projects

### Bookstore
A modular Go application simulating a bookstore with features like managing books via a RESTful API. It demonstrates best practices for structuring a Go project with separate packages for configuration, controllers, models, routes, and utilities.

- **Location**: `/bookstore`
- **Key Topics**: REST API, modular design, routing, controllers, models.
- **Documentation**: See `bookstore/cmd/main/main.md` and related files in `bookstore/pkg/`.

### CRUD API
A simple CRUD (Create, Read, Update, Delete) API built in Go to demonstrate basic HTTP server functionality and API design.

- **Location**: `/crud-api`
- **Key Topics**: HTTP handlers, RESTful endpoints.
- **Documentation**: See `crud-api/main.md`.

### Go Database
Examples and tests for working with databases in Go, showcasing how to connect to a database, perform queries, and handle results.

- **Location**: `/go-db`
- **Key Topics**: Database connections, SQL queries, testing.
- **Documentation**: See `go-db/database.md` and `go-db/database_test.md`.

### Web Server
A basic web server implementation in Go to understand how to handle HTTP requests and serve responses.

- **Location**: `/web-server`
- **Key Topics**: HTTP server, routing, request handling.
- **Documentation**: See `web-server/main.md`.

---

Thank you for exploring the **Go Practice** repository! If you have any questions or need further assistance, feel free to open an issue or reach out. Happy coding! 🚀

> **Note**: This documentation is a work in progress. Additional details and tutorials for each project will be added over time.