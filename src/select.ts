import { MatchFn, TestFn } from './types'

// NOTE: E selected items, may be undefined as well
// NOTE: SE content type
export class BaseSelect<E, SE> {
  public context: Map<SE, E>

  constructor(
    public items: E[],
    context: Map<SE, E> = new Map()
  ) {
    // Automatically clean context to only include items that exist in items array
    this.context = this.cleanContext(items, context)
  }

  private cleanContext(items: E[], context: Map<SE, E>): Map<SE, E> {
    if (context.size === 0) {
      return new Map()
    }

    const cleanedContext = new Map<SE, E>()
    for (const [key, value] of context.entries()) {
      if (items.includes(value)) {
        cleanedContext.set(key, value)
      }
    }
    return cleanedContext
  }
}

export class SingleSelect<E, SE> extends BaseSelect<E, SE> {}

export class Select<E, SE> extends BaseSelect<E, SE> {
  take(len: number) {
    return new Select<E, SE>(this.items.slice(0, len), this.context)
  }

  skip(len: number) {
    return new Select<E, SE>(this.items.slice(len), this.context)
  }

  filter(testFn: TestFn<E>) {
    return new Select<E, SE>(this.items.filter((entry) => testFn(entry)), this.context)
  }

  revert(){
    return new Select<E, SE>([...this.items].reverse(), this.context)
  }

  sort(sortFn: (x: E, y: E) => number) {
    return new Select<E, SE>([...this.items].sort((a, b) => sortFn(a, b)), this.context)
  }

  at(index: number) {
    const item = this.items[index]
    return new SingleSelect<E | undefined, SE>([item], this.context)
  }

  find(testFn: TestFn<E>) {
    const item = this.items.find((entry) => testFn(entry))
    return new SingleSelect<E | undefined, SE>(item ? [item] : [], this.context)
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
