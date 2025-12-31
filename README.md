# items

Lightweight, immutable collection manager inspired by NgRx Entity Adapter.

## Features

- ✅ Immutable operations (addOne, setOne, updateOne, removeOne, etc.)
- ✅ Custom ID selection (`selectId`)
- ✅ Optional sorting (`sortComparer`)
- ✅ TypeScript-first with full type safety
- ✅ Zero dependencies
- ✅ Tree-shakeable ESM build

## Installation

```bash
npm install items
```

## Quick Start

```typescript
import { createItems } from 'items'

interface User {
  id: number
  name: string
  age: number
}

// Create collection
const items = createItems<User>()

// Add entities
const withUsers = items.addMany([
  { id: 1, name: 'Alice', age: 25 },
  { id: 2, name: 'Bob', age: 30 }
])

// Query
console.log(withUsers.getAll()) // [{ id: 1, ... }, { id: 2, ... }]
console.log(withUsers.selectById(1)) // { id: 1, name: 'Alice', age: 25 }

// Update
const updated = withUsers.updateOne({ id: 1, changes: { age: 26 } })

// Remove
const removed = updated.removeOne(1)
```

## API Reference

### Factory Function

#### `createItems<T>(options?)`

Creates a new empty `Items` instance.

```typescript
const items = createItems<User>({
  selectId: (user) => user.id,           // default: entity.id
  sortComparer: (a, b) => a.name.localeCompare(b.name) // default: false
})
```

### Constructor

#### `new Items<T>(state, options?)`

Creates an `Items` instance with initial state.

```typescript
const items = new Items<User>(
  {
    ids: [1, 2],
    entities: {
      1: { id: 1, name: 'Alice' },
      2: { id: 2, name: 'Bob' }
    }
  },
  { selectId: (user) => user.id }
)
```

### Methods

#### Add Operations

- **`addOne(entity)`** – Adds one entity (skips if exists)
- **`addMany(entities)`** – Adds multiple entities (skips duplicates)

```typescript
items.addOne({ id: 1, name: 'Alice' })
items.addMany([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }])
```

#### Set Operations

- **`setOne(entity)`** – Adds or replaces one entity
- **`setMany(entities)`** – Adds or replaces multiple entities
- **`setAll(entities)`** – Replaces entire collection

```typescript
items.setOne({ id: 1, name: 'Alice Updated' })
items.setAll([{ id: 3, name: 'Charlie' }])
```

#### Update Operations

- **`updateOne(update)`** – Partially updates one entity
- **`updateMany(updates)`** – Partially updates multiple entities

```typescript
items.updateOne({ id: 1, changes: { age: 26 } })
items.updateMany([
  { id: 1, changes: { age: 26 } },
  { id: 2, changes: { age: 31 } }
])
```

#### Upsert Operations

- **`upsertOne(entity)`** – Adds or replaces one entity
- **`upsertMany(entities)`** – Adds or replaces multiple entities

```typescript
items.upsertOne({ id: 1, name: 'Alice' })
```

#### Remove Operations

- **`removeOne(id)`** – Removes one entity
- **`removeMany(ids)`** – Removes multiple entities
- **`removeAll()`** – Clears collection

```typescript
items.removeOne(1)
items.removeMany([1, 2])
items.removeAll()
```

#### Selectors

- **`getState()`** – Returns `{ ids, entities }` (immutable copy)
- **`getIds()`** – Returns array of IDs
- **`getEntities()`** – Returns entities record
- **`getAll()`** – Returns array of entities (in ID order)
- **`getTotal()`** – Returns count of entities
- **`selectById(id)`** – Returns entity by ID or `undefined`

```typescript
items.getAll() // [{ id: 1, ... }, { id: 2, ... }]
items.selectById(1) // { id: 1, name: 'Alice' }
items.getTotal() // 2
```

#### Utility

- **`map<U>(fn)`** – Maps over entities

```typescript
items.map((user, id) => user.name) // ['Alice', 'Bob']
```

## Options

### `selectId`

Custom ID selector function. Defaults to `entity.id`.

```typescript
interface Book {
  isbn: string
  title: string
}

const items = createItems<Book>({
  selectId: (book) => book.isbn
})
```

### `sortComparer`

Optional sort function. Set to `false` to disable sorting (default).

```typescript
// Sort by name ascending
const items = createItems<User>({
  sortComparer: (a, b) => a.name.localeCompare(b.name)
})

// Sort by age descending
const items = createItems<User>({
  sortComparer: (a, b) => b.age - a.age
})
```

## Immutability

All operations return a **new** `Items` instance. Original instance is never modified.

```typescript
const items1 = createItems<User>()
const items2 = items1.addOne({ id: 1, name: 'Alice' })

console.log(items1.getTotal()) // 0
console.log(items2.getTotal()) // 1
```

## TypeScript

Full type safety with generics:

```typescript
interface User {
  id: number
  name: string
  age: number
}

const items = createItems<User>()

// ✅ Type-safe
items.addOne({ id: 1, name: 'Alice', age: 25 })

// ❌ Type error
items.addOne({ id: 1, name: 'Alice' }) // Missing 'age'
```

---

## Development

## Skrypty

- `npm test` – uruchamia testy (Vitest)
- `npm run test:watch` – tryb watch
- `npm run build` – typecheck + bundlowanie (tsc + tsdown)
- `npm run typecheck` – sprawdzenie typów TypeScript (tsc, bez emitowania)
- `npm run bundle` – bundlowanie (tsdown → `dist/` + `.d.ts`)
- `npm run lint` – lint (oxlint / oxc)
- `npm run format` – auto-fix (oxlint --fix; w praktyce zastępuje podstawowe formatowanie/naprawy)

## Narzędzia

- TypeScript: `tsconfig.json`
- Vitest: `vitest.config.ts`
- OXC: `oxlint` + `.oxlintrc.json`
- tsdown: `tsdown.config.ts`
