import { describe, it, expect } from 'vitest'
import { Select, SingleSelect } from '../src/select'

interface User {
  id: number
  name: string
  age: number
}

interface ExternalUser {
  userId: string
  userName: string
  userAge: number
}

describe('Select', () => {
  describe('constructor', () => {
    it('should create Select with items', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ]
      const select = new Select(users)

      expect(select.items).toHaveLength(2)
      expect(select.items).toEqual(users)
      expect(select.context).toBeInstanceOf(Map)
      expect(select.context.size).toBe(0)
    })

    it('should create Select with items and context', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 }
      ]
      const context = new Map([['key1', users[0]]])
      const select = new Select(users, context)

      expect(select.items).toEqual(users)
      expect(select.context).toStrictEqual(context)
      expect(select.context.size).toBe(1)
    })
  })

  describe('take', () => {
    it('should take first n items', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ]
      const select = new Select(users)
      const result = select.take(2)

      expect(result).toBeInstanceOf(Select)
      expect(result.items).toHaveLength(2)
      expect(result.items[0]).toEqual({ id: 1, name: 'Alice', age: 30 })
      expect(result.items[1]).toEqual({ id: 2, name: 'Bob', age: 25 })
    })

    it('should handle taking more than available', () => {
      const users: User[] = [{ id: 1, name: 'Alice', age: 30 }]
      const select = new Select(users)
      const result = select.take(5)

      expect(result.items).toHaveLength(1)
    })

    it('should handle taking 0 items', () => {
      const users: User[] = [{ id: 1, name: 'Alice', age: 30 }]
      const select = new Select(users)
      const result = select.take(0)

      expect(result.items).toHaveLength(0)
    })
  })

  describe('skip', () => {
    it('should skip first n items', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ]
      const select = new Select(users)
      const result = select.skip(1)

      expect(result).toBeInstanceOf(Select)
      expect(result.items).toHaveLength(2)
      expect(result.items[0]).toEqual({ id: 2, name: 'Bob', age: 25 })
      expect(result.items[1]).toEqual({ id: 3, name: 'Charlie', age: 35 })
    })

    it('should handle skipping more than available', () => {
      const users: User[] = [{ id: 1, name: 'Alice', age: 30 }]
      const select = new Select(users)
      const result = select.skip(5)

      expect(result.items).toHaveLength(0)
    })
  })

  describe('filter', () => {
    it('should filter items by predicate', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ]
      const select = new Select(users)
      const result = select.filter((user) => user.age > 25)

      expect(result).toBeInstanceOf(Select)
      expect(result.items).toHaveLength(2)
      expect(result.items.map(u => u.name)).toEqual(['Alice', 'Charlie'])
    })

    it('should return empty Select when no items match', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ]
      const select = new Select(users)
      const result = select.filter((user) => user.age > 50)

      expect(result.items).toHaveLength(0)
    })
  })

  describe('revert', () => {
    it('should reverse the order of items', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ]
      const select = new Select(users)
      const result = select.revert()

      expect(result).toBeInstanceOf(Select)
      expect(result.items.map(u => u.name)).toEqual(['Charlie', 'Bob', 'Alice'])
    })

    it('should not mutate original items', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ]
      const select = new Select(users)
      const result = select.revert()

      expect(select.items.map(u => u.name)).toEqual(['Alice', 'Bob'])
      expect(result.items.map(u => u.name)).toEqual(['Bob', 'Alice'])
    })
  })

  describe('sort', () => {
    it('should sort items by comparator', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ]
      const select = new Select(users)
      const result = select.sort((a, b) => a.age - b.age)

      expect(result).toBeInstanceOf(Select)
      expect(result.items.map(u => u.name)).toEqual(['Bob', 'Alice', 'Charlie'])
    })

    it('should sort by name alphabetically', () => {
      const users: User[] = [
        { id: 1, name: 'Charlie', age: 30 },
        { id: 2, name: 'Alice', age: 25 },
        { id: 3, name: 'Bob', age: 35 }
      ]
      const select = new Select(users)
      const result = select.sort((a, b) => a.name.localeCompare(b.name))

      expect(result.items.map(u => u.name)).toEqual(['Alice', 'Bob', 'Charlie'])
    })

    it('should not mutate original items', () => {
      const users: User[] = [
        { id: 3, name: 'Charlie', age: 35 },
        { id: 1, name: 'Alice', age: 30 }
      ]
      const select = new Select(users)
      const result = select.sort((a, b) => a.age - b.age)

      expect(select.items.map(u => u.name)).toEqual(['Charlie', 'Alice'])
      expect(result.items.map(u => u.name)).toEqual(['Alice', 'Charlie'])
    })
  })

  describe('at', () => {
    it('should return SingleSelect at index', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ]
      const select = new Select(users)
      const single = select.at(1)

      expect(single).toBeInstanceOf(SingleSelect)
      expect(single.items).toHaveLength(1)
      expect(single.items[0]).toEqual({ id: 2, name: 'Bob', age: 25 })
    })

    it('should return SingleSelect with undefined for out of bounds index', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 }
      ]
      const select = new Select(users)
      const single = select.at(10)

      expect(single).toBeInstanceOf(SingleSelect)
      expect(single.items).toHaveLength(1)
      expect(single.items[0]).toBeUndefined()
    })

    it('should work with negative indices', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ]
      const select = new Select(users)
      const single = select.at(-1)

      expect(single.items[0]).toBeUndefined()
    })
  })

  describe('find', () => {
    it('should find first item matching predicate', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ]
      const select = new Select(users)
      const single = select.find((user) => user.age > 25)

      expect(single).toBeInstanceOf(SingleSelect)
      expect(single.items).toHaveLength(1)
      expect(single.items[0]).toEqual({ id: 1, name: 'Alice', age: 30 })
    })

    it('should return SingleSelect with empty array if no item matches', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ]
      const select = new Select(users)
      const single = select.find((user) => user.age > 40)

      expect(single).toBeInstanceOf(SingleSelect)
      expect(single.items).toHaveLength(0)
    })

    it('should find first matching item even with multiple matches', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 30 },
        { id: 3, name: 'Charlie', age: 30 }
      ]
      const select = new Select(users)
      const single = select.find((user) => user.age === 30)

      expect(single.items[0]?.name).toBe('Alice')
    })
  })

  describe('from', () => {
    it('should create Select from entities without matcher', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ]
      const select = new Select(users)
      const newUsers = [
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ]
      const newSelect = select.from(newUsers)

      expect(newSelect).toBeInstanceOf(Select)
      expect(newSelect.items).toHaveLength(2)
      expect(newSelect.items[0]).toEqual({ id: 2, name: 'Bob', age: 25 })
      expect(newSelect.items[1]).toEqual({ id: 3, name: 'Charlie', age: 35 })
    })

    it('should create Select from entities with matcher', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ]
      const select = new Select(users)

      const externalUsers: ExternalUser[] = [
        { userId: 'ext2', userName: 'Bob', userAge: 25 },
        { userId: 'ext3', userName: 'Charlie', userAge: 35 }
      ]

      const newSelect = select.from(
        externalUsers,
        (external, internal) => external.userName === internal?.name
      )

      expect(newSelect).toBeInstanceOf(Select)
      expect(newSelect.items).toHaveLength(2)
      expect(newSelect.items[0]).toEqual({ id: 2, name: 'Bob', age: 25 })
      expect(newSelect.items[1]).toEqual({ id: 3, name: 'Charlie', age: 35 })
    })

    it('should populate context when using matcher', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ]
      const select = new Select(users)

      const externalUsers: ExternalUser[] = [
        { userId: 'ext2', userName: 'Bob', userAge: 25 }
      ]

      const newSelect = select.from(
        externalUsers,
        (external, internal) => external.userName === internal?.name
      )

      expect(newSelect.context.size).toBe(1)
      expect(newSelect.context.get(externalUsers[0])).toEqual({ id: 2, name: 'Bob', age: 25 })
    })

    it('should handle non-matching items with matcher', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 }
      ]
      const select = new Select(users)

      const externalUsers: ExternalUser[] = [
        { userId: 'ext2', userName: 'NonExistent', userAge: 25 }
      ]

      const newSelect = select.from(
        externalUsers,
        (external, internal) => external.userName === internal?.name
      )

      expect(newSelect.items).toHaveLength(1)
      expect(newSelect.items[0]).toBeUndefined()
      expect(newSelect.context.get(externalUsers[0])).toBeUndefined()
    })

    it('should preserve context mapping for chaining', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ]
      const select = new Select(users)

      const externalUsers: ExternalUser[] = [
        { userId: 'ext1', userName: 'Alice', userAge: 30 },
        { userId: 'ext2', userName: 'Bob', userAge: 25 },
        { userId: 'ext3', userName: 'Charlie', userAge: 35 }
      ]

      const newSelect = select.from(
        externalUsers,
        (external, internal) => external.userName === internal?.name
      )

      // Verify all mappings are preserved
      expect(newSelect.context.size).toBe(3)
      externalUsers.forEach((extUser, idx) => {
        expect(newSelect.context.get(extUser)).toEqual(users[idx])
      })
    })
  })

  describe('on', () => {
    it('should create SingleSelect from entity without matcher', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ]
      const select = new Select(users)
      const user = { id: 2, name: 'Bob', age: 25 }
      const single = select.on(user)

      expect(single).toBeInstanceOf(SingleSelect)
      expect(single.items).toHaveLength(1)
      expect(single.items[0]).toEqual(user)
    })

    it('should create SingleSelect from entity with matcher', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ]
      const select = new Select(users)
      const externalUser: ExternalUser = { userId: 'ext2', userName: 'Bob', userAge: 25 }

      const single = select.on(
        externalUser,
        (external, internal) => external.userName === internal?.name
      )

      expect(single).toBeInstanceOf(SingleSelect)
      expect(single.items).toHaveLength(1)
      expect(single.items[0]).toEqual({ id: 2, name: 'Bob', age: 25 })
    })

    it('should populate context when using matcher', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ]
      const select = new Select(users)
      const externalUser: ExternalUser = { userId: 'ext2', userName: 'Bob', userAge: 25 }

      const single = select.on(
        externalUser,
        (external, internal) => external.userName === internal?.name
      )

      expect(single.context.size).toBe(1)
      expect(single.context.get(externalUser)).toEqual({ id: 2, name: 'Bob', age: 25 })
    })

    it('should handle non-matching entity with matcher', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 }
      ]
      const select = new Select(users)
      const externalUser: ExternalUser = { userId: 'ext2', userName: 'NonExistent', userAge: 25 }

      const single = select.on(
        externalUser,
        (external, internal) => external.userName === internal?.name
      )

      expect(single.items).toHaveLength(1)
      expect(single.items[0]).toBeUndefined()
    })
  })

  describe('chaining', () => {
    it('should support method chaining', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 },
        { id: 4, name: 'David', age: 40 },
        { id: 5, name: 'Eve', age: 28 }
      ]
      const select = new Select(users)

      const result = select
        .filter((u) => u.age >= 28)
        .sort((a, b) => a.age - b.age)
        .skip(1)
        .take(2)

      expect(result.items).toHaveLength(2)
      expect(result.items.map(u => u.name)).toEqual(['Alice', 'Charlie'])
    })

    it('should support complex filtering and sorting', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 },
        { id: 4, name: 'David', age: 40 },
        { id: 5, name: 'Eve', age: 28 }
      ]
      const select = new Select(users)

      const result = select
        .filter((u) => u.age > 25)
        .revert()
        .take(3)

      expect(result.items).toHaveLength(3)
      expect(result.items.map(u => u.name)).toEqual(['Eve', 'David', 'Charlie'])
    })

    it('should chain from with matcher and other operations', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 },
        { id: 4, name: 'David', age: 40 }
      ]
      const select = new Select(users)

      const externalUsers: ExternalUser[] = [
        { userId: 'ext1', userName: 'Alice', userAge: 30 },
        { userId: 'ext2', userName: 'Bob', userAge: 25 },
        { userId: 'ext3', userName: 'Charlie', userAge: 35 },
        { userId: 'ext4', userName: 'David', userAge: 40 }
      ]

      const result = select
        .from(
          externalUsers,
          (external, internal) => external.userName === internal?.name
        )
        .filter((u) => u !== undefined && u.age > 25)
        .sort((a, b) => (a?.age || 0) - (b?.age || 0))
        .take(2)

      expect(result.items).toHaveLength(2)
      expect(result.items[0]).toEqual({ id: 1, name: 'Alice', age: 30 })
      expect(result.items[1]).toEqual({ id: 3, name: 'Charlie', age: 35 })

      // Context is now preserved and cleaned through filter/sort/take operations
      expect(result.context.size).toBe(2)
      // Verify that only items that remain have context entries
      const contextValues = Array.from(result.context.values())
      expect(contextValues).toContainEqual({ id: 1, name: 'Alice', age: 30 })
      expect(contextValues).toContainEqual({ id: 3, name: 'Charlie', age: 35 })
    })

    it('should maintain context through multiple from operations', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ]
      const select = new Select(users)

      const externalUsers1: ExternalUser[] = [
        { userId: 'ext1', userName: 'Alice', userAge: 30 },
        { userId: 'ext2', userName: 'Bob', userAge: 25 }
      ]

      const intermediate = select.from(
        externalUsers1,
        (external, internal) => external.userName === internal?.name
      )

      // Second from operation
      const externalUsers2 = [
        { userId: 'ext2', userName: 'Bob', userAge: 25 }
      ]

      const final = intermediate.from(
        externalUsers2,
        (external, internal) => external.userName === internal?.name
      )

      expect(final.items).toHaveLength(1)
      expect(final.items[0]).toEqual({ id: 2, name: 'Bob', age: 25 })
      expect(final.context.size).toBe(1)
    })
  })

  describe('chains ending with SingleSelect', () => {
    it('should chain filter -> at with context preservation', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ]
      const select = new Select(users)

      const externalUsers: ExternalUser[] = [
        { userId: 'ext1', userName: 'Alice', userAge: 30 },
        { userId: 'ext2', userName: 'Bob', userAge: 25 },
        { userId: 'ext3', userName: 'Charlie', userAge: 35 }
      ]

      const result = select
        .from(
          externalUsers,
          (external, internal) => external.userName === internal?.name
        )
        .filter((u) => u !== undefined && u.age >= 30)
        .at(0)

      expect(result).toBeInstanceOf(SingleSelect)
      expect(result.items).toHaveLength(1)
      expect(result.items[0]).toEqual({ id: 1, name: 'Alice', age: 30 })
      expect(result.context.size).toBe(1)

      // Context should contain only the selected item
      const contextValues = Array.from(result.context.values())
      expect(contextValues).toContainEqual({ id: 1, name: 'Alice', age: 30 })
    })

    it('should chain sort -> find with context preservation', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ]
      const select = new Select(users)

      const externalUsers: ExternalUser[] = [
        { userId: 'ext1', userName: 'Alice', userAge: 30 },
        { userId: 'ext2', userName: 'Bob', userAge: 25 },
        { userId: 'ext3', userName: 'Charlie', userAge: 35 }
      ]

      const result = select
        .from(
          externalUsers,
          (external, internal) => external.userName === internal?.name
        )
        .sort((a, b) => (b?.age || 0) - (a?.age || 0)) // Sort descending by age
        .find((u) => u !== undefined && u.age < 35)

      expect(result).toBeInstanceOf(SingleSelect)
      expect(result.items).toHaveLength(1)
      expect(result.items[0]).toEqual({ id: 1, name: 'Alice', age: 30 })
      expect(result.context.size).toBe(1)
    })

    it('should chain filter -> take -> at with context cleaned at each step', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 },
        { id: 4, name: 'David', age: 40 },
        { id: 5, name: 'Eve', age: 28 }
      ]
      const select = new Select(users)

      const externalUsers: ExternalUser[] = [
        { userId: 'ext1', userName: 'Alice', userAge: 30 },
        { userId: 'ext2', userName: 'Bob', userAge: 25 },
        { userId: 'ext3', userName: 'Charlie', userAge: 35 },
        { userId: 'ext4', userName: 'David', userAge: 40 },
        { userId: 'ext5', userName: 'Eve', userAge: 28 }
      ]

      const mapped = select.from(
        externalUsers,
        (external, internal) => external.userName === internal?.name
      )
      expect(mapped.context.size).toBe(5)

      const filtered = mapped.filter((u) => u !== undefined && u.age >= 30)
      expect(filtered.context.size).toBe(3) // Alice, Charlie, David

      const limited = filtered.take(2)
      expect(limited.context.size).toBe(2) // Alice, Charlie

      const final = limited.at(1)
      expect(final).toBeInstanceOf(SingleSelect)
      expect(final.items[0]).toEqual({ id: 3, name: 'Charlie', age: 35 })
      expect(final.context.size).toBe(1) // Only Charlie
    })

    it('should handle from -> on chain with matcher', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ]
      const select = new Select(users)

      const externalUser: ExternalUser = { userId: 'ext1', userName: 'Alice', userAge: 30 }

      const result = select.on(
        externalUser,
        (external, internal) => external.userName === internal?.name
      )

      expect(result).toBeInstanceOf(SingleSelect)
      expect(result.items).toHaveLength(1)
      expect(result.items[0]).toEqual({ id: 1, name: 'Alice', age: 30 })
      expect(result.context.size).toBe(1)
      expect(result.context.get(externalUser)).toEqual({ id: 1, name: 'Alice', age: 30 })
    })

    it('should handle revert -> find chain preserving context', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ]
      const select = new Select(users)

      const externalUsers: ExternalUser[] = [
        { userId: 'ext1', userName: 'Alice', userAge: 30 },
        { userId: 'ext2', userName: 'Bob', userAge: 25 },
        { userId: 'ext3', userName: 'Charlie', userAge: 35 }
      ]

      const result = select
        .from(
          externalUsers,
          (external, internal) => external.userName === internal?.name
        )
        .revert()
        .find((u) => u !== undefined && u.age === 25)

      expect(result).toBeInstanceOf(SingleSelect)
      expect(result.items).toHaveLength(1)
      expect(result.items[0]).toEqual({ id: 2, name: 'Bob', age: 25 })
      expect(result.context.size).toBe(1)
    })

    it('should handle empty result in chain ending with SingleSelect', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ]
      const select = new Select(users)

      const externalUsers: ExternalUser[] = [
        { userId: 'ext1', userName: 'Alice', userAge: 30 },
        { userId: 'ext2', userName: 'Bob', userAge: 25 }
      ]

      const result = select
        .from(
          externalUsers,
          (external, internal) => external.userName === internal?.name
        )
        .filter((u) => u !== undefined && u.age > 50)
        .find((u) => u !== undefined)

      expect(result).toBeInstanceOf(SingleSelect)
      expect(result.items).toHaveLength(0)
      expect(result.context.size).toBe(0)
    })
  })

  describe('context usage', () => {
    it('should preserve context immediately after from with matcher', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ]
      const select = new Select(users)

      const externalUsers: ExternalUser[] = [
        { userId: 'ext1', userName: 'Alice', userAge: 30 },
        { userId: 'ext2', userName: 'Bob', userAge: 25 },
        { userId: 'ext3', userName: 'Charlie', userAge: 35 }
      ]

      const mapped = select.from(
        externalUsers,
        (external, internal) => external.userName === internal?.name
      )

      // Context is populated by from with matcher
      expect(mapped.context.size).toBe(3)
      expect(mapped.items).toHaveLength(3)

      // Filter now preserves context but cleans it - only items that remain have context
      const filtered = mapped.filter((u) => u !== undefined && u.age > 25)
      expect(filtered.context.size).toBe(2)
      expect(filtered.items).toHaveLength(2)

      // Verify filtered context contains only remaining items
      const filteredContextValues = Array.from(filtered.context.values())
      expect(filteredContextValues).toContainEqual({ id: 1, name: 'Alice', age: 30 })
      expect(filteredContextValues).toContainEqual({ id: 3, name: 'Charlie', age: 35 })
    })

    it('should use context for data transformation scenarios', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ]
      const select = new Select(users)

      const externalUsers: ExternalUser[] = [
        { userId: 'ext1', userName: 'Alice', userAge: 30 },
        { userId: 'ext2', userName: 'Bob', userAge: 25 }
      ]

      const result = select.from(
        externalUsers,
        (external, internal) => external.userName === internal?.name
      )

      // Can access mapped context immediately after from
      expect(result.context.get(externalUsers[0])).toEqual({ id: 1, name: 'Alice', age: 30 })
      expect(result.context.get(externalUsers[1])).toEqual({ id: 2, name: 'Bob', age: 25 })

      // Items contain the matched internal entities
      expect(result.items).toHaveLength(2)
      expect(result.items[0]?.name).toBe('Alice')
      expect(result.items[1]?.name).toBe('Bob')
    })

    it('should work with complex matcher logic', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ]
      const select = new Select(users)

      const externalUsers: ExternalUser[] = [
        { userId: 'ext1', userName: 'ALICE', userAge: 30 },
        { userId: 'ext2', userName: 'BOB', userAge: 25 }
      ]

      // Case-insensitive matching
      const result = select.from(
        externalUsers,
        (external, internal) =>
          external.userName.toLowerCase() === internal?.name.toLowerCase()
      )

      expect(result.items).toHaveLength(2)
      expect(result.items[0]?.name).toBe('Alice')
      expect(result.items[1]?.name).toBe('Bob')
      expect(result.context.size).toBe(2)
    })
  })
})

describe('SingleSelect', () => {
  it('should extend BaseSelect', () => {
    const user = { id: 1, name: 'Alice', age: 30 }
    const single = new SingleSelect([user])

    expect(single.items).toHaveLength(1)
    expect(single.items[0]).toEqual(user)
    expect(single.context).toBeInstanceOf(Map)
    expect(single.context.size).toBe(0)
  })

  it('should support context in constructor', () => {
    const user = { id: 1, name: 'Alice', age: 30 }
    const context = new Map([['key', user]])
    const single = new SingleSelect([user], context)

    expect(single.context).toEqual(context)
    expect(single.context.size).toBe(1)
  })

  it('should handle empty items array', () => {
    const single = new SingleSelect<User, never>([])

    expect(single.items).toHaveLength(0)
    expect(single.context.size).toBe(0)
  })

  it('should handle undefined item', () => {
    const single = new SingleSelect<User | undefined, never>([undefined])

    expect(single.items).toHaveLength(1)
    expect(single.items[0]).toBeUndefined()
  })
})

