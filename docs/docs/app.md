---
id: "app"
title: "app.go"
sidebar_position: 2
---

# app.go

This file, `app.go`, is part of the `config` package and handles the database connection setup for a Go application using the GORM library. It provides functionality to establish a connection to a MySQL database and retrieve the database instance for use throughout the application.

## Connect

### Purpose
The `Connect` function initializes a connection to a MySQL database using the GORM library. It sets up the global `db` variable with the database connection instance. If the connection fails, the function will panic with the encountered error.

### Parameters
This function does not accept any parameters.

### Return Values
This function does not return any values. It modifies the global `db` variable to store the database connection.

### Usage Example
Typically, you would call `Connect` during the initialization phase of your application to ensure the database connection is established before any database operations are performed.

```go
package main

import (
    "yourapp/config"
)

func main() {
    config.Connect() // Establish database connection
    // Proceed with application logic
}
```

## GetDB

### Purpose
The `GetDB` function provides access to the global database connection instance (`db`) established by the `Connect` function. It is used to retrieve the GORM database object for performing database operations in other parts of the application.

### Parameters
This function does not accept any parameters.

### Return Values
- `*gorm.DB`: Returns the GORM database connection instance, which can be used to perform database operations like querying, inserting, or updating records.

### Usage Example
Use `GetDB` to access the database connection in your application logic, such as in a handler or service layer.

```go
package main

import (
    "yourapp/config"
    "github.com/jinzhu/gorm"
)

func someFunction() {
    db := config.GetDB() // Retrieve the database instance
    var result SomeModel
    db.First(&result) // Perform a database query
}
```

## Dependencies
This file depends on the following external package:
- `github.com/jinzhu/gorm`: A popular ORM library for Go, used for database operations and connection management.

## Code Snippet
Below is the complete content of `app.go` for reference:

```go
package config

import (
    "github.com/jinzhu/gorm"
)

var (
    db *gorm.DB
)

func Connect() {
    d, err := gorm.Open("mysql", "emmanuel:emmanuel/bookstore?charset=utf8&parseTime=True&loc=Local")
    if err != nil {
        panic(err)
    }

    db = d
}

func GetDB() *gorm.DB {
    return db
}
```

## Additional Notes
- Ensure that the MySQL connection string used in `Connect` is updated to match your environment (username, password, database name, etc.).
- It is recommended to call `Connect` early in your application lifecycle to avoid runtime errors due to an uninitialized database connection.
- The global `db` variable means that the database connection is shared across the application. Be cautious of concurrent access and consider using connection pooling or transaction management provided by GORM if needed.