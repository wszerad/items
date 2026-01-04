import { MatchFn, TestFn } from './types'

// NOTE: E selected items, may be undefined as well
// NOTE: SE content type
export class BaseSelect<E, SE> {
  constructor(
    public items: E[],
    public context: Map<SE, E> = new Map()
  ) {}
}

export class SingleSelect<E, SE> extends BaseSelect<E, SE> {}

export class Select<E, SE> extends BaseSelect<E, SE> {
  take(len: number) {
    return new Select<E, SE>(this.items.slice(0, len))
  }

  skip(len: number) {
    return new Select<E, SE>(this.items.slice(len))
  }

  filter(testFn: TestFn<E>) {
    const filteredIds = this.items.filter((entry) => {
      return testFn(entry)
    })
    return new Select<E, SE>(filteredIds)
  }

  revert(){
    return new Select<E, SE>([...this.items].reverse())
  }

  sort(sortFn: (x: E, y: E) => number) {
    const sortedIds = [...this.items]
      .sort((a, b) => {
        return sortFn(a, b)
      })
    return new Select<E, SE>(sortedIds)
  }

  at(index: number) {
    const id = this.items[index]
    return new SingleSelect<E | undefined, SE>([id])
  }

  find(testFn: TestFn<E>) {
    const id = this.items.find((entry) => {
      return testFn(entry)
    })
    return new SingleSelect<E | undefined, SE>(id ? [id] : [])
  }

  from<T>(entities: Iterable<E>): Select<E, SE>
  from<T>(entities: Iterable<T>, matcher: MatchFn<E, T>): Select<E | undefined, T>
  from<T>(entities: Iterable<E> | Iterable<T>, matcher?: MatchFn<E, T>): Select<E, SE> | Select<E | undefined, T> {
    if (matcher) {
      const items = Array.from(entities as Iterable<T>)
      const pairs = new Map(
        items
          .map(entry => {
            const pair = this.items.find(item => matcher(entry, item))
            return [entry, pair]
          }) as [T, E | undefined][]
      )
      return new Select<E | undefined, T>(Array.from(pairs.values()), pairs)
    } else {
      return new Select<E, SE>(Array.from(entities as Iterable<E>))
    }
  }

  on<T>(entry: E): SingleSelect<E, SE>
  on<T>(entry: T, matcher: MatchFn<E, T>): SingleSelect<E | undefined, T>
  on<T>(entry: E, matcher?: MatchFn<E, T>): SingleSelect<E, SE> | SingleSelect<E | undefined, T> {
    if (matcher) {
      const select = this.from([entry as unknown as T], matcher)
      return new SingleSelect<E | undefined, T>(select.items, select.context)
    } else {
      const select = this.from([entry])
      return new SingleSelect<E, SE>(select.items, select.context)
    }
  }
}
