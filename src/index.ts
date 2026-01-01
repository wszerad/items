import { selectiveOperation, Selector } from './selector'
import { update, Updater } from './updater'
import { defaultSelectId } from './selectId'
import { diff } from 'ohash/utils'

export interface ItemsOptions<T> {
  selectId?: (entity: T) => string | number
  sortComparer?: false | ((a: T, b: T) => number)
}

export interface ItemsState<I, E> {
  ids: I[]
  entities: Map<I, E>
}

export class Items<I, E> {
  private state: ItemsState<I, E>

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

  insert(...entities: E[]) {
    return new Items([
      ...this,
      ...entities.filter(entity => !this.has(this.selectId(entity)))
    ], this.options)
  }

  upsert(...entities: E[]) {
    return new Items([
      ...this,
      ...entities
    ], this.options)
  }

  has(selector: Selector<I, E>) {
    let result = true
    selectiveOperation(this, selector, (entity, id) => {
      if (!entity) {
        result = false
      }
    })
    return result
  }

  update(selector: Selector<I, E>, updater: Updater<I, E>) {
    const clone = this.getEntities()
    selectiveOperation(this, selector, (entity, id) => {
      if (entity) {
        clone.set(id, update(entity, updater))
      }
    })
    return new Items(clone.values(), this.options)
  }

  remove(selector: Selector<I, E>) {
    const clone = this.getEntities()
    selectiveOperation(this, selector, (_, id) => {
      clone.delete(id)
    })
    return new Items(clone.values(), this.options)
  }

  clear(): Items<I, E> {
    return new Items([], this.options)
  }

  filter(selector: Selector<I, E>) {
    const clone = new Map<I, E>()

    selectiveOperation(this, selector, (entity, id) => {
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
      hasNext: page < totalPages,
      hasPrevious: page > 0,
      total: this.length,
      totalPages
    }
  }

  map<U>(fn: (entity: E, id: string | number) => U): U[] {
    return this.state.ids.map(id => fn(this.state.entities[id], id))
  }

  diff(base: Items<I, E>) {
    const ids = new Set(this.getIds())
    const baseIds = new Set(base.getIds())

    const removed: I[] = []
    const updated = []

    ids.forEach(id => {
      if (!baseIds.has(id)) {
        removed.push(id)
      } else {
        const d = diff(this.select(id), base.select(id))
        updated.push(id)
        baseIds.delete(id)
      }
    })

    const added = [...baseIds]

    return {
      added,
      removed,
      updated:
    }
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
    return this.options?.selectId?.(entity) || defaultSelectId(entity)
  }

  private get sortComparer() {
    return this.options.sortComparer || false
  }

  [Symbol.iterator](): Iterator<E> {
    return this.state.entities.values()
  }
}

