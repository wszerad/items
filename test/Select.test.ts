import { describe, it, expect } from 'vitest'
import { Items } from '../src'
import { Select, SingleSelect } from '../src'

interface User {
  id: number
  name: string
  age: number
}

describe('Select', () => {
  describe('take', () => {
    it('should take first n items', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ])
      const result = items.select((s) => s.take(2))

      expect(result.length).toBe(2)
      expect(result[0].name).toBe('Alice')
      expect(result[1].name).toBe('Bob')
    })

    it('should handle taking more than available', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 }
      ])
      const result = items.select((s) => s.take(5))

      expect(result.length).toBe(1)
    })

    it('should handle taking 0 items', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 }
      ])
      const result = items.select((s) => s.take(0))

      expect(result.length).toBe(0)
    })
  })

  describe('skip', () => {
    it('should skip first n items', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ])
      const result = items.select((s) => s.skip(1))

      expect(result.length).toBe(2)
      expect(result[0].name).toBe('Bob')
      expect(result[1].name).toBe('Charlie')
    })

    it('should handle skipping more than available', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 }
      ])
      const result = items.select((s) => s.skip(5))

      expect(result.length).toBe(0)
    })
  })

  describe('filter', () => {
    it('should filter items by predicate', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ])
      const result = items.select((s) => s.filter((user: User) => user.age > 25))

      expect(result.length).toBe(2)
      expect(result.map(u => u.name)).toEqual(['Alice', 'Charlie'])
    })
  })

  describe('revert', () => {
    it('should reverse the order of items', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ])
      const result = items.select((s) => s.revert())

      expect(result.map(u => u.name)).toEqual(['Charlie', 'Bob', 'Alice'])
    })
  })

  describe('sort', () => {
    it('should sort items by comparator', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ])
      const result = items.select((s) => s.sort((a: User, b: User) => a.age - b.age))

      expect(result.map(u => u.name)).toEqual(['Bob', 'Alice', 'Charlie'])
    })

    it('should sort by name alphabetically', () => {
      const items = new Items<User>([
        { id: 1, name: 'Charlie', age: 30 },
        { id: 2, name: 'Alice', age: 25 },
        { id: 3, name: 'Bob', age: 35 }
      ])
      const result = items.select((s) => s.sort((a: User, b: User) => a.name.localeCompare(b.name)))

      expect(result.map(u => u.name)).toEqual(['Alice', 'Bob', 'Charlie'])
    })
  })

  describe('at', () => {
    it('should return SingleSelect at index', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ])

      const select = new Select(items.getEntities(), items)
      const single = select.at(1)

      expect(single).toBeInstanceOf(SingleSelect)
      expect(single.ids).toEqual([2])
    })
  })

  describe('find', () => {
    it('should find first item matching predicate', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ])
      const result = items.select((s) => s.find((user: User) => user.age > 25))

      expect(result).toBeDefined()
      expect(result?.name).toBe('Alice')
      expect(result?.id).toBe(1)
    })

    it('should return undefined if no item matches', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ])
      const result = items.select((s) => s.find((user: User) => user.age > 40))

      expect(result).toBeUndefined()
    })
  })

  describe('from', () => {
    it('should create Select from entities', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ])

      const select = new Select(items.getEntities(), items)
      const newSelect = select.from([
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ])

      expect(newSelect.ids).toEqual([2, 3])
    })
  })

  describe('on', () => {
    it('should create SingleSelect from entity', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ])

      const select = new Select(items.getEntities(), items)
      const single = select.on({ id: 2, name: 'Bob', age: 25 })

      expect(single).toBeInstanceOf(SingleSelect)
      expect(single.ids).toEqual([2])
    })
  })

  describe('chaining', () => {
    it('should support method chaining', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 },
        { id: 4, name: 'David', age: 40 },
        { id: 5, name: 'Eve', age: 28 }
      ])

      const result = items.select((s) =>
        s.filter((u: User) => u.age >= 28)
          .sort((a: User, b: User) => a.age - b.age)
          .skip(1)
          .take(2)
      )

      expect(result.length).toBe(2)
      expect(result.map(u => u.name)).toEqual(['Alice', 'Charlie'])
    })

    it('should support complex filtering and sorting', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 },
        { id: 4, name: 'David', age: 40 },
        { id: 5, name: 'Eve', age: 28 }
      ])

      const result = items.select((s) =>
        s.filter((u: User) => u.age > 25)
          .revert()
          .take(3)
      )

      expect(result.length).toBe(3)
      // After filtering (age > 25): Alice(30), Charlie(35), David(40), Eve(28)
      // After revert: Eve(28), David(40), Charlie(35), Alice(30)
      // After take(3): Eve(28), David(40), Charlie(35)
      expect(result.map(u => u.name)).toEqual(['Eve', 'David', 'Charlie'])
    })
  })
})

describe('SingleSelect', () => {
  it('should extend BaseSelect', () => {
    const items = new Items<User>([
      { id: 1, name: 'Alice', age: 30 }
    ])
    const single = new SingleSelect([{ id: 1, name: 'Alice', age: 30 }], items)

    expect(single.ids).toEqual([1])
    expect(single.self).toBe(items)
  })
})
