import type { ItemId } from './types'
import type { Items } from './Items'

export class BaseSelect<E> {
  constructor(
    public ids: ItemId[],
    public self: Items<E>
  ) {}
}

export class SingleSelect<E> extends BaseSelect<E> {}

export class Select<E> extends BaseSelect<E> {
  take(len: number): Select<E> {
    return new Select(this.ids.slice(0, len), this.self)
  }

  skip(len: number): Select<E> {
    return new Select(this.ids.slice(len), this.self)
  }

  filter(testFn: (entry: E, id: ItemId, index: number) => boolean): Select<E> {
    const filteredIds = this.ids.filter((id, index) => {
      const entry = this.self.get(id)!
      return testFn(entry, id, index)
    })
    return new Select(filteredIds, this.self)
  }

  revert(): Select<E> {
    return new Select([...this.ids].reverse(), this.self)
  }

  sort(sortFn: (x: E, y: E) => number): Select<E> {
    const sortedIds = [...this.ids].sort((aId, bId) => {
      const a = this.self.get(aId)!
      const b = this.self.get(bId)!
      return sortFn(a, b)
    })
    return new Select(sortedIds, this.self)
  }

  at(index: number): SingleSelect<E> {
    const id = this.ids[index]
    return new SingleSelect([id], this.self)
  }

  from(entities: Iterable<E>): Select<E> {
    const newIds = Array.from(entities).map(entry => this.self.extractId(entry))
    return new Select(newIds, this.self)
  }

  on(entry: E): SingleSelect<E> {
    const id = this.self.extractId(entry)
    return new SingleSelect([id], this.self)
  }
}
