import { CheckFn, ItemId, ItemsOptions, ItemsState, Selector, Updater } from './types'
import { defaultSelectId } from './utils'
import { Select, SingleSelect } from './select'
import { itemsDiff } from './diff'

export class Items<E extends Object, I extends ItemId> {
  private state: ItemsState<E, I>

  constructor(
    items: Iterable<E> = [],
    private options: ItemsOptions<E> = {}
  ) {
    const entities = new Map(
      Array
        .from(items)
        .map((item) => {
          const id = this.extractId(item)
          return [id, item]
        })
        .filter(([id]) => id !== undefined) as [I, E][]
    )

    this.state = {
      ids: this.sortIds([...entities.keys()], entities),
      entities
    }
  }

  // NOTE: Add item if id not exists
  add(items: Iterable<E>) {
    const newEntities = new Map(this.state.entities)

    Array.from(items).forEach((item) => {
      const id = this.extractId(item)
      if (id === undefined) {
        return
      }
      if (!newEntities.has(id)) {
        newEntities.set(id, item)
      }
    })

    return new Items<E, I>(newEntities.values(), this.options)
  }

  // NOTE: update selected ids with partial data or call function (even if selected id not exists)
  update(select: Selector<E, I>, updater: Updater<E>) {
    const [, entities] = this.resolveSelector(select)
    const newEntities = new Map(this.state.entities)
    const isFn = typeof updater === 'function'

    entities
      .forEach((entity) => {
        const id = this.extractId(entity)!
        if (isFn) {
          newEntities.set(id, updater(entity))
        } else if (entity) {
          newEntities.set(id, { ...entity, ...updater })
        }
      })

    return new Items<E, I>(newEntities.values(), this.options)
  }

  // NOTE: add if not exists, overwrite if exists
  merge(items: Iterable<E>) {
    const newEntities = new Map(this.state.entities)

    Array
      .from(items)
      .map(item => [this.extractId(item), item] as [I, E])
      .filter(([id]) => id !== undefined)
      .forEach(([id, item]) => {
        const entry = this.get(id)
        newEntities.set(id, entry ? { ...entry, ...item } : item)
      })

    return new Items<E, I>(newEntities.values(), this.options)
  }

  remove(select: Selector<E, I>) {
    const [, entities] = this.resolveSelector(select)
    const selectedIds = entities.map(entity => this.extractId(entity))
    const idsToKeep = this.state.ids.filter(id => !selectedIds.includes(id))
    const items = idsToKeep.map(id => this.get(id)!)
    return new Items<E, I>(items, this.options)
  }

  pick(select: Selector<E, I>) {
    const [, entities] = this.resolveSelector(select)
    return new Items<E, I>(entities, this.options)
  }

  select(select: I): E | undefined
  select(select: Iterable<I>): E[]
  select(select: (selector: Select<E, I>) => Select<E, I>): E[]
  select(select: (selector: Select<E, I>) => SingleSelect<E, I>): E | undefined
  select(select: Selector<E, I>): undefined | E | E[] {
    const [single, entities] = this.resolveSelector(select)
    return single ? entities[0] : entities
  }

  selectId(select: (selector: Select<E, I>) => Select<E, I>): I[]
  selectId(select: (selector: Select<E, I>) => SingleSelect<E, I>): I
  selectId(select: Selector<E, I>): undefined | I | I[] {
    const [single, entities] = this.resolveSelector(select)
    return single
      ? this.extractId(entities[0])
      : entities.map(entity => this.extractId(entity)!)
  }

  clear() {
    return new Items<E, I>([], this.options)
  }

  every(check: CheckFn<E>) {
    return this.getIds().every(id => check(this.get(id)!))
  }

  some(check: CheckFn<E>) {
    return this.getIds().some(id => check(this.get(id)!))
  }

  has(id: I) {
    return this.state.ids.includes(id)
  }

  get(id: I ): E | undefined
  get(id: undefined): undefined
  get(id: I | undefined): E | undefined {
    return id === undefined ? undefined : this.state.entities.get(id)
  }

  getIds(): I[] {
    return [...this.state.ids]
  }

  getEntities(): E[] {
    return this.state.ids.map(id => this.get(id)!)
  }

  get length(): number {
    return this.state.ids.length
  }

  private resolveSelector<SE, ST extends E>(select: Selector<E, I, SE, ST>): [boolean, ST[], Map<SE, ST>]{
    if (typeof select === 'function') {
      const newSelect = new Select(this.getEntities(), this)
      const result = select(newSelect)
      return [result instanceof SingleSelect, result.items, result.context]
    } else if (typeof select === 'string' || typeof select === 'number') {
      return [true, [select].map(id => this.get(id)), []]
    } else {
      return [false, Array.from(select).map(id => this.get(id)!), []]
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

  extractId(entity: E | undefined): I | undefined {
    if (!entity) {
      return undefined
    }

    return this.options?.selectId?.(entity) as undefined || defaultSelectId(entity as E & { id: I })
  }

  private get sortComparer() {
    return this.options.sortComparer || false
  }

  [Symbol.iterator](): Iterator<E> {
    return this.state.entities.values()
  }

  static compare<E extends Object, I extends ItemId>(base: Items<E, I>, to: Items<E, I>) {
    return itemsDiff(base, to)
  }
}

