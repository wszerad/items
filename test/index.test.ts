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
      const items = new Items<number, User>()
      expect(items.getIds()).toEqual([])
      expect(items.getEntities()).toEqual(new Map())
      expect(items.length).toBe(0)
    })

    it('creates collection with initial items', () => {
      const users = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]
      const items = new Items<number, User>(users)
      expect(items.getIds()).toEqual([1, 2])
      expect(items.length).toBe(2)
      expect(items.select(1)).toEqual({ id: 1, name: 'Alice' })
    })

    it('uses custom selectId', () => {
      const items = new Items<string, Book>(
        [],
        { selectId: (book) => book.isbn }
      )
      const updated = items.insert({ isbn: '978-0', title: 'Test', year: 2020 })
      expect(updated.getIds()).toEqual(['978-0'])
    })

    it('applies sortComparer on initialization', () => {
      const items = new Items<number, User>(
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
      const items = new Items<number, User>()
      const updated = items.insert({ id: 1, name: 'Alice' })

      expect(updated.getIds()).toEqual([1])
      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice' })
      expect(updated.length).toBe(1)
    })

    it('does not insert duplicate', () => {
      const items = new Items<number, User>([{ id: 1, name: 'Alice' }])
      const updated = items.insert({ id: 1, name: 'Alice Updated' })

      expect(updated.getIds()).toEqual([1])
      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice' })
    })

    it('inserts multiple entities', () => {
      const items = new Items<number, User>()
      const updated = items.insert(
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      )

      expect(updated.getIds()).toEqual([1, 2])
      expect(updated.length).toBe(2)
    })

    it('is immutable', () => {
      const items = new Items<number, User>()
      const updated = items.insert({ id: 1, name: 'Alice' })

      expect(items.getIds()).toEqual([])
      expect(updated.getIds()).toEqual([1])
    })

    it('skips duplicates in batch', () => {
      const items = new Items<number, User>([{ id: 1, name: 'Alice' }])
      const updated = items.insert(
        { id: 1, name: 'Alice Updated' },
        { id: 2, name: 'Bob' }
      )

      expect(updated.getIds()).toEqual([1, 2])
      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice' })
    })
  })

  describe('upsert', () => {
    it('adds new entity', () => {
      const items = new Items<number, User>()
      const updated = items.upsert({ id: 1, name: 'Alice' })

      expect(updated.getIds()).toEqual([1])
      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice' })
    })

    it('replaces existing entity', () => {
      const items = new Items<number, User>([{ id: 1, name: 'Alice', age: 25 }])
      const updated = items.upsert({ id: 1, name: 'Alice Updated' })

      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice Updated' })
    })

    it('upserts multiple entities', () => {
      const items = new Items<number, User>([{ id: 1, name: 'Alice' }])
      const updated = items.upsert(
        { id: 1, name: 'Alice Updated' },
        { id: 2, name: 'Bob' }
      )

      expect(updated.getIds()).toEqual([1, 2])
      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice Updated' })
      expect(updated.select(2)).toEqual({ id: 2, name: 'Bob' })
    })
  })

  describe('has', () => {
    it('checks if entity exists by id', () => {
      const items = new Items<number, User>([{ id: 1, name: 'Alice' }])

      expect(items.has(1)).toBe(true)
      expect(items.has(2)).toBe(false)
    })

    it('checks if all entities exist by ids', () => {
      const items = new Items<number, User>([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])

      expect(items.has([1, 2])).toBe(true)
      expect(items.has([1, 3])).toBe(false)
    })

    it('checks if entity exists by predicate', () => {
      const items = new Items<number, User>([
        { id: 1, name: 'Alice', age: 25 }
      ])

      expect(items.has(user => user.age === 25)).toBe(true)
      expect(items.has(user => user.age === 30)).toBe(false)
    })
  })

  describe('update', () => {
    it('updates entity by id with partial', () => {
      const items = new Items<number, User>([{ id: 1, name: 'Alice', age: 25 }])
      const updated = items.update(1, { age: 26 })

      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice', age: 26 })
    })

    it('updates entity by id with function', () => {
      const items = new Items<number, User>([{ id: 1, name: 'Alice', age: 25 }])
      const updated = items.update(1, user => ({ ...user, age: user.age! + 1 }))

      expect(updated.select(1)).toEqual({ id: 1, name: 'Alice', age: 26 })
    })

    it('updates multiple entities by ids', () => {
      const items = new Items<number, User>([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 }
      ])
      const updated = items.update([1, 2], user => ({ ...user, age: user.age! + 1 }))

      expect(updated.select(1)?.age).toBe(26)
      expect(updated.select(2)?.age).toBe(31)
    })

    it('updates entities by predicate', () => {
      const items = new Items<number, User>([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 }
      ])
      const updated = items.update(
        user => user.age! < 30,
        { age: 26 }
      )

      expect(updated.select(1)?.age).toBe(26)
      expect(updated.select(2)?.age).toBe(30)
    })

    it('partial update preserves other fields', () => {
      const items = new Items<number, User>([{ id: 1, name: 'Alice', age: 25 }])
      const updated = items.update(1, { name: 'Alicia' })

      expect(updated.select(1)).toEqual({ id: 1, name: 'Alicia', age: 25 })
    })
  })

  describe('remove', () => {
    it('removes entity by id', () => {
      const items = new Items<number, User>([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])
      const updated = items.remove(1)

      expect(updated.getIds()).toEqual([2])
      expect(updated.select(1)).toBeUndefined()
      expect(updated.length).toBe(1)
    })

    it('removes multiple entities by ids', () => {
      const items = new Items<number, User>([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ])
      const updated = items.remove([1, 3])

      expect(updated.getIds()).toEqual([2])
      expect(updated.length).toBe(1)
    })

    it('removes entities by predicate', () => {
      const items = new Items<number, User>([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 },
        { id: 3, name: 'Charlie', age: 20 }
      ])
      const updated = items.remove(user => user.age! < 25)

      expect(updated.getIds()).toEqual([1, 2])
    })
  })

  describe('clear', () => {
    it('clears collection', () => {
      const items = new Items<number, User>([
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
    it('filters by id', () => {
      const items = new Items<number, User>([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ])
      const filtered = items.filter(2)

      expect(filtered.getIds()).toEqual([2])
      expect(filtered.length).toBe(1)
    })

    it('filters by ids', () => {
      const items = new Items<number, User>([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ])
      const filtered = items.filter([1, 3])

      expect(filtered.getIds()).toEqual([1, 3])
    })

    it('filters by predicate', () => {
      const items = new Items<number, User>([
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
      const items = new Items<number, User>([{ id: 1, name: 'Alice' }])

      expect(items.select(1)).toEqual({ id: 1, name: 'Alice' })
      expect(items.select(2)).toBeUndefined()
    })
  })

  describe('sortComparer', () => {
    it('sorts by name ascending', () => {
      const items = new Items<number, User>(
        [],
        { sortComparer: (a, b) => a.name.localeCompare(b.name) }
      )
      const updated = items.insert(
        { id: 3, name: 'Charlie' },
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      )

      expect(updated.getIds()).toEqual([1, 2, 3])
    })

    it('sorts by age descending', () => {
      const items = new Items<number, User>(
        [],
        { sortComparer: (a, b) => (b.age ?? 0) - (a.age ?? 0) }
      )
      const updated = items.insert(
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 },
        { id: 3, name: 'Charlie', age: 20 }
      )

      const ages = updated.getIds().map(id => updated.select(id)!.age)
      expect(ages).toEqual([30, 25, 20])
    })

    it('re-sorts after update', () => {
      const items = new Items<number, User>(
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
      const items = new Items<number, User>(
        [],
        { sortComparer: false }
      )
      const updated = items.insert(
        { id: 3, name: 'Charlie' },
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      )

      expect(updated.getIds()).toEqual([3, 1, 2])
    })
  })

  describe('page', () => {
    it('returns first page', () => {
      const items = new Items<number, User>([
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
      const items = new Items<number, User>([
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
      const items = new Items<number, User>([
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
      const base = new Items<number, User>([{ id: 1, name: 'Alice' }])
      const updated = base.insert({ id: 2, name: 'Bob' })
      const diff = updated.diff(base)

      expect(diff.added).toEqual([2])
      expect(diff.removed).toEqual([])
      expect(diff.updated).toEqual([])
    })

    it('detects removed entities', () => {
      const base = new Items<number, User>([
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
      const base = new Items<number, User>([{ id: 1, name: 'Alice', age: 25 }])
      const updated = base.update(1, { age: 26 })
      const diff = updated.diff(base)

      expect(diff.added).toEqual([])
      expect(diff.removed).toEqual([])
      expect(diff.updated.length).toEqual(1)
      expect(diff.updated[0].id).toBe(1)
      expect(diff.updated[0].changes[0].key).toBe('age')
      expect(diff.updated[0].changes[0].type).toBe('changed')
    })
  })

  describe('iteration', () => {
    it('iterates over entities', () => {
      const items = new Items<number, User>([
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
      const items = new Items<number, User>([
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
      const items = new Items<string, Book>(
        [],
        { selectId: (book) => book.isbn }
      )
      const updated = items.insert(
        { isbn: '978-0-1', title: 'Book A', year: 2020 },
        { isbn: '978-0-2', title: 'Book B', year: 2021 }
      )

      expect(updated.getIds()).toEqual(['978-0-1', '978-0-2'])
      expect(updated.select('978-0-1')?.title).toBe('Book A')
    })

    it('sorts books by year', () => {
      const items = new Items<string, Book>(
        [],
        {
          selectId: (book) => book.isbn,
          sortComparer: (a, b) => a.year - b.year
        }
      )
      const updated = items.insert(
        { isbn: '978-0-3', title: 'Book C', year: 2022 },
        { isbn: '978-0-1', title: 'Book A', year: 2020 },
        { isbn: '978-0-2', title: 'Book B', year: 2021 }
      )

      const years = updated.getIds().map(id => updated.select(id)!.year)
      expect(years).toEqual([2020, 2021, 2022])
    })
  })
})

