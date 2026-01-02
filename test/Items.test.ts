import { describe, it, expect } from 'vitest'
import { Items } from '../src/Items'

interface User {
  id: number
  name: string
  age: number
  active?: boolean
}

describe('Items', () => {
  describe('constructor', () => {
    it('should create empty Items instance', () => {
      const items = new Items<User>()
      expect(items.length).toBe(0)
      expect(items.getIds()).toEqual([])
      expect(items.getEntities()).toEqual([])
    })

    it('should create Items from iterable', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ]
      const items = new Items(users)
      expect(items.length).toBe(2)
      expect(items.getIds()).toEqual([1, 2])
    })

    it('should use custom selectId function', () => {
      const users = [
        { userId: 'a1', name: 'Alice', age: 30 },
        { userId: 'b2', name: 'Bob', age: 25 }
      ]
      const items = new Items(users, { selectId: (u) => u.userId })
      expect(items.getIds()).toEqual(['a1', 'b2'])
    })

    it('should sort items with sortComparer', () => {
      const users: User[] = [
        { id: 3, name: 'Charlie', age: 35 },
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ]
      const items = new Items(users, {
        sortComparer: (a, b) => a.age - b.age
      })
      expect(items.getIds()).toEqual([2, 1, 3])
      expect(items.getEntities()[0].name).toBe('Bob')
    })

    it('should handle duplicate ids by keeping last', () => {
      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 1, name: 'Alice2', age: 35 }
      ]
      const items = new Items(users)
      expect(items.length).toBe(1)
      expect(items.get(1)?.name).toBe('Alice2')
    })
  })

  describe('add', () => {
    it('should add new items', () => {
      const items = new Items<User>([{ id: 1, name: 'Alice', age: 30 }])
      const updated = items.add([{ id: 2, name: 'Bob', age: 25 }])

      expect(updated.length).toBe(2)
      expect(updated.getIds()).toEqual([1, 2])
    })

    it('should not add items with existing id', () => {
      const items = new Items<User>([{ id: 1, name: 'Alice', age: 30 }])
      const updated = items.add([{ id: 1, name: 'Alice2', age: 35 }])

      expect(updated.length).toBe(1)
      expect(updated.get(1)?.name).toBe('Alice')
    })

    it('should not mutate original Items', () => {
      const items = new Items<User>([{ id: 1, name: 'Alice', age: 30 }])
      items.add([{ id: 2, name: 'Bob', age: 25 }])

      expect(items.length).toBe(1)
    })
  })

  describe('update', () => {
    it('should update items by id selector', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ])
      const updated = items.update(1, { age: 31 })

      expect(updated.get(1)?.age).toBe(31)
      expect(updated.get(1)?.name).toBe('Alice')
    })

    it('should update items by iterable selector', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ])
      const updated = items.update([1, 3], { active: true })

      expect(updated.get(1)?.active).toBe(true)
      expect(updated.get(2)?.active).toBeUndefined()
      expect(updated.get(3)?.active).toBe(true)
    })

    it('should update items by function selector', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ])
      const updated = items.update(
        (s) => s.filter((e: User) => e.age > 25),
        { active: true }
      )

      expect(updated.get(1)?.active).toBe(true)
      expect(updated.get(2)?.active).toBeUndefined()
      expect(updated.get(3)?.active).toBe(true)
    })

    it('should update with updater function', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ])
      const updated = items.update([1, 2], (user) => ({
        ...user!,
        age: user!.age + 1
      }))

      expect(updated.get(1)?.age).toBe(31)
      expect(updated.get(2)?.age).toBe(26)
    })

    it('should create new item if id not exists with function updater', () => {
      const items = new Items<User>([{ id: 1, name: 'Alice', age: 30 }])
      const updated = items.update(2, () => ({ id: 2, name: 'Bob', age: 25 }))

      expect(updated.length).toBe(2)
      expect(updated.get(2)?.name).toBe('Bob')
    })
  })

  describe('merge', () => {
    it('should merge new items', () => {
      const items = new Items<User>([{ id: 1, name: 'Alice', age: 30 }])
      const merged = items.merge([{ id: 2, name: 'Bob', age: 25 }])

      expect(merged.length).toBe(2)
      expect(merged.get(2)?.name).toBe('Bob')
    })

    it('should overwrite existing items', () => {
      const items = new Items<User>([{ id: 1, name: 'Alice', age: 30 }])
      const merged = items.merge([{ id: 1, name: 'Alice', age: 35 }])

      expect(merged.length).toBe(1)
      expect(merged.get(1)?.age).toBe(35)
    })

    it('should merge partial properties', () => {
      const items = new Items<User>([{ id: 1, name: 'Alice', age: 30 }])
      const merged = items.merge([{ id: 1, age: 31 } as any])

      expect(merged.get(1)?.name).toBe('Alice')
      expect(merged.get(1)?.age).toBe(31)
    })
  })

  describe('remove', () => {
    it('should remove items by id', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ])
      const removed = items.remove(1)

      expect(removed.length).toBe(1)
      expect(removed.has(1)).toBe(false)
      expect(removed.has(2)).toBe(true)
    })

    it('should remove items by iterable', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ])
      const removed = items.remove([1, 3])

      expect(removed.length).toBe(1)
      expect(removed.getIds()).toEqual([2])
    })

    it('should remove items by function selector', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ])
      const removed = items.remove((s) => s.filter((e: User) => e.age > 25))

      expect(removed.length).toBe(1)
      expect(removed.getIds()).toEqual([2])
    })
  })

  describe('pick', () => {
    it('should pick items by id', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ])
      const picked = items.pick(1)

      expect(picked.length).toBe(1)
      expect(picked.getIds()).toEqual([1])
    })

    it('should pick items by function selector', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ])
      const picked = items.pick((s) => s.filter((e: User) => e.age >= 30))

      expect(picked.length).toBe(2)
      expect(picked.getIds()).toEqual([1, 3])
    })
  })

  describe('select', () => {
    it('should select items and return array', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ])
      const selected = items.select([1, 2])

      expect(Array.isArray(selected)).toBe(true)
      expect(selected.length).toBe(2)
      expect(selected[0].name).toBe('Alice')
    })

    it('should select items by function', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ])
      const selected = items.select((s) => s.filter((e: User) => e.age > 25))

      expect(selected.length).toBe(2)
      expect(selected.map(u => u.name)).toEqual(['Alice', 'Charlie'])
    })

    it('should select single item with at() and return object', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ])
      const selected = items.select((s) => s.at(1))

      expect(selected).toBeDefined()
      expect(selected?.name).toBe('Bob')
      expect(selected?.id).toBe(2)
    })

    it('should select single item with on() and return object', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ])
      const user = { id: 1, name: 'Alice', age: 30 }
      const selected = items.select((s) => s.on(user))

      expect(selected).toBeDefined()
      expect(selected?.name).toBe('Alice')
    })

    it('should return undefined for single select with invalid index', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 }
      ])
      const selected = items.select((s) => s.at(10))

      expect(selected).toBeUndefined()
    })
  })

  describe('clear', () => {
    it('should remove all items', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ])
      const cleared = items.clear()

      expect(cleared.length).toBe(0)
      expect(cleared.getIds()).toEqual([])
    })
  })

  describe('every', () => {
    it('should return true if all items match', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ])
      const result = items.every((u) => u.age > 20)

      expect(result).toBe(true)
    })

    it('should return false if any item does not match', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ])
      const result = items.every((u) => u.age > 25)

      expect(result).toBe(false)
    })
  })

  describe('some', () => {
    it('should return true if any item matches', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ])
      const result = items.some((u) => u.age > 25)

      expect(result).toBe(true)
    })

    it('should return false if no items match', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ])
      const result = items.some((u) => u.age > 40)

      expect(result).toBe(false)
    })
  })

  describe('has', () => {
    it('should return true if id exists', () => {
      const items = new Items<User>([{ id: 1, name: 'Alice', age: 30 }])
      expect(items.has(1)).toBe(true)
    })

    it('should return false if id does not exist', () => {
      const items = new Items<User>([{ id: 1, name: 'Alice', age: 30 }])
      expect(items.has(2)).toBe(false)
    })
  })

  describe('get', () => {
    it('should return item by id', () => {
      const items = new Items<User>([{ id: 1, name: 'Alice', age: 30 }])
      const user = items.get(1)

      expect(user?.name).toBe('Alice')
    })

    it('should return undefined if id does not exist', () => {
      const items = new Items<User>([{ id: 1, name: 'Alice', age: 30 }])
      const user = items.get(2)

      expect(user).toBeUndefined()
    })
  })

  describe('getIds', () => {
    it('should return array of ids', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ])
      expect(items.getIds()).toEqual([1, 2])
    })

    it('should return new array instance', () => {
      const items = new Items<User>([{ id: 1, name: 'Alice', age: 30 }])
      const ids1 = items.getIds()
      const ids2 = items.getIds()

      expect(ids1).toEqual(ids2)
      expect(ids1).not.toBe(ids2)
    })
  })

  describe('getEntities', () => {
    it('should return array of entities', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ])
      const entities = items.getEntities()

      expect(entities.length).toBe(2)
      expect(entities[0].name).toBe('Alice')
      expect(entities[1].name).toBe('Bob')
    })
  })

  describe('length', () => {
    it('should return number of items', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ])
      expect(items.length).toBe(2)
    })
  })

  describe('extractId', () => {
    it('should return id of entity using default selector', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 }
      ])
      const user = { id: 2, name: 'Bob', age: 25 }
      expect(items.extractId(user)).toBe(2)
    })

    it('should return id of entity using custom selector', () => {
      const users = [
        { userId: 'a1', name: 'Alice', age: 30 }
      ]
      const items = new Items(users, { selectId: (u) => u.userId })
      const user = { userId: 'b2', name: 'Bob', age: 25 }
      expect(items.extractId(user)).toBe('b2')
    })
  })

  describe('selectId', () => {
    it('should return array of ids for multiple selections', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
      ])
      const ids = items.selectId((s) => s.filter((u: User) => u.age > 25))
      expect(Array.isArray(ids)).toBe(true)
      expect(ids).toEqual([1, 3])
    })

    it('should return single id when using at()', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ])
      const id = items.selectId((s) => s.at(0))
      expect(id).toBe(1)
    })

    it('should return undefined when single selection not found', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 }
      ])
      const id = items.selectId((s) => s.at(10))
      expect(id).toBeUndefined()
    })
  })

  describe('iterator', () => {
    it('should be iterable with for...of', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ])
      const names: string[] = []

      for (const user of items) {
        names.push(user.name)
      }

      expect(names).toEqual(['Alice', 'Bob'])
    })

    it('should work with Array.from', () => {
      const items = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ])
      const array = Array.from(items)

      expect(array.length).toBe(2)
      expect(array[0].name).toBe('Alice')
    })
  })

  describe('Items.compare', () => {
    it('should detect added items', () => {
      const before = new Items<User>([{ id: 1, name: 'Alice', age: 30 }])
      const after = before.add([{ id: 2, name: 'Bob', age: 25 }])

      const diff = Items.compare(before, after)

      expect(diff.added).toEqual([2])
      expect(diff.removed).toEqual([])
    })

    it('should detect removed items', () => {
      const before = new Items<User>([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ])
      const after = before.remove(2)

      const diff = Items.compare(before, after)

      expect(diff.added).toEqual([])
      expect(diff.removed).toEqual([2])
    })

    it('should detect updated items', () => {
      const before = new Items<User>([{ id: 1, name: 'Alice', age: 30 }])
      const after = before.update(1, { age: 31 })

      const diff = Items.compare(before, after)

      expect(diff.added).toEqual([])
      expect(diff.removed).toEqual([])
      expect(diff.updated.length).toBeGreaterThan(0)
      expect(diff.updated[0].id).toBe(1)
    })
  })
})

