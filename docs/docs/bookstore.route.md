---
id: "bookstore-route"
title: "bookstore.route.go"
sidebar_position: 10
---

# bookstore.route.go

This file defines the routing configuration for a bookstore API using the Gorilla Mux router. It maps HTTP endpoints to specific controller functions for handling CRUD operations on book resources.

## RegisterBookStoreRoutes

### Purpose and Description
The `RegisterBookStoreRoutes` function sets up the routing for the bookstore API. It associates specific URL paths and HTTP methods with corresponding controller functions to manage book data. This function is intended to be called during the initialization of the server to configure the routes.

### Parameters
| Name      | Type            | Description                              |
|-----------|-----------------|------------------------------------------|
| `router`  | `*mux.Router`   | A pointer to a Gorilla Mux router instance to which the routes are attached. |

### Return Values
This function does not return any values.

### Usage Example
To use this function, you need to initialize a Gorilla Mux router and pass it to `RegisterBookStoreRoutes` during server setup. Here's an example of how to integrate this into a main application:

```go
package main

import (
    "log"
    "net/http"
    "github.com/EmmanuelKeifala/go-practice/bookstore/routes"
    "github.com/gorilla/mux"
)

func main() {
    router := mux.NewRouter()
    routes.RegisterBookStoreRoutes(router)
    log.Fatal(http.ListenAndServe(":8080", router))
}
```

## Defined Routes
The following routes are configured by `RegisterBookStoreRoutes` for handling book-related operations:

| Endpoint            | HTTP Method | Controller Function         | Description                       |
|---------------------|-------------|-----------------------------|-----------------------------------|
| `/book/`            | `POST`      | `controllers.CreateBook`    | Creates a new book.              |
| `/book/`            | `GET`       | `controllers.GetAllBooks`   | Retrieves a list of all books.   |
| `/book/{bookId}`    | `GET`       | `controllers.GetBookById`   | Retrieves a book by its ID.      |
| `/book/{bookId}`    | `PUT`       | `controllers.UpdateBook`    | Updates a book by its ID.        |
| `/book/{bookId}`    | `DELETE`    | `controllers.DeleteBook`    | Deletes a book by its ID.        |

## Dependencies
This file depends on the following external packages:
- `github.com/gorilla/mux`: A powerful HTTP router and URL matcher for building Go web servers.
- `github.com/EmmanuelKeifala/go-practice/bookstore/pkg/controllers`: A custom package containing the controller functions for handling book-related logic.

## Code Snippet
Below is the complete code for `bookstore.route.go`, which demonstrates how the routes are registered with the Gorilla Mux router:

```go
package routes

import (
    "github.com/EmmanuelKeifala/go-practice/bookstore/pkg/controllers"
    "github.com/gorilla/mux"
)

var RegisterBookStoreRoutes = func(router *mux.Router) {
    router.HandleFunc("/book/", controllers.CreateBook).Methods("POST")
    router.HandleFunc("/book/", controllers.GetAllBooks).Methods("GET")
    router.HandleFunc("/book/{bookId}", controllers.GetBookById).Methods("GET")
    router.HandleFunc("/book/{bookId}", controllers.UpdateBook).Methods("PUT")
    router.HandleFunc("/book/{bookId}", controllers.DeleteBook).Methods("DELETE")
}
```

## Additional Notes
- Ensure that the controller functions (`CreateBook`, `GetAllBooks`, `GetBookById`, `UpdateBook`, `DeleteBook`) are properly defined in the `controllers` package before using these routes.
- The `{bookId}` parameter in the URL path is a dynamic segment that Gorilla Mux will parse and pass to the controller functions as a request parameter.
- This routing setup assumes a RESTful API design, where each endpoint corresponds to a specific CRUD operation on the book resource.