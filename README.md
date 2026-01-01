# items

Lightweight, immutable collection manager inspired by NgRx Entity Adapter.

## Features

- ✅ Immutable operations (insert/insertMany, upsert/upsertMany, set/setMany, update, remove/removeMany, filter, etc.)
- ✅ Single entity and batch operations
- ✅ Custom ID selection (`selectId`)
- ✅ Optional sorting (`sortComparer`)
- ✅ TypeScript-first with full type safety
- ✅ Zero dependencies
- ✅ Tree-shakeable ESM build
- ✅ Flexible selectors (ID, array of IDs, or predicate function)
- ✅ Built-in pagination support
- ✅ Diff detection between collections
- ✅ `every()` and `some()` collection validators

## Installation

```bash
npm install @wszerad/items
```

## Quick Start

```typescript
import { Items } from 'items'

interface User {
  id: number
  name: string
  age: number
}

// Create collection
const items = new Items<number, User>()

// Add single entity
const withUser = items.insert({ id: 1, name: 'Alice', age: 25 })

// Add multiple entities (batch operation)
const withUsers = items.insertMany([
  { id: 1, name: 'Alice', age: 25 },
  { id: 2, name: 'Bob', age: 30 }
])

// Query
console.log(withUsers.getIds()) // [1, 2]
console.log(withUsers.select(1)) // { id: 1, name: 'Alice', age: 25 }
console.log(withUsers.length) // 2

// Update
const updated = withUsers.update(1, { age: 26 })

// Remove
const removed = updated.remove(1)
```

## API Reference

### Constructor

#### `new Items<I, E>(items?, options?)`

Creates an `Items` instance with optional initial items and options.

```typescript
// Empty collection
const items = new Items<number, User>()

// With initial items
const items = new Items<number, User>([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
])

// With options
const items = new Items<number, User>([], {
  selectId: (user) => user.id,           // default: entity.id
  sortComparer: (a, b) => a.name.localeCompare(b.name) // default: false
})
```

### Properties

- **`length`** – Number of entities in the collection

```typescript
items.length // 2
```

### Methods

#### Insert Operations

- **`insert(entity)`** – Adds a single entity (skips if already exists)
- **`insertMany(entities)`** – Adds multiple entities (skips duplicates). Accepts an `Iterable<E>` (array, Set, etc.)

```typescript
// Insert single entity
items.insert({ id: 1, name: 'Alice' })

// Insert multiple entities
items.insertMany([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
])

// Insert from Set
const usersSet = new Set([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
])
items.insertMany(usersSet)

// Skips duplicates - won't replace existing entity with id: 1
items.insert({ id: 1, name: 'Alice Updated' }) // Original stays
```

#### Upsert Operations

- **`upsert(entity)`** – Adds or **merges** a single entity (extends existing properties)
- **`upsertMany(entities)`** – Adds or **merges** multiple entities. Accepts an `Iterable<E>` (array, Set, etc.)

**Note:** `upsert` merges/extends properties with existing entities, similar to `Object.assign()` or spread operator behavior.

```typescript
// Upsert single entity
items.upsert({ id: 1, name: 'Alice' })

// Upsert existing entity - MERGES properties
const items = new Items([{ id: 1, name: 'Alice', age: 25 }])
const updated = items.upsert({ id: 1, name: 'Alice Updated' })
// Result: { id: 1, name: 'Alice Updated', age: 25 }
// Note: age is preserved!

// Upsert multiple entities
items.upsertMany([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
])

// Adding new properties
const items = new Items([{ id: 1, name: 'Alice' }])
const updated = items.upsert({ id: 1, age: 25 })
// Result: { id: 1, name: 'Alice', age: 25 }
// Note: name is preserved, age is added
```

#### Set Operations

- **`set(entity)`** – Adds or **completely replaces** a single entity
- **`setMany(entities)`** – Adds or **completely replaces** multiple entities. Accepts an `Iterable<E>` (array, Set, etc.)

**Note:** `set` completely replaces existing entities, removing any properties not in the new entity.

```typescript
// Set single entity
items.set({ id: 1, name: 'Alice' })

// Set existing entity - REPLACES completely
const items = new Items([{ id: 1, name: 'Alice', age: 25 }])
const updated = items.set({ id: 1, name: 'Alice Updated' })
// Result: { id: 1, name: 'Alice Updated' }
// Note: age is removed!

// Set multiple entities
items.setMany([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
])
```

#### Update Operations

- **`update(id, updater)`** – Updates a single entity by ID
- **`updateMany(selector, updater)`** – Updates multiple entities matching selector

The updater can be a partial object or a function that returns the updated entity.

```typescript
// Update single entity by ID with partial
items.update(1, { age: 26 })

// Update single entity by ID with function
items.update(1, user => ({ ...user, age: user.age + 1 }))

// Update multiple entities by IDs
items.updateMany([1, 2], { age: 26 })

// Update multiple entities by predicate
items.updateMany(
  user => user.age < 30,
  { age: 26 }
)
```

#### Remove Operations

- **`remove(id)`** – Removes a single entity by ID
- **`removeMany(selector)`** – Removes multiple entities matching selector

```typescript
// Remove single entity by ID
items.remove(1)

// Remove multiple entities by IDs
items.removeMany([1, 2])

// Remove multiple entities by predicate
items.removeMany(user => user.age < 30)
```

- **`clear()`** – Removes all entities

```typescript
items.clear()
```

#### Filter Operations

- **`filter(selector)`** – Returns new collection with only matching entities

```typescript
// Filter by ID
items.filter(1)

// Filter by multiple IDs
items.filter([1, 2])

// Filter by predicate
items.filter(user => user.age >= 30)
```

#### Selectors

- **`getIds()`** – Returns array of IDs
- **`getEntities()`** – Returns Map of entities
- **`select(id)`** – Returns entity by ID or `undefined`

```typescript
items.getIds() // [1, 2]
items.getEntities() // Map { 1 => {...}, 2 => {...} }
items.select(1) // { id: 1, name: 'Alice' }
```

#### Has/Check Operations

- **`has(id)`** – Checks if a single entity exists by ID
- **`hasMany(selector)`** – Checks if entities exist matching selector

```typescript
// Check single entity by ID
items.has(1) // true
items.has(99) // false

// Check multiple IDs (returns true only if ALL exist)
items.hasMany([1, 2]) // true
items.hasMany([1, 99]) // false

// Check by predicate (returns true if ANY matches)
items.hasMany(user => user.age >= 30) // true
items.hasMany(user => user.age >= 100) // false

// Check single ID using array
items.hasMany([1]) // true
```

- **`every(predicate)`** – Returns `true` if ALL entities match the predicate

```typescript
const items = new Items<number, User>([
  { id: 1, name: 'Alice', age: 25 },
  { id: 2, name: 'Bob', age: 30 },
  { id: 3, name: 'Charlie', age: 35 }
])

// Check if all users are adults
items.every(user => user.age >= 18) // true

// Check if all users are seniors
items.every(user => user.age >= 65) // false

// Returns true for empty collection
new Items<number, User>().every(user => false) // true
```

- **`some(predicate)`** – Returns `true` if AT LEAST ONE entity matches the predicate

```typescript
const items = new Items<number, User>([
  { id: 1, name: 'Alice', age: 25 },
  { id: 2, name: 'Bob', age: 30 },
  { id: 3, name: 'Charlie', age: 35 }
])

// Check if any user is under 30
items.some(user => user.age < 30) // true

// Check if any user is named 'Dave'
items.some(user => user.name === 'Dave') // false

// Returns false for empty collection
new Items<number, User>().some(user => true) // false
```

#### Pagination

- **`page(pageNumber, pageSize)`** – Returns paginated results

```typescript
const result = items.page(0, 10)
// {
//   items: [...],
//   page: 0,
//   pageSize: 10,
//   hasNext: true,
//   hasPrevious: false,
//   total: 25,
//   totalPages: 3
// }
```

#### Diff Detection

- **`diff(base)`** – Compares with another collection and returns detailed changes

The diff method returns an object with three arrays:
- `added`: IDs of entities that exist in the new collection but not in the base
- `removed`: IDs of entities that exist in the base but not in the new collection
- `updated`: Array of `ItemDiff` objects containing the ID and detailed property changes

Each change object contains:
- `key`: The property name
- `type`: `'added'`, `'removed'`, or `'changed'`
- `oldValue`: The old value (wrapped in a `DiffHashedObject` with a `value` property)
- `newValue`: The new value (wrapped in a `DiffHashedObject` with a `value` property)

```typescript
// Detect added entities
const base = new Items([{ id: 1, name: 'Alice' }])
const updated = base.insert([{ id: 2, name: 'Bob' }])
const diff = updated.diff(base)
// {
//   added: [2],
//   removed: [],
//   updated: []
// }

// Detect removed entities
const base = new Items([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
])
const updated = base.remove(2)
const diff = updated.diff(base)
// {
//   added: [],
//   removed: [2],
//   updated: []
// }

// Detect property changes
const base = new Items([{ id: 1, name: 'Alice', age: 25 }])
const updated = base.update(1, { age: 26 })
const diff = updated.diff(base)
// {
//   added: [],
//   removed: [],
//   updated: [
//     {
//       id: 1,
//       changes: [
//         { 
//           key: 'age', 
//           type: 'changed', 
//           oldValue: { value: 25, ... }, 
//           newValue: { value: 26, ... }
//         }
//       ]
//     }
//   ]
// }

// Detect property addition
const base = new Items([{ id: 1, name: 'Alice' }])
const updated = base.update(1, { age: 25 })
const diff = updated.diff(base)
// {
//   added: [],
//   removed: [],
//   updated: [
//     {
//       id: 1,
//       changes: [
//         { key: 'age', type: 'added', newValue: { value: 25, ... } }
//       ]
//     }
//   ]
// }

// Detect property removal (using set to replace completely)
const base = new Items([{ id: 1, name: 'Alice', age: 25 }])
const updated = base.set([{ id: 1, name: 'Alice' }])
const diff = updated.diff(base)
// {
//   added: [],
//   removed: [],
//   updated: [
//     {
//       id: 1,
//       changes: [
//         { key: 'age', type: 'removed', oldValue: { value: 25, ... } }
//       ]
//     }
//   ]
// }

// Detect multiple changes at once
const base = new Items([
  { id: 1, name: 'Alice', age: 25 },
  { id: 2, name: 'Bob', age: 30 },
  { id: 3, name: 'Charlie', age: 35 }
])
const updated = base
  .remove(3)                                      // Remove Charlie
  .update(1, { age: 26 })                         // Update Alice's age
  .insert([{ id: 4, name: 'Dave', age: 40 }])     // Add Dave
  
const diff = updated.diff(base)
// {
//   added: [4],
//   removed: [3],
//   updated: [
//     {
//       id: 1,
//       changes: [
//         { 
//           key: 'age', 
//           type: 'changed', 
//           oldValue: { value: 25, ... }, 
//           newValue: { value: 26, ... }
//         }
//       ]
//     }
//   ]
// }

// Working with diff results
const diff = updated.diff(base)

// Access changed values
diff.updated.forEach(item => {
  console.log(`Entity ${item.id} was updated`)
  item.changes.forEach(change => {
    if (change.type === 'changed') {
      console.log(`  ${change.key}: ${change.oldValue?.value} -> ${change.newValue?.value}`)
    } else if (change.type === 'added') {
      console.log(`  ${change.key}: added with value ${change.newValue?.value}`)
    } else if (change.type === 'removed') {
      console.log(`  ${change.key}: removed (was ${change.oldValue?.value})`)
    }
  })
})

// Nested objects are also tracked
interface UserWithAddress {
  id: number
  name: string
  address: { city: string; country: string }
}

const base = new Items<number, UserWithAddress>([
  { id: 1, name: 'Alice', address: { city: 'NYC', country: 'USA' } }
])
const updated = base.update(1, {
  address: { city: 'LA', country: 'USA' }
})
const diff = updated.diff(base)
// Detects changes in nested object properties
```

#### Iteration

Items implements the iterable protocol:

```typescript
for (const user of items) {
  console.log(user.name)
}

// Or use spread
const array = [...items]
```

## Options

### `selectId`

Custom ID selector function. Defaults to `entity.id`.

```typescript
interface Book {
  isbn: string
  title: string
}

const items = new Items<string, Book>([], {
  selectId: (book) => book.isbn
})
```

### `sortComparer`

Optional sort function. Set to `false` to disable sorting (default).

```typescript
// Sort by name ascending
const items = new Items<number, User>([], {
  sortComparer: (a, b) => a.name.localeCompare(b.name)
})

// Sort by age descending
const items = new Items<number, User>([], {
  sortComparer: (a, b) => b.age - a.age
})
```

### Using every() and some()

```typescript
interface Product {
  id: number
  name: string
  price: number
  inStock: boolean
}

const products = new Items<number, Product>([
  { id: 1, name: 'Laptop', price: 999, inStock: true },
  { id: 2, name: 'Mouse', price: 29, inStock: true },
  { id: 3, name: 'Keyboard', price: 79, inStock: false }
])

// Check if all products are in stock
const allInStock = products.every(p => p.inStock) // false

// Check if any product is expensive (over $500)
const hasExpensive = products.some(p => p.price > 500) // true

// Check if all products have names
const allNamed = products.every(p => p.name.length > 0) // true

// Check if any product is cheap (under $30)
const hasCheap = products.some(p => p.price < 30) // true

// Validation example
const validateProducts = (items: Items<number, Product>) => {
  const errors: string[] = []
  
  if (!items.every(p => p.price > 0)) {
    errors.push('All products must have positive prices')
  }
  
  if (!items.every(p => p.name.trim().length > 0)) {
    errors.push('All products must have names')
  }
  
  if (items.some(p => p.price > 10000)) {
    errors.push('Warning: Some products are very expensive')
  }
  
  return errors
}
```

## Selectors

Methods come in two flavors:

### Single Entity Methods
Accept a single ID directly:
- `insert(entity)`, `upsert(entity)`, `set(entity)`
- `update(id, updater)` – `items.update(1, { age: 26 })`
- `remove(id)` – `items.remove(1)`
- `has(id)` – `items.has(1)`

### Batch Methods
Accept a `Selector` parameter that can be:
1. **Array of IDs** – `items.removeMany([1, 2, 3])`
2. **Predicate function** – `items.filter(user => user.age >= 30)`

Methods with `*Many` suffix always operate on multiple entities:
- `insertMany(entities)`, `upsertMany(entities)`, `setMany(entities)`
- `updateMany(selector, updater)`
- `removeMany(selector)`
- `filter(selector)`, `hasMany(selector)`

## Immutability

All operations return a **new** `Items` instance. Original instance is never modified.

```typescript
const items1 = new Items<number, User>()
const items2 = items1.insert({ id: 1, name: 'Alice' })

console.log(items1.length) // 0
console.log(items2.length) // 1
```

## TypeScript

Full type safety with generics:

```typescript
interface User {
  id: number
  name: string
  age: number
}

const items = new Items<number, User>()

// ✅ Type-safe
items.insert({ id: 1, name: 'Alice', age: 25 })

// ❌ Type error
items.insert({ id: 1, name: 'Alice' }) // Missing 'age'
```

## Examples

### Basic CRUD

```typescript
import { Items } from 'items'

interface Todo {
  id: number
  text: string
  completed: boolean
}

let todos = new Items<number, Todo>()

// Add single todo
todos = todos.insert({ id: 1, text: 'Learn Items', completed: false })

// Add multiple todos
todos = todos.insertMany([
  { id: 2, text: 'Build app', completed: false },
  { id: 3, text: 'Deploy', completed: false }
])

// Update (merges with existing)
todos = todos.update(1, { completed: true })

// Filter
const completed = todos.filter(todo => todo.completed)

// Remove
todos = todos.remove(1)
```

### Understanding insert, upsert, set, and update

```typescript
import { Items } from 'items'

interface User {
  id: number
  name: string
  email?: string
  age?: number
}

// Start with a user
let users = new Items<number, User>([
  { id: 1, name: 'Alice', email: 'alice@example.com', age: 25 }
])

// INSERT - only adds if doesn't exist, skips if exists
users = users.insert({ id: 1, name: 'Alice Updated', age: 30 })
// Result: { id: 1, name: 'Alice', email: 'alice@example.com', age: 25 }
// Note: Original entity unchanged because id: 1 already exists

users = users.insert({ id: 2, name: 'Bob' })
// Result: Adds Bob with id: 2 since it doesn't exist

// UPSERT - merges properties (adds new, extends existing)
users = users.upsert({ id: 1, name: 'Alicia', age: 26 })
// Result: { id: 1, name: 'Alicia', email: 'alice@example.com', age: 26 }
// Note: name and age updated, email preserved!

// SET - completely replaces entity
users = users.set({ id: 1, name: 'Alice' })
// Result: { id: 1, name: 'Alice' }
// Note: email and age are removed!

// UPDATE - merges partial update with existing entity
users = users.update(1, { age: 27 })
// Result: { id: 1, name: 'Alice', age: 27 }
// Note: age added, name preserved

// Batch operations with *Many methods
users = users.insertMany([
  { id: 3, name: 'Charlie' },
  { id: 4, name: 'Dave' }
])

users = users.upsertMany([
  { id: 1, age: 28 },
  { id: 3, email: 'charlie@example.com' }
])

users = users.setMany([
  { id: 2, name: 'Robert', age: 35 }
])
```

### Checking Entity Existence

```typescript
interface Product {
  sku: string
  name: string
  price: number
}

const products = new Items<string, Product>([], {
  selectId: (product) => product.sku
})

const updated = products.insert([
  { sku: 'ABC-123', name: 'Widget', price: 19.99 }
])

console.log(updated.select('ABC-123'))
```

### With Sorting

```typescript
const items = new Items<number, User>(
  [
    { id: 3, name: 'Charlie', age: 35 },
    { id: 1, name: 'Alice', age: 25 },
    { id: 2, name: 'Bob', age: 30 }
  ],
  { sortComparer: (a, b) => a.name.localeCompare(b.name) }
)

console.log(items.getIds()) // [1, 2, 3] - sorted by name
```

---

## Development

### Scripts

- `npm test` – runs tests (Vitest)
- `npm run test:watch` – watch mode
- `npm run build` – typecheck + bundling (tsc + tsdown)
- `npm run typecheck` – TypeScript type checking (
