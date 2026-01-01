# items

Lightweight, immutable collection manager inspired by NgRx Entity Adapter.

## Features

- ✅ Immutable operations (insert, upsert, update, remove, filter, etc.)
- ✅ Custom ID selection (`selectId`)
- ✅ Optional sorting (`sortComparer`)
- ✅ TypeScript-first with full type safety
- ✅ Zero dependencies
- ✅ Tree-shakeable ESM build
- ✅ Flexible selectors (ID, array of IDs, or predicate function)
- ✅ Built-in pagination support
- ✅ Diff detection between collections

## Installation

```bash
npm install items
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

// Add entities (skips duplicates)
const withUsers = items.insert(
  { id: 1, name: 'Alice', age: 25 },
  { id: 2, name: 'Bob', age: 30 }
)

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

- **`insert(...entities)`** – Adds entities (skips if already exist)

```typescript
items.insert({ id: 1, name: 'Alice' })
items.insert(
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
)
```

#### Upsert Operations

- **`upsert(...entities)`** – Adds or replaces entities

```typescript
items.upsert({ id: 1, name: 'Alice Updated' })
items.upsert(
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
)
```

#### Update Operations

- **`update(selector, updater)`** – Updates entities matching selector

The updater can be a partial object or a function that returns the updated entity.

```typescript
// Update by ID with partial
items.update(1, { age: 26 })

// Update by ID with function
items.update(1, user => ({ ...user, age: user.age + 1 }))

// Update by multiple IDs
items.update([1, 2], { age: 26 })

// Update by predicate
items.update(
  user => user.age < 30,
  { age: 26 }
)
```

#### Remove Operations

- **`remove(selector)`** – Removes entities matching selector

```typescript
// Remove by ID
items.remove(1)

// Remove by multiple IDs
items.remove([1, 2])

// Remove by predicate
items.remove(user => user.age < 30)
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

- **`has(selector)`** – Checks if entities exist

```typescript
// Check single ID
items.has(1) // true

// Check multiple IDs (returns true only if ALL exist)
items.has([1, 2]) // true

// Check by predicate (returns true if ANY matches)
items.has(user => user.age >= 30) // true
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

- **`diff(base)`** – Compares with another collection

```typescript
const base = new Items([{ id: 1, name: 'Alice' }])
const updated = base.insert({ id: 2, name: 'Bob' })
const diff = updated.diff(base)
// {
//   added: [2],
//   removed: [],
//   updated: []
// }
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

## Selectors

Many methods accept a flexible `Selector` parameter that can be:

1. **Single ID** – `items.update(1, { age: 26 })`
2. **Array of IDs** – `items.remove([1, 2, 3])`
3. **Predicate function** – `items.filter(user => user.age >= 30)`

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

// Add
todos = todos.insert(
  { id: 1, text: 'Learn Items', completed: false },
  { id: 2, text: 'Build app', completed: false }
)

// Update
todos = todos.update(1, { completed: true })

// Filter
const completed = todos.filter(todo => todo.completed)

// Remove
todos = todos.remove(1)
```

### With Custom ID

```typescript
interface Product {
  sku: string
  name: string
  price: number
}

const products = new Items<string, Product>([], {
  selectId: (product) => product.sku
})

const updated = products.insert(
  { sku: 'ABC-123', name: 'Widget', price: 19.99 }
)

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
- `npm run typecheck` – TypeScript type checking (tsc, no emit)
- `npm run bundle` – bundling (tsdown → `dist/` + `.d.ts`)
- `npm run lint` – lint (oxlint / oxc)
- `npm run format` – auto-fix (oxlint --fix)

### Tools

- TypeScript: `tsconfig.json`
- Vitest: `vitest.config.ts`
- OXC: `oxlint` + `.oxlintrc.json`
- tsdown: `tsdown.config.ts`

