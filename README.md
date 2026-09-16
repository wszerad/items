# @wszerad/items

An immutable collection library for managing entities with built-in selection, filtering, and diffing capabilities.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/@wszerad%2Fitems.svg)](https://badge.fury.io/js/@wszerad%2Fitems)

## Features

- 🔒 **Immutable**: All operations return new instances without mutating the original
- 🎯 **Type-safe**: Full TypeScript support with generic types
- 🔍 **Powerful Selection**: Query and filter items with a fluent API
- 📊 **Diff Tracking**: Compare collections and track changes
- ⚡ **Performance**: Efficient internal storage using Maps
- 🎨 **Flexible**: Custom ID selectors and sorting comparers

## Installation

```bash
npm install @wszerad/items
```

## Quick Start

```typescript
import { Items } from '@wszerad/items'

interface User {
  id: number
  name: string
  age: number
}

// Create a collection
const users = new Items<User>([
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
  { id: 3, name: 'Charlie', age: 35 }
])

// Add items
const updated = users.add([
  { id: 4, name: 'David', age: 40 }
])

// Update items
const older = users.update([1, 2], (user) => ({
  ...user!,
  age: user!.age + 1
}))

// Select and filter - returns array
const adults = users.select((s) => 
  s.filter((user) => user.age >= 30)
    .sort((a, b) => a.age - b.age)
)
console.log(adults) // [{ id: 1, name: 'Alice', age: 30 }, { id: 3, name: 'Charlie', age: 35 }]

// Select single item using at() - returns single item or undefined
const oldestUser = users.select((s) => 
  s.sort((a, b) => b.age - a.age).at(0)
)
console.log(oldestUser) // { id: 3, name: 'Charlie', age: 35 }

// Get IDs instead of items
const adultIds = users.selectId((s) => 
  s.filter((user) => user.age >= 30)
)
console.log(adultIds) // [1, 3]
```

## API Reference

### Items Class

#### Constructor

```typescript
new Items<E>(items?: Iterable<E>, options?: ItemsOptions<E>)
```

**Options:**
- `selectId?: (entity: E) => ItemId` - Custom ID selector (defaults to `entity.id`)
- `sortComparer?: false | ((a: E, b: E) => number)` - Sorting comparator for maintaining order

**Example:**
```typescript
const items = new Items(users, {
  selectId: (user) => user.userId,
  sortComparer: (a, b) => a.name.localeCompare(b.name)
})
```

#### Methods

##### `add(items: Iterable<E>): Items<E>`

Adds new items to the collection. Items with existing IDs are ignored.

```typescript
const updated = users.add([
  { id: 4, name: 'David', age: 40 }
])
```

##### `update(selector: Selector<E>, updater: Updater<E>): Items<E>`

Updates selected items with partial data or a function. Can create new items if using a function updater.

```typescript
// Update with partial data
const updated = users.update(1, { age: 31 })

// Update with function
const updated = users.update([1, 2], (user) => ({
  ...user!,
  age: user!.age + 1
}))

// Update with selector function
const updated = users.update(
  (s) => s.filter((u) => u.age > 25),
  { active: true }
)
```

##### `merge(items: Iterable<E>): Items<E>`

Merges items into the collection. Adds new items and overwrites existing ones.

```typescript
const merged = users.merge([
  { id: 1, name: 'Alice', age: 31 }, // Updates existing
  { id: 5, name: 'Eve', age: 28 }     // Adds new
])
```

##### `remove(selector: Selector<E>): Items<E>`

Removes selected items from the collection.

```typescript
// Remove by ID
const removed = users.remove(1)

// Remove by IDs
const removed = users.remove([1, 2])

// Remove by function
const removed = users.remove((s) => s.filter((u) => u.age < 30))
```

##### `pick(selector: Selector<E>): Items<E>`

Returns a new Items instance containing only the selected items.

```typescript
const picked = users.pick((s) => s.filter((u) => u.age >= 30))
```

##### `select(selector: Selector<E>): E[] | E | undefined`

Selects items and returns them. Returns an array for multiple selections, or a single item (or undefined) when using SingleSelect methods like `at()` or `on()`.

```typescript
// Select by ID - returns single item or undefined
const user = items.select(1)

// Select by IDs - returns array
const users = items.select([1, 2])

// Select with function returning Select - returns array
const adults = items.select((s) => s.filter((u) => u.age >= 30))

// Select with function returning SingleSelect - returns single item or undefined
const firstUser = items.select((s) => s.at(0))
const oldest = items.select((s) => s.sort((a, b) => b.age - a.age).at(0))
```

##### `selectId(selector: Selector<E>): ItemId[] | ItemId | undefined`

Selects item IDs instead of items. Returns an array of IDs for multiple selections, or a single ID (or undefined) when using SingleSelect methods.

```typescript
// Get IDs for filtered items - returns array
const adultIds = items.selectId((s) => s.filter((u) => u.age >= 30))

// Get ID of first item - returns ItemId or undefined
const firstId = items.selectId((s) => s.at(0))

// Get ID of oldest user - returns ItemId or undefined
const oldestId = items.selectId((s) => s.sort((a, b) => b.age - a.age).at(0))
```

##### `extractId(entity: E): ItemId`

Extracts the ID from an entity using the configured ID selector.

```typescript
const user = { id: 5, name: 'Eve', age: 28 }
const id = items.extractId(user) // Returns: 5

// With custom selector
const products = new Items(items, { 
  selectId: (p) => p.sku 
})
const product = { sku: 'ABC123', name: 'Widget' }
const sku = products.extractId(product) // Returns: 'ABC123'
```

##### `clear(): Items<E>`

Returns an empty Items instance with the same options.

```typescript
const empty = users.clear()
```

##### `every(check: (entity: E) => boolean): boolean`

Tests whether all items pass the provided function.

```typescript
const allAdults = users.every((u) => u.age >= 18)
```

##### `some(check: (entity: E) => boolean): boolean`

Tests whether at least one item passes the provided function.

```typescript
const hasSenior = users.some((u) => u.age >= 65)
```

##### `has(id: ItemId): boolean`

Checks if an item with the given ID exists.

```typescript
const exists = users.has(1)
```

##### `get(id: ItemId): E | undefined`

Gets an item by ID.

```typescript
const user = users.get(1)
```

##### `getIds(): ItemId[]`

Returns an array of all item IDs.

```typescript
const ids = users.getIds() // [1, 2, 3]
```

##### `getEntities(): E[]`

Returns an array of all items.

```typescript
const allUsers = users.getEntities()
```

##### `length: number`

Gets the number of items in the collection.

```typescript
console.log(users.length) // 3
```


#### Static Methods

##### `Items.compare<E>(base: Items<E>, to: Items<E>): ItemsDiff`

Compares two Items instances and returns the differences.

```typescript
const before = new Items(users)
const after = before.update(1, { age: 31 })

const diff = Items.compare(before, after)
console.log(diff)
// {
//   added: [],
//   removed: [],
//   updated: [{ id: 1, changes: [...] }]
// }
```

### Select Class

The Select class provides a fluent API for querying and transforming item collections.

#### Methods

##### `take(len: number): Select<E>`

Takes the first `n` items.

```typescript
users.select((s) => s.take(2))
```

##### `skip(len: number): Select<E>`

Skips the first `n` items.

```typescript
users.select((s) => s.skip(1))
```

##### `filter(testFn: (entry: E, id: ItemId, index: number) => boolean): Select<E>`

Filters items based on a predicate function.

```typescript
users.select((s) => s.filter((user, id, index) => user.age > 25))
```

##### `revert(): Select<E>`

Reverses the order of items.

```typescript
users.select((s) => s.revert())
```

##### `sort(sortFn: (a: E, b: E) => number): Select<E>`

Sorts items using a comparator function.

```typescript
users.select((s) => s.sort((a, b) => a.age - b.age))
```

##### `at(index: number): SingleSelect<E>`

Returns a SingleSelect for the item at the given index.

```typescript
const select = new Select(users.getIds(), users)
const single = select.at(0)
```

##### `from(entities: Iterable<E>): Select<E>`

Creates a new Select from the given entities.

```typescript
const select = new Select(users.getIds(), users)
const newSelect = select.from([
  { id: 2, name: 'Bob', age: 25 }
])
```

##### `on(entry: E): SingleSelect<E>`

Creates a SingleSelect for the given entity.

```typescript
const select = new Select(users.getIds(), users)
const single = select.on({ id: 1, name: 'Alice', age: 30 })
```

### Chaining Selectors

Selectors can be chained for powerful queries:

```typescript
const result = users.select((s) => 
  s.filter((u) => u.age >= 25)
    .sort((a, b) => a.age - b.age)
    .skip(1)
    .take(2)
)
```

## Diff Tracking

Track changes between two Items instances:

```typescript
import { Items, itemsDiff } from '@wszerad/items'

const before = new Items([
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 }
])

const after = before
  .update(1, { age: 31 })
  .add([{ id: 3, name: 'Charlie', age: 35 }])
  .remove(2)

const diff = itemsDiff(before, after)
console.log(diff)
// {
//   added: [3],
//   removed: [2],
//   updated: [{ id: 1, changes: [...] }]
// }
```

## Advanced Usage

### Custom ID Selector

Use a custom field as the ID:

```typescript
interface Product {
  sku: string
  name: string
  price: number
}

const products = new Items<Product>(
  [
    { sku: 'ABC123', name: 'Widget', price: 9.99 },
    { sku: 'XYZ789', name: 'Gadget', price: 19.99 }
  ],
  { selectId: (product) => product.sku }
)

const widget = products.get('ABC123')
```

### Automatic Sorting

Keep items sorted automatically:

```typescript
const users = new Items(
  [
    { id: 3, name: 'Charlie', age: 35 },
    { id: 1, name: 'Alice', age: 30 },
    { id: 2, name: 'Bob', age: 25 }
  ],
  {
    sortComparer: (a, b) => a.age - b.age
  }
)

console.log(users.getIds()) // [2, 1, 3] - sorted by age
```

### Complex Updates

Perform complex transformations:

```typescript
// Increment age for all users over 25
const updated = users.update(
  (s) => s.filter((u) => u.age > 25),
  (user) => ({
    ...user!,
    age: user!.age + 1,
    senior: user!.age >= 65
  })
)
```

### Immutability

All operations are immutable:

```typescript
const original = new Items([
  { id: 1, name: 'Alice', age: 30 }
])

const updated = original.update(1, { age: 31 })

console.log(original.get(1)?.age) // 30 - unchanged
console.log(updated.get(1)?.age)  // 31 - new instance
```

### Iteration

Items are iterable:

```typescript
for (const user of users) {
  console.log(user.name)
}

const array = Array.from(users)
const names = [...users].map(u => u.name)
```

### Single Item Selection

The `select()` method automatically returns a single item (or undefined) when using `at()` or `on()` methods:

```typescript
const users = new Items<User>([
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
  { id: 3, name: 'Charlie', age: 35 }
])

// Select by index - returns single User or undefined
const firstUser = users.select((s) => s.at(0))
console.log(firstUser?.name) // 'Alice'

const secondUser = users.select((s) => s.at(1))
console.log(secondUser?.name) // 'Bob'

// Select by ID - returns single User or undefined
const user = users.select(2)
console.log(user?.name) // 'Bob'

// Out of bounds returns undefined
const notFound = users.select((s) => s.at(10))
console.log(notFound) // undefined

// Chain operations before selecting single item
const oldestUser = users.select((s) => 
  s.sort((a, b) => b.age - a.age).at(0)
)
console.log(oldestUser?.name) // 'Charlie' (age 35)

// Get just the ID instead of the full item
const oldestId = users.selectId((s) => 
  s.sort((a, b) => b.age - a.age).at(0)
)
console.log(oldestId) // 3
```

## TypeScript Support

Full TypeScript support with generics:

```typescript
interface User {
  id: number
  name: string
  age: number
}

const users = new Items<User>() // Fully typed

// Type inference works automatically
const names: string[] = users
  .select((s) => s.filter((u) => u.age >= 30))
  .map(u => u.name)
```

## Types

```typescript
type ItemId = string | number

type Selector<E> = 
  | ((selector: BaseSelect<E>) => BaseSelect<E>) 
  | ItemId 
  | Iterable<ItemId>

type Updater<E> = 
  | ((entity: E | undefined) => E)
  | Partial<E>

type ItemsOptions<E> = {
  selectId?: (entity: E) => ItemId
  sortComparer?: false | ((a: E, b: E) => number)
}

interface ItemsDiff {
  added: ItemId[]
  removed: ItemId[]
  updated: ItemDiff[]
}

interface ItemDiff {
  id: ItemId
  changes: any[]
}
```

## License

MIT © Wszerad Martynowski

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Repository

https://github.com/wszerad/items

