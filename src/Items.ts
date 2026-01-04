import {
  CheckFn, ItemId, ItemsOptions, ItemsState, Selector, SelectorChain, SelectorSelect,
  SelectorSelectSingle, Updater
} from './types'
import { defaultSelectId } from './utils'
import { Select, SingleSelect } from './select'
import { itemsDiff } from './diff'

export class Items<E extends Object, I extends ItemId = ItemId> {
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

  // NOTE: update selected ids with partial data or call function
  update<SE, EE>(select: Selector<E, EE, I, SE>, updater: Partial<E>): Items<E, I>
  update<SE, EE>(select: I | Iterable<I>, updater: Updater<E, E, E>): Items<E, I>
  update<SE, EE>(select: SelectorChain<E, EE, SE>, updater: Updater<E, EE, SE>): Items<E, I>
  update<SE, EE>(select: Selector<E, EE, I, SE>, updater: Updater<E, EE, SE>): Items<E, I> {
    const [, entities, map] = this.resolveSelector(select)
    const newEntities = new Map(this.state.entities)
    const isFn = typeof updater === 'function'

    if (isFn && map.size) {
      Array
        .from(map.entries())
        .forEach(([entity, pair]) => {
          const updatedEntry = updater(pair, entity)
          const id = this.extractId(updatedEntry)!
          newEntities.set(id, updatedEntry)
        })

      return new Items<E, I>(newEntities.values(), this.options)
    }

    entities
      .forEach((entity) => {
        if (isFn) {
          const updatedEntry = updater(entity)
          const id = this.extractId(updatedEntry)!
          newEntities.set(id, updatedEntry)
        } else if (entity) {
          const updatedEntry = { ...(entity as unknown as E), ...updater }
          const id = this.extractId(updatedEntry)!
          newEntities.set(id, updatedEntry)
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

  remove<EE extends E = E>(select: Selector<E, EE, I>) {
    const [, entities] = this.resolveSelector(select)
    const selectedIds = entities.map(entity => this.extractId(entity as E))
    const idsToKeep = this.state.ids.filter(id => !selectedIds.includes(id))
    const items = idsToKeep.map(id => this.get(id)!)
    return new Items<E, I>(items, this.options)
  }

  pick<EE extends E = E>(select: Selector<E, EE, I>) {
    const [, entities] = this.resolveSelector(select)
    return new Items<E, I>(entities as E[], this.options)
  }

  select<EE, SE = never>(select: I): E | undefined
  select<EE, SE = never>(select: Iterable<I>): E[]
  select<EE, SE = never>(select: SelectorSelectSingle<E, EE, SE>): E | undefined
  select<EE, SE = never>(select: SelectorSelect<E, EE, SE>): E[]
  select<EE, SE = never>(select: Selector<E, EE, I, SE>): undefined | E | E[] {
    let [single, entities] = this.resolveSelector(select)
    entities = entities.filter(Boolean)
    return single ? entities[0] as unknown as E : entities as unknown as E[]
  }

  selectId<EE, SE = never>(select: I): I | undefined
  selectId<EE, SE = never>(select: Iterable<I>): I[]
  selectId<EE, SE = never>(select: SelectorSelectSingle<E, EE, SE>): I | undefined
  selectId<EE, SE = never>(select: SelectorSelect<E, EE, SE>): I[]
  selectId<EE, SE = never>(select: Selector<E, EE, I, SE>): undefined | I | I[] {
    let [single, entities] = this.resolveSelector(select)
    entities = entities.filter(Boolean)
    return single
      ? this.extractId(entities[0] as unknown as E)
      : entities.map(entity => this.extractId(entity as unknown as E)!)
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

  private resolveSelector<EE, SE>(select: Selector<E, EE, I, SE>): [boolean, EE[], Map<SE, EE>] {
    if (typeof select === 'function') {
      const newSelect = new Select<E, unknown>(this.getEntities())
      const result = select(newSelect)
      return [result instanceof SingleSelect, result.items as EE[], result.context as Map<SE, EE>]
    } else if (typeof select === 'string' || typeof select === 'number') {
      return [true, [this.get(select) as EE], new Map()]
    } else {
      return [false, Array.from(select).map(id => this.get(id) as EE), new Map()]
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

    return (this.options?.selectId?.(entity) || defaultSelectId(entity as E & { id: I })) as I
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

