---
id: "database"
title: "database.go"
sidebar_position: 10
---

# database.go

This file implements a B+ Tree data structure in Go, which is commonly used for database indexing and storage. It provides an efficient way to store, retrieve, insert, and delete key-value pairs with support for on-disk page management. The implementation includes low-level node operations and high-level tree manipulation functions.

## Dependencies

This file uses the following standard Go packages:
- `bytes` - For byte slice comparisons and manipulations.
- `encoding/binary` - For reading and writing binary data in little-endian format.
- `unsafe` - For pointer operations in the test structure.

## Constants and Types

### Constants

| Constant              | Value  | Description                              |
|-----------------------|--------|------------------------------------------|
| `HEADER`             | 4      | Size of the node header in bytes.        |
| `BTREE_PAGE_SIZE`    | 4096   | Size of a single page in bytes.          |
| `BTREE_MAX_KEY_SIZE` | 1000   | Maximum size of a key in bytes.          |
| `BTREE_MAX_VAL_SIZE` | 3000   | Maximum size of a value in bytes.        |
| `BNODE_NODE`         | 1      | Type identifier for internal nodes.      |
| `BNODE_LEAF`         | 2      | Type identifier for leaf nodes.          |

### Types

#### `BNode`

A `BNode` represents a node in the B+ Tree as a slice of bytes. It encapsulates the structure of both internal and leaf nodes.

#### `BTree`

A `BTree` struct represents the B+ Tree itself, with a root pointer and callbacks for page management.

- **Fields**:
  - `root uint64`: Pointer to the root node (a page number).
  - `get func(uint64) []byte`: Callback to retrieve a page by pointer.
  - `new func([]byte) uint64`: Callback to allocate a new page.
  - `del func(uint64)`: Callback to deallocate a page.

## Core Functions

### `assert`

- **Purpose**: A utility function to enforce assertions by panicking if a condition is false.
- **Parameters**:
  - `condition bool`: The condition to check.
- **Return Values**: None.
- **Usage Example**: Used internally to validate conditions like index bounds or page size constraints.

```go
assert(idx < node.nkeys())
```

### `BNode` Methods

#### `btype() uint16`

- **Purpose**: Retrieves the type of the node (internal or leaf).
- **Parameters**: None.
- **Return Values**:
  - `uint16`: The node type (`BNODE_NODE` or `BNODE_LEAF`).

#### `nkeys() uint16`

- **Purpose**: Returns the number of keys in the node.
- **Parameters**: None.
- **Return Values**:
  - `uint16`: Number of keys.

#### `setHeader(btype uint16, nkeys uint16)`

- **Purpose**: Sets the header of the node with type and number of keys.
- **Parameters**:
  - `btype uint16`: Node type.
  - `nkeys uint16`: Number of keys.
- **Return Values**: None.

#### `getPtr(idx uint16) uint64`

- **Purpose**: Gets the pointer to a child node at the specified index.
- **Parameters**:
  - `idx uint16`: Index of the pointer.
- **Return Values**:
  - `uint64`: Pointer value (page number).

#### `setPtr(idx uint16, val uint64)`

- **Purpose**: Sets the pointer to a child node at the specified index.
- **Parameters**:
  - `idx uint16`: Index of the pointer.
  - `val uint64`: Pointer value to set.
- **Return Values**: None.

#### `getKey(idx uint16) []byte`

- **Purpose**: Retrieves the key at the specified index.
- **Parameters**:
  - `idx uint16`: Index of the key.
- **Return Values**:
  - `[]byte`: The key as a byte slice.

#### `getVal(idx uint16) []byte`

- **Purpose**: Retrieves the value at the specified index (for leaf nodes).
- **Parameters**:
  - `idx uint16`: Index of the value.
- **Return Values**:
  - `[]byte`: The value as a byte slice.

#### `nbytes() uint16`

- **Purpose**: Calculates the total size of the node in bytes.
- **Parameters**: None.
- **Return Values**:
  - `uint16`: Size of the node.

### B+ Tree Operations

#### `BTree.Insert(key []byte, val []byte)`

- **Purpose**: Inserts a new key-value pair into the tree or updates an existing key. If the tree is empty, it creates a new root node.
- **Parameters**:
  - `key []byte`: The key to insert.
  - `val []byte`: The value associated with the key.
- **Return Values**: None.
- **Usage Example**:

```go
tree := &BTree{
    get: func(ptr uint64) []byte { /* implementation */ return nil },
    new: func(node []byte) uint64 { /* implementation */ return 0 },
    del: func(ptr uint64) { /* implementation */ },
}
tree.Insert([]byte("key1"), []byte("value1"))
```

#### `BTree.Delete(key []byte) bool`

- **Purpose**: Deletes a key from the tree and returns whether the key was found and deleted.
- **Parameters**:
  - `key []byte`: The key to delete.
- **Return Values**:
  - `bool`: `true` if the key was found and deleted, `false` otherwise.
- **Usage Example**:

```go
if tree.Delete([]byte("key1")) {
    fmt.Println("Key deleted successfully")
} else {
    fmt.Println("Key not found")
}
```

### Node Manipulation Functions

#### `nodeLookUpLE(node BNode, key []byte) uint16`

- **Purpose**: Finds the index of the first key less than or equal to the given key in the node.
- **Parameters**:
  - `node BNode`: The node to search in.
  - `key []byte`: The key to look up.
- **Return Values**:
  - `uint16`: Index of the key or the position where it should be inserted.

#### `leafInsert(new BNode, old BNode, idx uint16, key []byte, val []byte)`

- **Purpose**: Inserts a key-value pair into a leaf node at the specified index.
- **Parameters**:
  - `new BNode`: The new node to write to.
  - `old BNode`: The original node to copy from.
  - `idx uint16`: Index to insert at.
  - `key []byte`: Key to insert.
  - `val []byte`: Value to insert.
- **Return Values**: None.

#### `nodeSplit3(old BNode) (uint16, [3]BNode)`

- **Purpose**: Splits an oversized node into up to 3 smaller nodes to fit within page size limits.
- **Parameters**:
  - `old BNode`: The node to split.
- **Return Values**:
  - `uint16`: Number of resulting nodes (1, 2, or 3).
  - `[3]BNode`: Array of resulting nodes.

#### `treeInsert(tree *BTree, node BNode, key []byte, val []byte) BNode`

- **Purpose**: Recursively inserts a key-value pair into the tree, handling splits if necessary.
- **Parameters**:
  - `tree *BTree`: Pointer to the B+ Tree.
  - `node BNode`: Current node to insert into.
  - `key []byte`: Key to insert.
  - `val []byte`: Value to insert.
- **Return Values**:
  - `BNode`: The updated node (may be oversized).

#### `treeDelete(tree *BTree, node BNode, key []byte) BNode`

- **Purpose**: Recursively deletes a key from the tree, handling merges if necessary.
- **Parameters**:
  - `tree *BTree`: Pointer to the B+ Tree.
  - `node BNode`: Current node to delete from.
  - `key []byte`: Key to delete.
- **Return Values**:
  - `BNode`: The updated node, or empty if key not found.

## Testing Structure

### `C` Struct and Methods

#### `newC() *C`

- **Purpose**: Creates a new in-memory B+ Tree for testing purposes with mock page management.
- **Parameters**: None.
- **Return Values**:
  - `*C`: Pointer to a new `C` struct with an initialized `BTree`.

#### `C.add(key string, val string)`

- **Purpose**: Adds a key-value pair to the test tree and reference map.
- **Parameters**:
  - `key string`: Key to insert.
  - `val string`: Value to insert.
- **Return Values**: None.
- **Usage Example**:

```go
c := newC()
c.add("key1", "value1")
```

## Usage Notes

This B+ Tree implementation is designed for database-like storage systems. Users must provide page management callbacks (`get`, `new`, `del`) to handle on-disk storage. The tree supports dynamic growth and shrinkage through node splitting and merging, ensuring efficient storage and retrieval of key-value pairs. The test structure `C` can be used to simulate and verify the behavior of the tree in memory before integrating with actual storage systems.