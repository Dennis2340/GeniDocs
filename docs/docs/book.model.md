---
id: "book-model"
title: "book.model.go"
sidebar_position: 10
---

# book.model.go

This file defines the `Book` model and associated database operations for a bookstore application in Go. It provides the structure for a book entity and includes functions to create, retrieve, and delete book records from a database using the GORM library.

## Book Struct

### Description
The `Book` struct represents a book entity in the bookstore application. It includes fields for the book's name, author, and publication, along with GORM's default `Model` fields (ID, CreatedAt, UpdatedAt, DeletedAt).

### Fields
| Field         | Type   | Description                          |
|---------------|--------|--------------------------------------|
| `gorm.Model`  | Struct | Embedded struct with default fields (ID, timestamps). |
| `Name`        | string | The title of the book.              |
| `Author`      | string | The author of the book.             |
| `Publication` | string | The publication or publisher of the book. |

## CreateBook Function

### Description
The `CreateBook` method creates a new book record in the database for the given `Book` instance. It associates the book with a new record in the database and returns the created book.

### Parameters
- None (operates on the receiver `Book` struct).

### Return Value
- `*Book`: A pointer to the created `Book` instance with updated fields (e.g., ID, timestamps).

### Usage Example
```go
book := models.Book{
    Name:        "The Go Programming Language",
    Author:      "Alan A. A. Donovan",
    Publication: "Addison-Wesley",
}
createdBook := book.CreateBook()
fmt.Println(createdBook.ID) // Prints the auto-generated ID
```

## GetAllBooks Function

### Description
The `GetAllBooks` function retrieves all book records from the database and returns them as a slice of `Book` structs.

### Parameters
- None

### Return Value
- `[]Book`: A slice of all `Book` structs representing the books in the database.

### Usage Example
```go
books := models.GetAllBooks()
for _, book := range books {
    fmt.Printf("Book: %s by %s\n", book.Name, book.Author)
}
```

## GetBookById Function

### Description
The `GetBookById` function retrieves a single book record from the database by its ID. It returns a pointer to the found `Book` and the GORM database instance for further operations or error checking.

### Parameters
- `Id` (int64): The unique identifier of the book to retrieve.

### Return Values
- `*Book`: A pointer to the `Book` struct representing the found book (empty if not found).
- `*gorm.DB`: The GORM database instance, which can be used to check for errors or record not found.

### Usage Example
```go
book, db := models.GetBookById(1)
if db.RecordNotFound() {
    fmt.Println("Book not found")
} else {
    fmt.Printf("Found book: %s\n", book.Name)
}
```

## DeleteBook Function

### Description
The `DeleteBook` function deletes a book record from the database based on the provided ID. It returns the deleted `Book` struct (note: the returned struct may not contain updated data after deletion).

### Parameters
- `ID` (int64): The unique identifier of the book to delete.

### Return Value
- `Book`: The `Book` struct representing the deleted book (may not reflect the actual deleted data).

### Usage Example
```go
deletedBook := models.DeleteBook(1)
fmt.Printf("Deleted book with ID: %d\n", deletedBook.ID)
```

## Dependencies

This file relies on the following external packages:
- `github.com/jinzhu/gorm`: A popular ORM library for Go, used for database operations.
- `github.com/EmmanuelKeifala/go-practice/bookstore/pkg/config`: A custom package for database configuration and connection.

### Initialization
The `init` function in this file establishes a connection to the database using the `config` package and sets up the schema for the `Book` model with `AutoMigrate`.

```go
func init() {
    config.Connect()
    db = config.GetDB()
    db.AutoMigrate(&Book{})
}
```

## Notes
- Ensure the database connection is properly configured in the `config` package before using these functions.
- Error handling is minimal in this implementation. In a production environment, consider adding explicit error checks using the `gorm.DB` instance where applicable.
- The `DeleteBook` function returns a `Book` struct, but it may not reflect the actual deleted data. Use `gorm.DB` for confirmation of deletion if needed.