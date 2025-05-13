---
id: "main"
title: "main.go"
sidebar_position: 2
---

# main.go

This file serves as the entry point for a simple web server written in Go. It sets up a basic HTTP server that handles three types of requests: serving static files from a directory, responding to a `/hello` endpoint with a simple message, and processing form submissions at the `/form` endpoint.

## helloHandler

### Purpose
The `helloHandler` function is an HTTP handler that responds to GET requests at the `/hello` endpoint with a simple "hello" message. It ensures that only the correct path and method are processed, returning a 404 error otherwise.

### Parameters
- `w http.ResponseWriter`: The response writer to send data back to the client.
- `r *http.Request`: The incoming HTTP request containing the path and method information.

### Return Values
This function does not return any values. Instead, it writes directly to the `http.ResponseWriter`.

### Usage Example
To test this endpoint, you can use a tool like `curl` or a web browser:
```bash
curl http://localhost:8000/hello
```
Expected output: `hello`

## formHandler

### Purpose
The `formHandler` function handles POST requests to the `/form` endpoint. It parses form data submitted by the client, extracts the `name` and `address` fields, and responds with a confirmation message along with the submitted values. It returns a 404 error for incorrect paths or methods and handles form parsing errors.

### Parameters
- `w http.ResponseWriter`: The response writer to send data back to the client.
- `r *http.Request`: The incoming HTTP request containing form data.

### Return Values
This function does not return any values. It writes the response directly to the `http.ResponseWriter`.

### Usage Example
You can test this endpoint by submitting a form or using a tool like `curl`:
```bash
curl -X POST -F "name=John" -F "address=123 Main St" http://localhost:8000/form
```
Expected output:
```
Form posted correctly
Name=John
Address=123 Main St
```

Alternatively, create an HTML form in the `static` directory (e.g., `index.html`) to interact with this endpoint:
```html
<form action="/form" method="POST">
  <label for="name">Name:</label>
  <input type="text" id="name" name="name" required>
  <label for="address">Address:</label>
  <input type="text" id="address" name="address" required>
  <button type="submit">Submit</button>
</form>
```

## main

### Purpose
The `main` function is the entry point of the application. It sets up the HTTP server, defines routes for handling static files and specific endpoints, and starts the server on port 8000. If the server fails to start, it logs the error and exits.

### Parameters
This function takes no parameters.

### Return Values
This function does not return any values. It runs indefinitely until an error occurs or the program is terminated.

### Usage Example
To run the server, execute the Go program:
```bash
go run main.go
```
The console will display:
```
Starting server at port 8000
```
You can then access the server at `http://localhost:8000` in a web browser or via HTTP clients like `curl`.

## Dependencies
This file relies on the following standard Go packages:
- `fmt`: For formatted I/O operations, used to write responses and log messages.
- `log`: For logging fatal errors if the server fails to start.
- `net/http`: For creating the HTTP server, handling requests, and serving static files.

## Code Snippets

### Route Setup and Server Start
This snippet shows how the server routes are defined and how the server is started:
```go
func main() {
    file_server := http.FileServer(http.Dir("./static")) // point the file server to the static files

    // route handling
    http.Handle("/", file_server)
    http.HandleFunc("/form", formHandler)
    http.HandleFunc("/hello", helloHandler)
    fmt.Printf("Starting server at port 8000\n")

    if err := http.ListenAndServe(":8000", nil); err != nil {
        log.Fatal(err)
    }
}
```

### Serving Static Files
The server serves static files (e.g., HTML, CSS, JS) from the `./static` directory. Ensure you have a `static` folder in the same directory as `main.go` with your static content (like an `index.html` file) to serve it at the root path `/`.

### Testing Endpoints
To interact with the server, ensure it is running and test the endpoints as described in the usage examples for `helloHandler` and `formHandler`. You can also place static files in the `./static` directory to serve them directly via the root path.