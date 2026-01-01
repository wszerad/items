import { defaultSelectId, SelectId, StrOrNum } from './selectId'
import { selector, Selector, SelectorFn } from './selector'
import { Updater } from './updater'
import { itemsDiff } from './diff'
import { update } from './updater'

export type ItemsOptions<E> = {
  selectId?: SelectId<E>
  sortComparer?: false | ((a: E, b: E) => number)
}

export interface ItemsState<E, I> {
  ids: I[]
  entities: Map<I, E>
}

export class Items<E, I extends StrOrNum = StrOrNum> {
  private state: ItemsState<E, I>

  constructor(
    items: Iterable<E> = [],
    private options: ItemsOptions<E> = {}
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

  insert(entity: E) {
    return this.insertMany([entity])
  }

  insertMany(entities: Iterable<E>) {
    return new Items<E, I>([
      ...this,
      ...Array.from(entities).filter(entity => !this.has(this.selectId(entity)))
    ], this.options)
  }

  upsert(entity: Partial<E>) {
    return this.upsertMany([entity])
  }

  upsertMany(entities: Iterable<Partial<E>>) {
    const clone = this.getEntities()
    Array.from(entities).forEach(entity => {
      const id = this.selectId(entity as E)
      const existing = clone.get(id)
      if (existing) {
        clone.set(id, { ...existing, ...entity } as E)
      } else {
        clone.set(id, entity as E)
      }
    })
    return new Items<E, I>(clone.values(), this.options)
  }

  set(entity: E) {
    return this.setMany([entity])
  }

  setMany(entities: Iterable<E>) {
    return new Items<E, I>([
      ...this,
      ...entities
    ], this.options)
  }

  every(check: SelectorFn<E>) {
    return this.getIds().every(id => check(this.select(id)!))
  }

  some(check: SelectorFn<E>) {
    return this.getIds().some(id => check(this.select(id)!))
  }

  has(id: I) {
    return this.state.ids.includes(id)
  }

  hasMany(select: Selector<E, I>) {
    let failToFind = false
    let result = false
    selector(this, select, (entity) => {
      if (entity) {
        result = true
      } else {
        failToFind = true
      }
    })
    return !failToFind && result
  }

  update(id: I, updater: Updater<E>) {
    const entity = this.select(id)
    if (!entity) {
      return this
    }
    const clone = this.getEntities()
    clone.set(id, update(entity, updater))
    return new Items<E, I>(clone.values(), this.options)
  }

  updateMany(select: Selector<E, I>, updater: Updater<E>) {
    const clone = this.getEntities()
    selector(this, select, (entity, id) => {
      if (entity) {
        clone.set(id, update(entity, updater))
      }
    })
    return new Items<E, I>(clone.values(), this.options)
  }

  remove(id: I) {
    const clone = this.getEntities()
    clone.delete(id)
    return new Items<E, I>(clone.values(), this.options)
  }

  removeMany(select: Selector<E, I>) {
    const clone = this.getEntities()
    selector(this, select, (_, id) => {
      clone.delete(id)
    })
    return new Items<E, I>(clone.values(), this.options)
  }

  clear() {
    return new Items<E, I>([], this.options)
  }

  filter(select: Selector<E, I>) {
    const clone = new Map<I, E>()

    selector(this, select, (entity, id) => {
      if (entity) {
        clone.set(id, entity)
      }
    })

    return new Items<E, I>(clone.values(), this.options)
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

  diff(base: Items<E, I>) {
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
    return this.options?.selectId?.(entity) as undefined || defaultSelectId(entity as E & { id: I })
  }

  private get sortComparer() {
    return this.options.sortComparer || false
  }

  [Symbol.iterator](): Iterator<E> {
    return this.state.entities.values()
  }
}
