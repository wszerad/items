import { describe, expect, it } from 'vitest'

import { Items } from '../src'

interface User {
  id: number
  name: string
  age?: number
}

interface Book {
  isbn: string
  title: string
  year: number
}

describe('Items', () => {
  describe('initialization', () => {
    it('creates empty collection', () => {
      const items = new Items<User>()
      expect(items.getIds()).toEqual([])
      expect(items.getEntities()).toEqual(new Map())
      expect(items.length).toBe(0)
    })

    it('creates collection with initial items', () => {
      const users = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]
      const items = new Items(users)
      expect(items.getIds()).toEqual([1, 2])
      expect(items.length).toBe(2)
      expect(items.select(1)).toEqual({ id: 1, name: 'Alice' })
    })

    it('uses custom selectId', () => {
      const items = new Items<Book>(
        [],
        { selectId: (book) => book.isbn }
      )
      const updated = items.insert({ isbn: '978-0', title: 'Test', year: 2020 })
      expect(updated.getIds()).toEqual(['978-0'])
    })

    it('applies sortComparer on initialization', () => {
      const items = new Items(
        [
          { id: 2, name: 'Bob' },
          { id: 1, name: 'Alice' }
        ],
        { sortComparer: (a, b) => a.name.localeCompare(b.name) }
      )
      expect(items.getIds()).toEqual([1, 2])
    })
  })

  describe('insert', () => {
    it('inserts single entity', () => {
      const items = new Items<User>()
      const updated = items.insert({ id: 1, name: 'Alice' })

      expect(updated.getIds()).toEqual([1])
      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice' })
      expect(updated.length).toBe(1)
    })

    it('does not insert duplicate', () => {
      const items = new Items([{ id: 1, name: 'Alice' }])
      const updated = items.insert({ id: 1, name: 'Alice Updated' })

      expect(updated.getIds()).toEqual([1])
      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice' })
    })

    it('is immutable', () => {
      const items = new Items<User>()
      const updated = items.insert({ id: 1, name: 'Alice' })

      expect(items.getIds()).toEqual([])
      expect(updated.getIds()).toEqual([1])
    })
  })

  describe('insertMany', () => {
    it('inserts multiple entities', () => {
      const items = new Items<User>()
      const updated = items.insertMany([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])

      expect(updated.getIds()).toEqual([1, 2])
      expect(updated.length).toBe(2)
    })

    it('skips duplicates in batch', () => {
      const items = new Items([{ id: 1, name: 'Alice' }])
      const updated = items.insertMany([
        { id: 1, name: 'Alice Updated' },
        { id: 2, name: 'Bob' }
      ])

      expect(updated.getIds()).toEqual([1, 2])
      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice' })
    })

    it('inserts from iterable (Set)', () => {
      const items = new Items<User>()
      const usersSet = new Set([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])
      const updated = items.insertMany(usersSet)

      expect(updated.getIds()).toEqual([1, 2])
      expect(updated.length).toBe(2)
    })

    it('maintains sort order when inserting', () => {
      const items = new Items<User>(
        [],
        { sortComparer: (a, b) => a.name.localeCompare(b.name) }
      )
      const updated = items.insertMany([
        { id: 3, name: 'Charlie' },
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])

      expect(updated.getIds()).toEqual([1, 2, 3])
    })

    it('inserts into existing sorted collection', () => {
      const items = new Items(
        [{ id: 1, name: 'Alice' }, { id: 3, name: 'Charlie' }],
        { sortComparer: (a, b) => a.name.localeCompare(b.name) }
      )
      const updated = items.insertMany([{ id: 2, name: 'Bob' }])

      expect(updated.getIds()).toEqual([1, 2, 3])
    })
  })

  describe('upsert', () => {
    it('adds new entity', () => {
      const items = new Items<User>()
      const updated = items.upsert({ id: 1, name: 'Alice' })

      expect(updated.getIds()).toEqual([1])
      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice' })
    })

    it('merges with existing entity (extends properties)', () => {
      const items = new Items([{ id: 1, name: 'Alice', age: 25 } as User])
      const updated = items.upsert({ id: 1, name: 'Alice Updated' })

      // upsert merges/extends the entity
      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice Updated', age: 25 })
    })

    it('is immutable', () => {
      const items = new Items([{ id: 1, name: 'Alice' }])
      const updated = items.upsert({ id: 1, name: 'Alice Updated' } as User)

      expect(items.select(1)).toEqual({ id: 1, name: 'Alice' })
      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice Updated' })
    })

    it('adds new property to existing entity', () => {
      const items = new Items([{ id: 1, name: 'Alice' }])
      const updated = items.upsert({ id: 1, age: 25 } as User)

      // Both properties are present
      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice', age: 25 })
    })
  })

  describe('upsertMany', () => {
    it('upserts multiple entities', () => {
      const items = new Items<User>([{ id: 1, name: 'Alice' }])
      const updated = items.upsertMany([
        { id: 1, name: 'Alice Updated', age: 26 },
        { id: 2, name: 'Bob' }
      ])

      expect(updated.getIds()).toEqual([1, 2])
      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice Updated', age: 26 })
      expect(updated.select(2)).toEqual({ id: 2, name: 'Bob' })
    })

    it('upserts from iterable (Set)', () => {
      const items = new Items<User>([{ id: 1, name: 'Alice' }])
      const usersSet = new Set<Partial<User>>([
        { id: 1, name: 'Alice Updated', age: 26 },
        { id: 2, name: 'Bob', age: 30 }
      ])
      const updated = items.upsertMany(usersSet)

      expect(updated.getIds()).toEqual([1, 2])
      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice Updated', age: 26 })
      expect(updated.select(2)).toEqual({ id: 2, name: 'Bob', age: 30 })
    })

    it('maintains sort order when upserting', () => {
      const items = new Items(
        [{ id: 1, name: 'Alice' }, { id: 3, name: 'Charlie' }],
        { sortComparer: (a, b) => a.name.localeCompare(b.name) }
      )
      const updated = items.upsertMany([{ id: 2, name: 'Bob' }])

      expect(updated.getIds()).toEqual([1, 2, 3])
    })

    it('merges properties correctly', () => {
      const items = new Items([{ id: 1, name: 'Alice', age: 25 } as User])
      const updated = items.upsertMany([{ id: 1, age: 26 }])

      // Name is preserved, age is updated
      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice', age: 26 })
    })
  })

  describe('set', () => {
    it('adds new entity', () => {
      const items = new Items<User>()
      const updated = items.set({ id: 1, name: 'Alice' })

      expect(updated.getIds()).toEqual([1])
      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice' })
    })

    it('replaces existing entity completely', () => {
      const items = new Items([{ id: 1, name: 'Alice', age: 25 } as User])
      const updated = items.set({ id: 1, name: 'Alice Updated' })

      // set replaces the entire entity, so age is removed
      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice Updated' })
      expect(updated.select(1)?.age).toBeUndefined()
    })

    it('is immutable', () => {
      const items = new Items([{ id: 1, name: 'Alice', age: 25 } as User])
      const updated = items.set({ id: 1, name: 'Alice Updated' })

      expect(items.select(1)).toEqual({ id: 1, name: 'Alice', age: 25 })
      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice Updated' })
    })

    it('removes properties not in new entity', () => {
      const items = new Items([
        { id: 1, name: 'Alice', age: 25 } as User
      ])
      const updated = items.set({ id: 1, name: 'Alice' })

      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice' })
      expect(updated.select(1)?.age).toBeUndefined()
    })
  })

  describe('setMany', () => {
    it('sets multiple entities', () => {
      const items = new Items([{ id: 1, name: 'Alice', age: 25 } as User])
      const updated = items.setMany([
        { id: 1, name: 'Alice Updated' },
        { id: 2, name: 'Bob' }
      ])

      expect(updated.getIds()).toEqual([1, 2])
      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice Updated' })
      expect(updated.select(2)).toEqual({ id: 2, name: 'Bob' })
    })

    it('sets from iterable (Set)', () => {
      const items = new Items<User>([{ id: 1, name: 'Alice', age: 25 }])
      const usersSet = new Set<User>([
        { id: 1, name: 'Alice Updated' },
        { id: 2, name: 'Bob', age: 30 }
      ])
      const updated = items.setMany(usersSet)

      expect(updated.getIds()).toEqual([1, 2])
      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice Updated' })
      expect(updated.select(1)?.age).toBeUndefined()
      expect(updated.select(2)).toEqual({ id: 2, name: 'Bob', age: 30 })
    })

    it('maintains sort order when setting', () => {
      const items = new Items(
        [{ id: 1, name: 'Alice' }, { id: 3, name: 'Charlie' }],
        { sortComparer: (a, b) => a.name.localeCompare(b.name) }
      )
      const updated = items.setMany([{ id: 2, name: 'Bob' }])

      expect(updated.getIds()).toEqual([1, 2, 3])
    })
  })

  describe('every', () => {
    it('returns true when all entities match condition', () => {
      const items = new Items([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 },
        { id: 3, name: 'Charlie', age: 35 }
      ])

      expect(items.every(user => user.age! >= 20)).toBe(true)
    })

    it('returns false when at least one entity does not match', () => {
      const items = new Items([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 },
        { id: 3, name: 'Charlie', age: 15 }
      ])

      expect(items.every(user => user.age! >= 20)).toBe(false)
    })

    it('returns true for empty collection', () => {
      const items = new Items<User>()

      expect(items.every(user => user.age! >= 20)).toBe(true)
    })

    it('works with name matching', () => {
      const items = new Items([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 }
      ])

      expect(items.every(user => user.name.length > 0)).toBe(true)
      expect(items.every(user => user.name.startsWith('A'))).toBe(false)
    })

    it('checks for optional properties', () => {
      const items = new Items([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 },
        { id: 3, name: 'Charlie', age: 35 }
      ])

      expect(items.every(user => user.age !== undefined)).toBe(true)
    })

    it('returns false when not all have optional property', () => {
      const items = new Items([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie', age: 35 }
      ])

      expect(items.every(user => user.age !== undefined)).toBe(false)
    })
  })

  describe('some', () => {
    it('returns true when at least one entity matches', () => {
      const items = new Items([
        { id: 1, name: 'Alice', age: 15 },
        { id: 2, name: 'Bob', age: 30 },
        { id: 3, name: 'Charlie', age: 35 }
      ])

      expect(items.some(user => user.age! < 20)).toBe(true)
    })

    it('returns false when no entities match', () => {
      const items = new Items([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 },
        { id: 3, name: 'Charlie', age: 35 }
      ])

      expect(items.some(user => user.age! < 20)).toBe(false)
    })

    it('returns false for empty collection', () => {
      const items = new Items<User>()

      expect(items.some(user => user.age! >= 20)).toBe(false)
    })

    it('works with name matching', () => {
      const items = new Items([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 }
      ])

      expect(items.some(user => user.name.startsWith('A'))).toBe(true)
      expect(items.some(user => user.name.startsWith('Z'))).toBe(false)
    })

    it('checks for optional properties', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ])

      expect(items.some(user => user.age !== undefined)).toBe(false)
    })

    it('returns true when at least one has optional property', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob', age: 30 },
        { id: 3, name: 'Charlie' }
      ])

      expect(items.some(user => user.age !== undefined)).toBe(true)
    })

    it('checks complex conditions', () => {
      const items = new Items([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 },
        { id: 3, name: 'Charlie', age: 35 }
      ])

      expect(items.some(user => user.name === 'Bob' && user.age === 30)).toBe(true)
      expect(items.some(user => user.name === 'Bob' && user.age === 25)).toBe(false)
    })
  })

  describe('has', () => {
    it('checks if entity exists by single id', () => {
      const items = new Items([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])

      expect(items.has(1)).toBe(true)
      expect(items.has(2)).toBe(true)
      expect(items.has(3)).toBe(false)
      expect(items.has(99)).toBe(false)
    })

    it('returns false for non-existent id', () => {
      const items = new Items([{ id: 1, name: 'Alice' }])

      expect(items.has(1)).toBe(true)
      expect(items.has(2)).toBe(false)
    })

    it('works with empty collection', () => {
      const items = new Items<User>()

      expect(items.has(1)).toBe(false)
    })
  })

  describe('hasMany', () => {
    it('checks if all entities exist by ids', () => {
      const items = new Items([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])

      expect(items.hasMany([1, 2])).toBe(true)
      expect(items.hasMany([1, 3])).toBe(false)
      expect(items.hasMany([1])).toBe(true)
      expect(items.hasMany([99])).toBe(false)
    })

    it('checks if entity exists by predicate', () => {
      const items = new Items([
        { id: 1, name: 'Alice', age: 25 }
      ])

      expect(items.hasMany(user => user.age === 25)).toBe(true)
      expect(items.hasMany(user => user.age === 30)).toBe(false)
    })

    it('returns false when no entities match predicate', () => {
      const items = new Items([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 }
      ])

      expect(items.hasMany(user => user.age === 35)).toBe(false)
    })

    it('returns true when all ids exist', () => {
      const items = new Items([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ])

      expect(items.hasMany([1, 2, 3])).toBe(true)
    })

    it('works with empty array', () => {
      const items = new Items([
        { id: 1, name: 'Alice' }
      ])

      expect(items.hasMany([])).toBe(false)
    })
  })

  describe('update', () => {
    it('updates entity by id with partial', () => {
      const items = new Items([{ id: 1, name: 'Alice', age: 25 }])
      const updated = items.update(1, { age: 26 })

      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice', age: 26 })
    })

    it('updates entity by id with function', () => {
      const items = new Items([{ id: 1, name: 'Alice', age: 25 }])
      const updated = items.update(1, user => ({ ...user, age: user.age! + 1 }))

      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice', age: 26 })
    })

    it('partial update preserves other fields', () => {
      const items = new Items([{ id: 1, name: 'Alice', age: 25 }])
      const updated = items.update(1, { name: 'Alicia' })

      expect(updated.select(1)).toEqual({ id: 1, name: 'Alicia', age: 25 })
    })

    it('returns same instance if entity does not exist', () => {
      const items = new Items([{ id: 1, name: 'Alice', age: 25 }])
      const updated = items.update(99, { age: 26 })

      expect(updated).toBe(items)
    })
  })

  describe('updateMany', () => {
    it('updates multiple entities by ids', () => {
      const items = new Items([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 }
      ])
      const updated = items.updateMany([1, 2], user => ({ ...user, age: user.age! + 1 }))

      expect(updated.select(1)?.age).toBe(26)
      expect(updated.select(2)?.age).toBe(31)
    })

    it('updates entities by predicate', () => {
      const items = new Items([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 }
      ])
      const updated = items.updateMany(
        user => user.age! < 30,
        { age: 26 }
      )

      expect(updated.select(1)?.age).toBe(26)
      expect(updated.select(2)?.age).toBe(30)
    })

    it('partial update preserves other fields', () => {
      const items = new Items([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 }
      ])
      const updated = items.updateMany([1, 2], { age: 99 })

      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice', age: 99 })
      expect(updated.select(2)).toEqual({ id: 2, name: 'Bob', age: 99 })
    })
  })

  describe('remove', () => {
    it('removes entity by id', () => {
      const items = new Items([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])
      const updated = items.remove(1)

      expect(updated.getIds()).toEqual([2])
      expect(updated.select(1)).toBeUndefined()
      expect(updated.length).toBe(1)
    })

    it('is immutable', () => {
      const items = new Items([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])
      const updated = items.remove(1)

      expect(items.getIds()).toEqual([1, 2])
      expect(updated.getIds()).toEqual([2])
    })

    it('removes non-existent entity without error', () => {
      const items = new Items([
        { id: 1, name: 'Alice' }
      ])
      const updated = items.remove(99)

      expect(updated.getIds()).toEqual([1])
    })
  })

  describe('removeMany', () => {
    it('removes multiple entities by ids', () => {
      const items = new Items([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ])
      const updated = items.removeMany([1, 3])

      expect(updated.getIds()).toEqual([2])
      expect(updated.length).toBe(1)
    })

    it('removes entities by predicate', () => {
      const items = new Items([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 },
        { id: 3, name: 'Charlie', age: 20 }
      ])
      const updated = items.removeMany(user => user.age! < 25)

      expect(updated.getIds()).toEqual([1, 2])
    })
  })

  describe('clear', () => {
    it('clears collection', () => {
      const items = new Items([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])
      const updated = items.clear()

      expect(updated.getIds()).toEqual([])
      expect(updated.getEntities()).toEqual(new Map())
      expect(updated.length).toBe(0)
    })
  })

  describe('filter', () => {
    it('filters by ids', () => {
      const items = new Items([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ])
      const filtered = items.filter([1, 3])

      expect(filtered.getIds()).toEqual([1, 3])
    })

    it('filters by single id in array', () => {
      const items = new Items([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ])
      const filtered = items.filter([2])

      expect(filtered.getIds()).toEqual([2])
      expect(filtered.length).toBe(1)
    })

    it('filters by predicate', () => {
      const items = new Items([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 },
        { id: 3, name: 'Charlie', age: 20 }
      ])
      const filtered = items.filter(user => user.age! >= 25)

      expect(filtered.getIds()).toEqual([1, 2])
    })
  })

  describe('select', () => {
    it('selects entity by id', () => {
      const items = new Items([{ id: 1, name: 'Alice' }])

      expect(items.select(1)).toEqual({ id: 1, name: 'Alice' })
      expect(items.select(2)).toBeUndefined()
    })
  })

  describe('sortComparer', () => {
    it('sorts by name ascending', () => {
      const items = new Items<User>(
        [],
        { sortComparer: (a, b) => a.name.localeCompare(b.name) }
      )
      const updated = items.insertMany([
        { id: 3, name: 'Charlie' },
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])

      expect(updated.getIds()).toEqual([1, 2, 3])
    })

    it('sorts by age descending', () => {
      const items = new Items<User>(
        [],
        { sortComparer: (a, b) => (b.age ?? 0) - (a.age ?? 0) }
      )
      const updated = items.insertMany([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 },
        { id: 3, name: 'Charlie', age: 20 }
      ])

      const ages = updated.getIds().map(id => updated.select(id)!.age)
      expect(ages).toEqual([30, 25, 20])
    })

    it('re-sorts after update', () => {
      const items = new Items(
        [
          { id: 1, name: 'Alice', age: 25 },
          { id: 2, name: 'Bob', age: 30 }
        ],
        { sortComparer: (a, b) => (a.age ?? 0) - (b.age ?? 0) }
      )
      const updated = items.update(1, { age: 35 })

      const ages = updated.getIds().map(id => updated.select(id)!.age)
      expect(ages).toEqual([30, 35])
    })

    it('sortComparer: false disables sorting', () => {
      const items = new Items<User>(
        [],
        { sortComparer: false }
      )
      const updated = items.insertMany([
        { id: 3, name: 'Charlie' },
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])

      expect(updated.getIds()).toEqual([3, 1, 2])
    })
  })

  describe('page', () => {
    it('returns first page', () => {
      const items = new Items([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
        { id: 4, name: 'Dave' },
        { id: 5, name: 'Eve' }
      ])
      const page = items.page(0, 2)

      expect(page.items).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])
      expect(page.page).toBe(0)
      expect(page.pageSize).toBe(2)
      expect(page.hasNext).toBe(true)
      expect(page.hasPrevious).toBe(false)
      expect(page.total).toBe(5)
      expect(page.totalPages).toBe(3)
    })

    it('returns middle page', () => {
      const items = new Items([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
        { id: 4, name: 'Dave' },
        { id: 5, name: 'Eve' }
      ])
      const page = items.page(1, 2)

      expect(page.items).toEqual([
        { id: 3, name: 'Charlie' },
        { id: 4, name: 'Dave' }
      ])
      expect(page.hasNext).toBe(true)
      expect(page.hasPrevious).toBe(true)
    })

    it('returns last page', () => {
      const items = new Items([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ])
      const page = items.page(1, 2)

      expect(page.items).toEqual([{ id: 3, name: 'Charlie' }])
      expect(page.hasNext).toBe(false)
      expect(page.hasPrevious).toBe(true)
    })
  })

  describe('diff', () => {
    it('detects added entities', () => {
      const base = new Items([{ id: 1, name: 'Alice' }])
      const updated = base.insert({ id: 2, name: 'Bob' })
      const diff = updated.diff(base)

      expect(diff.added).toEqual([2])
      expect(diff.removed).toEqual([])
      expect(diff.updated).toEqual([])
    })

    it('detects removed entities', () => {
      const base = new Items([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])
      const updated = base.remove(2)
      const diff = updated.diff(base)

      expect(diff.added).toEqual([])
      expect(diff.removed).toEqual([2])
      expect(diff.updated).toEqual([])
    })

    it('detects updated entities', () => {
      const base = new Items([{ id: 1, name: 'Alice', age: 25 }])
      const updated = base.update(1, { age: 26 })
      const diff = updated.diff(base)

      expect(diff.added).toEqual([])
      expect(diff.removed).toEqual([])
      expect(diff.updated.length).toEqual(1)
      expect(diff.updated[0].id).toBe(1)
      expect(diff.updated[0].changes[0].key).toBe('age')
      expect(diff.updated[0].changes[0].type).toBe('changed')
    })

    it('detects multiple added entities', () => {
      const base = new Items([{ id: 1, name: 'Alice' }])
      const updated = base.insertMany([
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
        { id: 4, name: 'Dave' }
      ])
      const diff = updated.diff(base)

      expect(diff.added).toEqual([2, 3, 4])
      expect(diff.removed).toEqual([])
      expect(diff.updated).toEqual([])
    })

    it('detects multiple removed entities', () => {
      const base = new Items([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
        { id: 4, name: 'Dave' }
      ])
      const updated = base.removeMany([2, 3, 4])
      const diff = updated.diff(base)

      expect(diff.added).toEqual([])
      expect(diff.removed).toEqual([2, 3, 4])
      expect(diff.updated).toEqual([])
    })

    it('detects property addition', () => {
      const base = new Items<User>([{ id: 1, name: 'Alice' }])
      const updated = base.update(1, { age: 25 })
      const diff = updated.diff(base)

      expect(diff.added).toEqual([])
      expect(diff.removed).toEqual([])
      expect(diff.updated.length).toBe(1)
      expect(diff.updated[0].id).toBe(1)

      const ageChange = diff.updated[0].changes.find(c => c.key === 'age')
      expect(ageChange?.type).toBe('added')
      expect(ageChange?.newValue?.value).toBe(25)
    })

    it('detects property removal', () => {
      const base = new Items<User>([{ id: 1, name: 'Alice', age: 25 }])
      const updated = base.set({ id: 1, name: 'Alice' })
      const diff = updated.diff(base)

      expect(diff.added).toEqual([])
      expect(diff.removed).toEqual([])
      expect(diff.updated.length).toBe(1)

      const ageChange = diff.updated[0].changes.find(c => c.key === 'age')
      expect(ageChange?.type).toBe('removed')
      expect(ageChange?.oldValue?.value).toBe(25)
    })

    it('detects property value change', () => {
      const base = new Items([{ id: 1, name: 'Alice', age: 25 }])
      const updated = base.update(1, { name: 'Alicia', age: 26 })
      const diff = updated.diff(base)

      expect(diff.updated.length).toBe(1)
      expect(diff.updated[0].changes.length).toBe(2)

      const nameChange = diff.updated[0].changes.find(c => c.key === 'name')
      expect(nameChange?.type).toBe('changed')
      expect(nameChange?.oldValue?.value).toBe('Alice')
      expect(nameChange?.newValue?.value).toBe('Alicia')

      const ageChange = diff.updated[0].changes.find(c => c.key === 'age')
      expect(ageChange?.type).toBe('changed')
      expect(ageChange?.oldValue?.value).toBe(25)
      expect(ageChange?.newValue?.value).toBe(26)
    })

    it('detects combined add, remove, and update', () => {
      const base = new Items([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 },
        { id: 3, name: 'Charlie', age: 35 }
      ])

      const updated = base
        .remove(3)
        .update(1, { age: 26 })
        .insert({ id: 4, name: 'Dave', age: 40 })

      const diff = updated.diff(base)

      expect(diff.added).toEqual([4])
      expect(diff.removed).toEqual([3])
      expect(diff.updated.length).toBe(1)
      expect(diff.updated[0].id).toBe(1)
    })

    it('detects no changes for identical collections', () => {
      const base = new Items([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 }
      ])
      const updated = new Items([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 }
      ])

      const diff = updated.diff(base)

      expect(diff.added).toEqual([])
      expect(diff.removed).toEqual([])
      expect(diff.updated).toEqual([])
    })

    it('detects changes in nested objects', () => {
      type UserWithAddress = {
        id: number
        name: string
        address: { city: string; country: string }
      }

      const base = new Items<UserWithAddress>([
        { id: 1, name: 'Alice', address: { city: 'NYC', country: 'USA' } }
      ])

      const updated = base.update(1, {
        address: { city: 'LA', country: 'USA' }
      })

      const diff = updated.diff(base)

      expect(diff.updated.length).toBe(1)
      expect(diff.updated[0].id).toBe(1)

      // ohash detects nested changes with multiple change objects for nested properties
      expect(diff.updated[0].changes.length).toBeGreaterThan(0)
    })

    it('handles empty base collection', () => {
      const base = new Items<User>()
      const updated = base.insertMany([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])

      const diff = updated.diff(base)

      expect(diff.added).toEqual([1, 2])
      expect(diff.removed).toEqual([])
      expect(diff.updated).toEqual([])
    })

    it('handles empty updated collection', () => {
      const base = new Items([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])
      const updated = base.clear()

      const diff = updated.diff(base)

      expect(diff.added).toEqual([])
      expect(diff.removed).toEqual([1, 2])
      expect(diff.updated).toEqual([])
    })

    it('detects multiple property changes on multiple entities', () => {
      const base = new Items<User>([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 },
        { id: 3, name: 'Charlie', age: 35 }
      ])

      const updated = base
        .update(1, { age: 26 })
        .update(2, { name: 'Robert', age: 31 })

      const diff = updated.diff(base)

      expect(diff.added).toEqual([])
      expect(diff.removed).toEqual([])
      expect(diff.updated.length).toBe(2)

      const user1Update = diff.updated.find(u => u.id === 1)
      expect(user1Update?.changes.length).toBe(1)
      expect(user1Update?.changes[0].key).toBe('age')

      const user2Update = diff.updated.find(u => u.id === 2)
      expect(user2Update?.changes.length).toBe(2)
    })
  })

  describe('iteration', () => {
    it('iterates over entities', () => {
      const items = new Items([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])
      const names: string[] = []

      for (const user of items) {
        names.push(user.name)
      }

      expect(names).toEqual(['Alice', 'Bob'])
    })

    it('works with spread operator', () => {
      const items = new Items([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])
      const array = [...items]

      expect(array).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])
    })
  })

  describe('custom selectId with Books', () => {
    it('works with string IDs', () => {
      const items = new Items<Book>(
        [],
        { selectId: (book) => book.isbn }
      )
      const updated = items.insertMany([
        { isbn: '978-0-1', title: 'Book A', year: 2020 },
        { isbn: '978-0-2', title: 'Book B', year: 2021 }
      ])

      expect(updated.getIds()).toEqual(['978-0-1', '978-0-2'])
      expect(updated.select('978-0-1')?.title).toBe('Book A')
    })

    it('sorts books by year', () => {
      const items = new Items<Book>(
        [],
        {
          selectId: (book) => book.isbn,
          sortComparer: (a, b) => a.year - b.year
        }
      )
      const updated = items.insertMany([
        { isbn: '978-0-3', title: 'Book C', year: 2022 },
        { isbn: '978-0-1', title: 'Book A', year: 2020 },
        { isbn: '978-0-2', title: 'Book B', year: 2021 }
      ])

      const years = updated.getIds().map(id => updated.select(id)!.year)
      expect(years).toEqual([2020, 2021, 2022])
    })
  })
})

