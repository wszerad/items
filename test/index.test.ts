import { describe, expect, it } from 'vitest'

import { Items, createItems, type ItemsState } from '../src'

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

describe('createItems', () => {
  it('creates empty Items instance', () => {
    const items = createItems<User>()
    expect(items.getIds()).toEqual([])
    expect(items.getTotal()).toBe(0)
  })

  it('creates Items with custom selectId', () => {
    const items = createItems<Book>({
      selectId: (book) => book.isbn
    })
    const updated = items.addOne({ isbn: '978-0', title: 'Test', year: 2020 })
    expect(updated.getIds()).toEqual(['978-0'])
  })

  it('creates Items with sortComparer', () => {
    const items = createItems<User>({
      sortComparer: (a, b) => a.name.localeCompare(b.name)
    })
    const updated = items.addMany([
      { id: 2, name: 'Bob' },
      { id: 1, name: 'Alice' }
    ])
    expect(updated.getAll().map(u => u.name)).toEqual(['Alice', 'Bob'])
  })
})

describe('Items', () => {
  describe('initialization', () => {
    it('creates empty collection', () => {
      const items = new Items<User>({ ids: [], entities: {} })
      expect(items.getIds()).toEqual([])
      expect(items.getEntities()).toEqual({})
      expect(items.getAll()).toEqual([])
      expect(items.getTotal()).toBe(0)
    })

    it('creates collection with initial state', () => {
      const initialState: ItemsState<User> = {
        ids: [1, 2],
        entities: {
          1: { id: 1, name: 'Alice' },
          2: { id: 2, name: 'Bob' }
        }
      }
      const items = new Items(initialState)
      expect(items.getIds()).toEqual([1, 2])
      expect(items.getTotal()).toBe(2)
      expect(items.getAll()).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])
    })

    it('uses custom selectId', () => {
      const items = new Items<Book>(
        { ids: [], entities: {} },
        { selectId: (book) => book.isbn }
      )
      const updated = items.addOne({ isbn: '978-0', title: 'Test', year: 2020 })
      expect(updated.getIds()).toEqual(['978-0'])
    })
  })

  describe('addOne', () => {
    it('adds single entity', () => {
      const items = new Items<User>({ ids: [], entities: {} })
      const updated = items.addOne({ id: 1, name: 'Alice' })

      expect(updated.getIds()).toEqual([1])
      expect(updated.selectById(1)).toEqual({ id: 1, name: 'Alice' })
      expect(updated.getTotal()).toBe(1)
    })

    it('does not add duplicate', () => {
      const items = new Items<User>({
        ids: [1],
        entities: { 1: { id: 1, name: 'Alice' } }
      })
      const updated = items.addOne({ id: 1, name: 'Alice Updated' })

      expect(updated.getIds()).toEqual([1])
      expect(updated.selectById(1)).toEqual({ id: 1, name: 'Alice' })
    })

    it('is immutable', () => {
      const items = new Items<User>({ ids: [], entities: {} })
      const updated = items.addOne({ id: 1, name: 'Alice' })

      expect(items.getIds()).toEqual([])
      expect(updated.getIds()).toEqual([1])
    })
  })

  describe('addMany', () => {
    it('adds multiple entities', () => {
      const items = new Items<User>({ ids: [], entities: {} })
      const updated = items.addMany([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])

      expect(updated.getIds()).toEqual([1, 2])
      expect(updated.getTotal()).toBe(2)
    })

    it('skips duplicates', () => {
      const items = new Items<User>({
        ids: [1],
        entities: { 1: { id: 1, name: 'Alice' } }
      })
      const updated = items.addMany([
        { id: 1, name: 'Alice Updated' },
        { id: 2, name: 'Bob' }
      ])

      expect(updated.getIds()).toEqual([1, 2])
      expect(updated.selectById(1)).toEqual({ id: 1, name: 'Alice' })
    })
  })

  describe('setOne', () => {
    it('adds new entity', () => {
      const items = new Items<User>({ ids: [], entities: {} })
      const updated = items.setOne({ id: 1, name: 'Alice' })

      expect(updated.getIds()).toEqual([1])
      expect(updated.selectById(1)).toEqual({ id: 1, name: 'Alice' })
    })

    it('replaces existing entity', () => {
      const items = new Items<User>({
        ids: [1],
        entities: { 1: { id: 1, name: 'Alice' } }
      })
      const updated = items.setOne({ id: 1, name: 'Alice Updated' })

      expect(updated.getIds()).toEqual([1])
      expect(updated.selectById(1)).toEqual({ id: 1, name: 'Alice Updated' })
    })
  })

  describe('setMany', () => {
    it('adds and replaces entities', () => {
      const items = new Items<User>({
        ids: [1],
        entities: { 1: { id: 1, name: 'Alice' } }
      })
      const updated = items.setMany([
        { id: 1, name: 'Alice Updated' },
        { id: 2, name: 'Bob' }
      ])

      expect(updated.getIds()).toEqual([1, 2])
      expect(updated.selectById(1)).toEqual({ id: 1, name: 'Alice Updated' })
      expect(updated.selectById(2)).toEqual({ id: 2, name: 'Bob' })
    })
  })

  describe('setAll', () => {
    it('replaces entire collection', () => {
      const items = new Items<User>({
        ids: [1, 2],
        entities: {
          1: { id: 1, name: 'Alice' },
          2: { id: 2, name: 'Bob' }
        }
      })
      const updated = items.setAll([
        { id: 3, name: 'Charlie' },
        { id: 4, name: 'Dave' }
      ])

      expect(updated.getIds()).toEqual([3, 4])
      expect(updated.getTotal()).toBe(2)
      expect(updated.selectById(1)).toBeUndefined()
      expect(updated.selectById(3)).toEqual({ id: 3, name: 'Charlie' })
    })

    it('clears collection when empty array', () => {
      const items = new Items<User>({
        ids: [1],
        entities: { 1: { id: 1, name: 'Alice' } }
      })
      const updated = items.setAll([])

      expect(updated.getIds()).toEqual([])
      expect(updated.getTotal()).toBe(0)
    })
  })

  describe('updateOne', () => {
    it('updates existing entity', () => {
      const items = new Items<User>({
        ids: [1],
        entities: { 1: { id: 1, name: 'Alice', age: 25 } }
      })
      const updated = items.updateOne({ id: 1, changes: { age: 26 } })

      expect(updated.selectById(1)).toEqual({ id: 1, name: 'Alice', age: 26 })
    })

    it('does not update non-existent entity', () => {
      const items = new Items<User>({ ids: [], entities: {} })
      const updated = items.updateOne({ id: 1, changes: { name: 'Alice' } })

      expect(updated.getIds()).toEqual([])
      expect(updated).toBe(items)
    })

    it('partial update preserves other fields', () => {
      const items = new Items<User>({
        ids: [1],
        entities: { 1: { id: 1, name: 'Alice', age: 25 } }
      })
      const updated = items.updateOne({ id: 1, changes: { name: 'Alicia' } })

      expect(updated.selectById(1)).toEqual({ id: 1, name: 'Alicia', age: 25 })
    })
  })

  describe('updateMany', () => {
    it('updates multiple entities', () => {
      const items = new Items<User>({
        ids: [1, 2],
        entities: {
          1: { id: 1, name: 'Alice', age: 25 },
          2: { id: 2, name: 'Bob', age: 30 }
        }
      })
      const updated = items.updateMany([
        { id: 1, changes: { age: 26 } },
        { id: 2, changes: { age: 31 } }
      ])

      expect(updated.selectById(1)?.age).toBe(26)
      expect(updated.selectById(2)?.age).toBe(31)
    })

    it('returns same instance when no changes', () => {
      const items = new Items<User>({ ids: [], entities: {} })
      const updated = items.updateMany([{ id: 1, changes: { name: 'Alice' } }])

      expect(updated).toBe(items)
    })
  })

  describe('upsertOne', () => {
    it('adds new entity', () => {
      const items = new Items<User>({ ids: [], entities: {} })
      const updated = items.upsertOne({ id: 1, name: 'Alice' })

      expect(updated.getIds()).toEqual([1])
      expect(updated.selectById(1)).toEqual({ id: 1, name: 'Alice' })
    })

    it('replaces existing entity', () => {
      const items = new Items<User>({
        ids: [1],
        entities: { 1: { id: 1, name: 'Alice', age: 25 } }
      })
      const updated = items.upsertOne({ id: 1, name: 'Alice Updated' })

      expect(updated.selectById(1)).toEqual({ id: 1, name: 'Alice Updated' })
    })
  })

  describe('upsertMany', () => {
    it('adds and replaces entities', () => {
      const items = new Items<User>({
        ids: [1],
        entities: { 1: { id: 1, name: 'Alice' } }
      })
      const updated = items.upsertMany([
        { id: 1, name: 'Alice Updated' },
        { id: 2, name: 'Bob' }
      ])

      expect(updated.getIds()).toEqual([1, 2])
      expect(updated.selectById(1)).toEqual({ id: 1, name: 'Alice Updated' })
      expect(updated.selectById(2)).toEqual({ id: 2, name: 'Bob' })
    })
  })

  describe('removeOne', () => {
    it('removes entity', () => {
      const items = new Items<User>({
        ids: [1, 2],
        entities: {
          1: { id: 1, name: 'Alice' },
          2: { id: 2, name: 'Bob' }
        }
      })
      const updated = items.removeOne(1)

      expect(updated.getIds()).toEqual([2])
      expect(updated.selectById(1)).toBeUndefined()
      expect(updated.getTotal()).toBe(1)
    })

    it('returns same instance when entity not found', () => {
      const items = new Items<User>({ ids: [], entities: {} })
      const updated = items.removeOne(1)

      expect(updated).toBe(items)
    })
  })

  describe('removeMany', () => {
    it('removes multiple entities', () => {
      const items = new Items<User>({
        ids: [1, 2, 3],
        entities: {
          1: { id: 1, name: 'Alice' },
          2: { id: 2, name: 'Bob' },
          3: { id: 3, name: 'Charlie' }
        }
      })
      const updated = items.removeMany([1, 3])

      expect(updated.getIds()).toEqual([2])
      expect(updated.getTotal()).toBe(1)
    })

    it('returns same instance when no entities removed', () => {
      const items = new Items<User>({
        ids: [1],
        entities: { 1: { id: 1, name: 'Alice' } }
      })
      const updated = items.removeMany([2, 3])

      expect(updated).toBe(items)
    })
  })

  describe('removeAll', () => {
    it('clears collection', () => {
      const items = new Items<User>({
        ids: [1, 2],
        entities: {
          1: { id: 1, name: 'Alice' },
          2: { id: 2, name: 'Bob' }
        }
      })
      const updated = items.removeAll()

      expect(updated.getIds()).toEqual([])
      expect(updated.getEntities()).toEqual({})
      expect(updated.getTotal()).toBe(0)
    })
  })

  describe('selectors', () => {
    it('selectById returns entity', () => {
      const items = new Items<User>({
        ids: [1],
        entities: { 1: { id: 1, name: 'Alice' } }
      })

      expect(items.selectById(1)).toEqual({ id: 1, name: 'Alice' })
      expect(items.selectById(2)).toBeUndefined()
    })

    it('getAll returns array of entities in order', () => {
      const items = new Items<User>({
        ids: [2, 1, 3],
        entities: {
          1: { id: 1, name: 'Alice' },
          2: { id: 2, name: 'Bob' },
          3: { id: 3, name: 'Charlie' }
        }
      })

      expect(items.getAll()).toEqual([
        { id: 2, name: 'Bob' },
        { id: 1, name: 'Alice' },
        { id: 3, name: 'Charlie' }
      ])
    })

    it('getState returns immutable copy', () => {
      const items = new Items<User>({
        ids: [1],
        entities: { 1: { id: 1, name: 'Alice' } }
      })
      const state = items.getState()
      state.ids.push(2)
      state.entities[2] = { id: 2, name: 'Bob' }

      expect(items.getIds()).toEqual([1])
      expect(items.getTotal()).toBe(1)
    })
  })

  describe('sortComparer', () => {
    it('sorts by name ascending', () => {
      const items = new Items<User>(
        { ids: [], entities: {} },
        { sortComparer: (a, b) => a.name.localeCompare(b.name) }
      )
      const updated = items.addMany([
        { id: 3, name: 'Charlie' },
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])

      expect(updated.getIds()).toEqual([1, 2, 3])
      expect(updated.getAll().map(u => u.name)).toEqual(['Alice', 'Bob', 'Charlie'])
    })

    it('sorts by age descending', () => {
      const items = new Items<User>(
        { ids: [], entities: {} },
        { sortComparer: (a, b) => (b.age ?? 0) - (a.age ?? 0) }
      )
      const updated = items.addMany([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 },
        { id: 3, name: 'Charlie', age: 20 }
      ])

      expect(updated.getAll().map(u => u.age)).toEqual([30, 25, 20])
    })

    it('re-sorts after update', () => {
      const items = new Items<User>(
        {
          ids: [1, 2],
          entities: {
            1: { id: 1, name: 'Alice', age: 25 },
            2: { id: 2, name: 'Bob', age: 30 }
          }
        },
        { sortComparer: (a, b) => (a.age ?? 0) - (b.age ?? 0) }
      )
      const updated = items.updateOne({ id: 1, changes: { age: 35 } })

      expect(updated.getAll().map(u => u.age)).toEqual([30, 35])
    })

    it('sortComparer: false disables sorting', () => {
      const items = new Items<User>(
        { ids: [], entities: {} },
        { sortComparer: false }
      )
      const updated = items.addMany([
        { id: 3, name: 'Charlie' },
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])

      expect(updated.getIds()).toEqual([3, 1, 2])
    })
  })

  describe('map', () => {
    it('maps over entities', () => {
      const items = new Items<User>({
        ids: [1, 2],
        entities: {
          1: { id: 1, name: 'Alice' },
          2: { id: 2, name: 'Bob' }
        }
      })
      const names = items.map(user => user.name)

      expect(names).toEqual(['Alice', 'Bob'])
    })

    it('maps with id access', () => {
      const items = new Items<User>({
        ids: [1, 2],
        entities: {
          1: { id: 1, name: 'Alice' },
          2: { id: 2, name: 'Bob' }
        }
      })
      const result = items.map((user, id) => `${id}: ${user.name}`)

      expect(result).toEqual(['1: Alice', '2: Bob'])
    })
  })

  describe('custom selectId with Books', () => {
    it('works with string IDs', () => {
      const items = new Items<Book>(
        { ids: [], entities: {} },
        { selectId: (book) => book.isbn }
      )
      const updated = items.addMany([
        { isbn: '978-0-1', title: 'Book A', year: 2020 },
        { isbn: '978-0-2', title: 'Book B', year: 2021 }
      ])

      expect(updated.getIds()).toEqual(['978-0-1', '978-0-2'])
      expect(updated.selectById('978-0-1')?.title).toBe('Book A')
    })

    it('sorts books by year', () => {
      const items = new Items<Book>(
        { ids: [], entities: {} },
        {
          selectId: (book) => book.isbn,
          sortComparer: (a, b) => a.year - b.year
        }
      )
      const updated = items.addMany([
        { isbn: '978-0-3', title: 'Book C', year: 2022 },
        { isbn: '978-0-1', title: 'Book A', year: 2020 },
        { isbn: '978-0-2', title: 'Book B', year: 2021 }
      ])

      expect(updated.getAll().map(b => b.year)).toEqual([2020, 2021, 2022])
    })
  })
})

