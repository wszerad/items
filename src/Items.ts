import { defaultSelectId, SelectId } from './selectId'
import { selector, Selector, SelectorFn } from './selector'
import { Updater } from './updater'
import { itemsDiff } from './diff'
import { update } from './updater'

export interface ItemsOptions<I, E> {
  selectId?: SelectId<I, E>
  sortComparer?: false | ((a: E, b: E) => number)
}

export interface ItemsState<I, E> {
  ids: I[]
  entities: Map<I, E>
}

export class Items<I, E> {
  private state: ItemsState<I, E>

  constructor(
    items: Iterable<E> = [],
    private options: ItemsOptions<I, E> = {}
  ) {
    const entities = new Map(
      Array
        .from(items)
        .map((item) => {
          const id = this.selectId(item)
          return [id, item]
        })
    )

    this.state = {
      ids: this.sortIds([...entities.keys()], entities),
      entities
    }
  }

  getIds(): I[] {
    return [...this.state.ids]
  }

  getEntities(): Map<I, E> {
    return new Map(this.state.entities)
  }

  get length(): number {
    return this.state.ids.length
  }

  select(id: I): E | undefined {
    return this.state.entities.get(id)
  }

  insert(entities: Iterable<E>) {
    return new Items([
      ...this,
      ...Array.from(entities).filter(entity => !this.has(this.selectId(entity)))
    ], this.options)
  }

  upsert(entities: Iterable<E>) {
    const clone = this.getEntities()
    Array.from(entities).forEach(entity => {
      const id = this.selectId(entity)
      const existing = clone.get(id) || {}
      clone.set(id, { ...existing, ...entity })
    })
    return new Items(clone.values(), this.options)
  }

  set(entities: Iterable<E>) {
    return new Items([
      ...this,
      ...entities
    ], this.options)
  }

  every(check: SelectorFn<I, E>) {
    return this.getIds().every(id => check(this.select(id)!))
  }

  some(check: SelectorFn<I, E>) {
    return this.getIds().some(id => check(this.select(id)!))
  }

  has(select: Selector<I, E>) {
    let failToFind = false
    let result = false
    selector(this, select, (entity, id) => {
      if (entity) {
        result = true
      } else {
        failToFind = true
      }
    })
    return !failToFind && result
  }

  update(select: Selector<I, E>, updater: Updater<I, E>) {
    const clone = this.getEntities()
    selector(this, select, (entity, id) => {
      if (entity) {
        clone.set(id, update(entity, updater))
      }
    })
    return new Items(clone.values(), this.options)
  }

  remove(select: Selector<I, E>) {
    const clone = this.getEntities()
    selector(this, select, (_, id) => {
      clone.delete(id)
    })
    return new Items(clone.values(), this.options)
  }

  clear(): Items<I, E> {
    return new Items([], this.options)
  }

  filter(select: Selector<I, E>) {
    const clone = new Map<I, E>()

    selector(this, select, (entity, id) => {
      if (entity) {
        clone.set(id, entity)
      }
    })

    return new Items(clone.values(), this.options)
  }

  page(page: number, pageSize: number) {
    const totalPages = Math.ceil(this.length / pageSize)
    return {
      items: this.getIds()
        .slice(page * pageSize, (page + 1) * pageSize)
        .map(id => this.select(id)!),
      page,
      pageSize,
      hasNext: page < totalPages - 1,
      hasPrevious: page > 0,
      total: this.length,
      totalPages
    }
  }

  diff(base: Items<I, E>) {
    return itemsDiff(base, this)
  }

  private sortIds(
    ids: I[],
    entities: Map<I, E>
  ): Array<I> {
    if (this.sortComparer === false) {
      return ids
    }
    const sorter = this.sortComparer
    return [...ids].sort((aId, bId) => {
      const a = entities.get(aId)!
      const b = entities.get(bId)!
      return sorter(a, b)
    })
  }

  private selectId(entity: E): I {
    return this.options?.selectId?.(entity) || defaultSelectId(entity as E & { id: I })
  }

  private get sortComparer() {
    return this.options.sortComparer || false
  }

  [Symbol.iterator](): Iterator<E> {
    return this.state.entities.values()
  }
}
