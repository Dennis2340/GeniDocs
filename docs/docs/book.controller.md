---
id: "book-controller"
title: "book.controller.go"
sidebar_position: 10
---

# book.controller.go

This file defines the HTTP handlers (controllers) for managing books in a bookstore application. It provides endpoints for CRUD operations (Create, Read, Update, Delete) on book resources, interacting with the `models` package for database operations and responding with JSON data.

## GetAllBooks

### Purpose
Retrieves a list of all books from the database and returns them as a JSON response.

### Parameters
- `w http.ResponseWriter`: The HTTP response writer to send the response.
- `r *http.Request`: The HTTP request object (not used in this function but required by the handler signature).

### Return Values
- None (writes directly to the HTTP response writer with a JSON array of books).

### Usage Example
Send a GET request to `/books` to retrieve all books. The response will be a JSON array of book objects.

```bash
curl -X GET http://localhost:8080/books
```

**Response Example:**
```json
[
  {
    "id": 1,
    "name": "The Go Programming Language",
    "author": "Alan A. A. Donovan",
    "publication": "Addison-Wesley"
  },
  {
    "id": 2,
    "name": "Learning Go",
    "author": "Jon Bodner",
    "publication": "O'Reilly Media"
  }
]
```

## GetBookById

### Purpose
Retrieves a specific book by its ID from the database and returns it as a JSON response.

### Parameters
- `w http.ResponseWriter`: The HTTP response writer to send the response.
- `r *http.Request`: The HTTP request object containing the book ID in the URL path.

### Return Values
- None (writes directly to the HTTP response writer with a JSON object of the book).

### Usage Example
Send a GET request to `/books/{bookId}` to retrieve a specific book by its ID.

```bash
curl -X GET http://localhost:8080/books/1
```

**Response Example:**
```json
{
  "id": 1,
  "name": "The Go Programming Language",
  "author": "Alan A. A. Donovan",
  "publication": "Addison-Wesley"
}
```

### Code Snippet
```go
func GetBookById(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    bookId := vars["bookId"]
    ID, err := strconv.ParseInt(bookId, 0, 0)
    if err != nil {
        fmt.Printf("error converting: %s\n", err)
    }
    bookDetails, _ := models.GetBookById(ID)
    res, _ := json.Marshal(bookDetails)
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    w.Write(res)
}
```

## CreateBook

### Purpose
Creates a new book in the database based on the JSON data provided in the request body and returns the created book as a JSON response.

### Parameters
- `w http.ResponseWriter`: The HTTP response writer to send the response.
- `r *http.Request`: The HTTP request object containing the book data in the body.

### Return Values
- None (writes directly to the HTTP response writer with a JSON object of the created book).

### Usage Example
Send a POST request to `/books` with a JSON payload to create a new book.

```bash
curl -X POST http://localhost:8080/books -H "Content-Type: application/json" -d '{"name": "Go in Action", "author": "William Kennedy", "publication": "Manning Publications"}'
```

**Response Example:**
```json
{
  "id": 3,
  "name": "Go in Action",
  "author": "William Kennedy",
  "publication": "Manning Publications"
}
```

### Code Snippet
```go
func CreateBook(w http.ResponseWriter, r *http.Request) {
    CreateBook := &models.Book{}
    utils.ParseBody(r, CreateBook)
    b := CreateBook.CreateBook()
    res, _ := json.Marshal(b)
    w.WriteHeader(http.StatusOK)
    w.Write(res)
}
```

## DeleteBook

### Purpose
Deletes a specific book from the database by its ID and returns the deleted book as a JSON response.

### Parameters
- `w http.ResponseWriter`: The HTTP response writer to send the response.
- `r *http.Request`: The HTTP request object containing the book ID in the URL path.

### Return Values
- None (writes directly to the HTTP response writer with a JSON object of the deleted book).

### Usage Example
Send a DELETE request to `/books/{bookId}` to delete a specific book by its ID.

```bash
curl -X DELETE http://localhost:8080/books/1
```

**Response Example:**
```json
{
  "id": 1,
  "name": "The Go Programming Language",
  "author": "Alan A. A. Donovan",
  "publication": "Addison-Wesley"
}
```

## UpdateBook

### Purpose
Updates an existing book in the database with new data provided in the request body and returns the updated book as a JSON response. Only fields provided in the request are updated.

### Parameters
- `w http.ResponseWriter`: The HTTP response writer to send the response.
- `r *http.Request`: The HTTP request object containing the book ID in the URL path and updated data in the body.

### Return Values
- None (writes directly to the HTTP response writer with a JSON object of the updated book).

### Usage Example
Send a PUT request to `/books/{bookId}` with a JSON payload to update a specific book.

```bash
curl -X PUT http://localhost:8080/books/2 -H "Content-Type: application/json" -d '{"name": "Learning Go (Updated Edition)", "author": "Jon Bodner"}'
```

**Response Example:**
```json
{
  "id": 2,
  "name": "Learning Go (Updated Edition)",
  "author": "Jon Bodner",
  "publication": "O'Reilly Media"
}
```

### Code Snippet
```go
func UpdateBook(w http.ResponseWriter, r *http.Request) {
    var updateBook = &models.Book{}
    utils.ParseBody(r, updateBook)
    vars := mux.Vars(r)
    ID, err := strconv.ParseInt(vars["bookId"], 0, 0)
    if err != nil {
        fmt.Printf("Error parsing: %s\n", err)
    }
    bookDetails, db := models.GetBookById(ID)
    if updateBook.Name != "" {
        bookDetails.Name = updateBook.Name
    }
    if updateBook.Author != "" {
        bookDetails.Author = updateBook.Author
    }
    if updateBook.Publication != "" {
        bookDetails.Publication = updateBook.Publication
    }
    db.Save(&bookDetails)
    res, _ := json.Marshal(bookDetails)
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    w.Write(res)
}
```

## Dependencies
This file relies on the following imports:
- `encoding/json`: For encoding data to JSON format for HTTP responses.
- `fmt`: For basic formatting and printing error messages.
- `net/http`: For handling HTTP requests and responses.
- `strconv`: For converting string IDs from URL parameters to integers.
- `github.com/EmmanuelKeifala/go-practice/bookstore/pkg/models`: Custom package for book data models and database operations.
- `github.com/EmmanuelKeifala/go-practice/bookstore/pkg/utils`: Custom utility functions, notably `ParseBody` for parsing JSON request bodies.
- `github.com/gorilla/mux`: For routing HTTP requests and extracting URL parameters.

This controller assumes a RESTful API structure and integrates with a database through the `models` package. Ensure that the database connection and model definitions are properly set up for these handlers to function correctly.