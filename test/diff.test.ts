import { describe, it, expect } from 'vitest'
import { Items } from '../src/Items'
import { itemsDiff } from '../src/diff'

interface User {
  id: number
  name: string
  age: number
}

describe('itemsDiff', () => {
  it('should detect added items', () => {
    const from = new Items<User>([
      { id: 1, name: 'Alice', age: 30 }
    ])
    const to = new Items<User>([
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 }
    ])

    const diff = itemsDiff(from, to)

    expect(diff.added).toEqual([2])
    expect(diff.removed).toEqual([])
    expect(diff.updated).toEqual([])
  })

  it('should detect removed items', () => {
    const from = new Items<User>([
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 }
    ])
    const to = new Items<User>([
      { id: 1, name: 'Alice', age: 30 }
    ])

    const diff = itemsDiff(from, to)

    expect(diff.added).toEqual([])
    expect(diff.removed).toEqual([2])
    expect(diff.updated).toEqual([])
  })

  it('should detect updated items', () => {
    const from = new Items<User>([
      { id: 1, name: 'Alice', age: 30 }
    ])
    const to = new Items<User>([
      { id: 1, name: 'Alice', age: 31 }
    ])

    const diff = itemsDiff(from, to)

    expect(diff.added).toEqual([])
    expect(diff.removed).toEqual([])
    expect(diff.updated.length).toBe(1)
    expect(diff.updated[0].id).toBe(1)
    expect(diff.updated[0].changes.length).toBeGreaterThan(0)
  })

  it('should detect multiple changes', () => {
    const from = new Items<User>([
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 },
      { id: 3, name: 'Charlie', age: 35 }
    ])
    const to = new Items<User>([
      { id: 1, name: 'Alice', age: 31 }, // updated
      { id: 2, name: 'Bob', age: 25 },   // unchanged
      { id: 4, name: 'David', age: 40 }   // added (3 removed)
    ])

    const diff = itemsDiff(from, to)

    expect(diff.added).toEqual([4])
    expect(diff.removed).toEqual([3])
    expect(diff.updated.length).toBe(1)
    expect(diff.updated[0].id).toBe(1)
  })

  it('should not detect unchanged items', () => {
    const from = new Items<User>([
      { id: 1, name: 'Alice', age: 30 }
    ])
    const to = new Items<User>([
      { id: 1, name: 'Alice', age: 30 }
    ])

    const diff = itemsDiff(from, to)

    expect(diff.added).toEqual([])
    expect(diff.removed).toEqual([])
    expect(diff.updated).toEqual([])
  })

  it('should handle empty collections', () => {
    const from = new Items<User>([])
    const to = new Items<User>([])

    const diff = itemsDiff(from, to)

    expect(diff.added).toEqual([])
    expect(diff.removed).toEqual([])
    expect(diff.updated).toEqual([])
  })

  it('should handle adding to empty collection', () => {
    const from = new Items<User>([])
    const to = new Items<User>([
      { id: 1, name: 'Alice', age: 30 }
    ])

    const diff = itemsDiff(from, to)

    expect(diff.added).toEqual([1])
    expect(diff.removed).toEqual([])
  })

  it('should handle clearing collection', () => {
    const from = new Items<User>([
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 }
    ])
    const to = new Items<User>([])

    const diff = itemsDiff(from, to)

    expect(diff.added).toEqual([])
    expect(diff.removed).toEqual([1, 2])
  })
})

