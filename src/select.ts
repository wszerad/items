import { ItemId, MatchFn, TestFn } from './types'
import { Items } from './Items'

// NOTE: E items in Items
// NOTE: I Items id type
// NOTE: SE entries provided by from/on
// NOTE: ST items filtered from Items but with undefined possibility
export class BaseSelect<E extends Object, I extends ItemId, SE = E, ST extends E | undefined = E> {
  constructor(
    public items: ST[],
    public self: Items<E, I>,
    public context: Map<SE, ST> = new Map()
  ) {}
}

export class SingleSelect<E extends Object, I extends ItemId, SE = E, ST extends E | undefined = E> extends BaseSelect<E, I, SE, ST> {}

export class Select<E extends Object, I extends ItemId, SE = E, ST extends E | undefined = E> extends BaseSelect<E, I, SE, ST> {
  take(len: number) {
    return new Select<E, I, SE, ST>(this.items.slice(0, len), this.self)
  }

  skip(len: number) {
    return new Select<E, I, SE, ST>(this.items.slice(len), this.self)
  }

  filter(testFn: TestFn<ST>) {
    const filteredIds = this.items.filter((entry) => {
      return testFn(entry)
    })
    return new Select<E, I, SE, ST>(filteredIds, this.self)
  }

  revert(){
    return new Select<E, I, SE, ST>([...this.items].reverse(), this.self)
  }

  sort(sortFn: (x: ST, y: ST) => number) {
    const sortedIds = [...this.items]
      .sort((a, b) => {
        return sortFn(a, b)
      })
    return new Select<E, I, SE, ST>(sortedIds, this.self)
  }

  at(index: number) {
    const id = this.items[index]
    return new SingleSelect<E, I, SE, ST | undefined>([id], this.self)
  }

  find(testFn: TestFn<ST>) {
    const id = this.items.find((entry) => {
      return testFn(entry)
    })
    return new SingleSelect<E, I, SE, ST | undefined>(id ? [id] : [], this.self)
  }

  from<T>(entities: Iterable<E>): Select<E, I, SE, ST>
  from<T>(entities: Iterable<T>, matcher: MatchFn<ST, T>): Select<E, I, T, ST | undefined>
  from<T>(entities: Iterable<E> | Iterable<T>, matcher?: MatchFn<ST, T>): Select<E, I, SE, ST> | Select<E, I, T, ST | undefined> {
    if (matcher) {
      const items = Array.from(entities as Iterable<T>)
      const pairs = new Map(
        items
          .map(entry => {
            const pair = this.items.find(item => matcher(entry, item))
            return [entry, pair]
          }) as [T, ST | undefined][]
      )
      return new Select<E, I, T, ST | undefined>(Array.from(pairs.values()), this.self, pairs)
    } else {
      return new Select<E, I, SE, ST>(Array.from(entities as Iterable<ST>), this.self)
    }
  }

  on<T>(entry: E): SingleSelect<E, I, SE, ST>
  on<T>(entry: T, matcher: MatchFn<ST, T>): SingleSelect<E, I, T, ST | undefined>
  on<T>(entry: E, matcher?: MatchFn<ST, T>): SingleSelect<E, I, SE, ST> | SingleSelect<E, I, T, ST | undefined> {
    if (matcher) {
      const select = this.from([entry as unknown as T], matcher)
      return new SingleSelect<E, I, T, ST | undefined>(select.items, this.self, select.context)
    } else {
      const select = this.from([entry])
      return new SingleSelect<E, I, SE, ST>(select.items, this.self, select.context)
    }
  }
}
