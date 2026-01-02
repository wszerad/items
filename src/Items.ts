import type { CheckFn, ItemId, ItemsOptions, ItemsState, Selector, Updater } from './types'
import { defaultSelectId } from './utils'
import { Select, SingleSelect } from './select'
import { itemsDiff } from './diff'

export class Items<E> {
  private state: ItemsState<E, ItemId>

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
    )

    this.state = {
      ids: this.sortIds([...entities.keys()], entities),
      entities
    }
  }

  // NOTE: Add item if id not exists
  add(items: Iterable<E>): Items<E> {
    const newEntities = new Map(this.state.entities)

    Array.from(items).forEach((item) => {
      const id = this.extractId(item)
      if (!newEntities.has(id)) {
        newEntities.set(id, item)
      }
    })

    return new Items<E>(newEntities.values(), this.options)
  }

  // NOTE: update selected ids with partial data or call function (even if selected id not exists)
  update(select: Selector<E>, updater: Updater<E>): Items<E> {
    const [, selectedIds] = this.resolveSelector(select)
    const newEntities = new Map(this.state.entities)
    const isFn = typeof updater === 'function'

    selectedIds
      .forEach((id) => {
        const entity = newEntities.get(id)

        if (isFn) {
          newEntities.set(id, updater(entity))
        } else if (entity) {
          newEntities.set(id, { ...entity, ...updater })
        }
      })

    return new Items<E>(newEntities.values(), this.options)
  }

  // NOTE: add if not exists, overwrite if exists
  merge(items: Iterable<E>): Items<E> {
    const newEntities = new Map(this.state.entities)

    Array.from(items).forEach((item) => {
      const id = this.extractId(item)
      const entry = this.get(id)
      newEntities.set(id, entry ? { ...entry, ...item } : item)
    })

    return new Items<E>(newEntities.values(), this.options)
  }

  remove(select: Selector<E>): Items<E> {
    const [, selectedIds] = this.resolveSelector(select)
    const idsToKeep = this.state.ids.filter(id => !selectedIds.includes(id))
    const items = idsToKeep.map(id => this.get(id)!)
    return new Items<E>(items, this.options)
  }

  pick(select: Selector<E>): Items<E> {
    const [, selectedIds] = this.resolveSelector(select)
    const items = selectedIds.map(id => this.get(id)!)
    return new Items<E>(items, this.options)
  }

  select(select: ItemId): E | undefined
  select(select: Iterable<ItemId>): E[]
  select(select: (selector: Select<E>) => Select<E>): E[]
  select(select: (selector: Select<E>) => SingleSelect<E>): E | undefined
  select(select: Selector<E>): undefined | E | E[] {
    const [single, selectedIds] = this.resolveSelector(select)
    const items = selectedIds.map(id => this.get(id)).filter(Boolean) as E[]
    return single ? items[0] : items
  }

  selectId(select: (selector: Select<E>) => Select<E>): ItemId[]
  selectId(select: (selector: Select<E>) => SingleSelect<E>): ItemId | undefined
  selectId(select: Selector<E>): undefined | ItemId | ItemId[] {
    const [single, selectedIds] = this.resolveSelector(select)
    return single ? selectedIds[0] : selectedIds
  }

  clear(): Items<E> {
    return new Items<E>([], this.options)
  }

  every(check: CheckFn<E>) {
    return this.getIds().every(id => check(this.get(id)!))
  }

  some(check: CheckFn<E>) {
    return this.getIds().some(id => check(this.get(id)!))
  }

  has(id: ItemId) {
    return this.state.ids.includes(id)
  }

  get(id: ItemId): E | undefined {
    return this.state.entities.get(id)
  }

  getIds(): ItemId[] {
    return [...this.state.ids]
  }

  getEntities(): E[] {
    return this.state.ids.map(id => this.get(id)!)
  }

  get length(): number {
    return this.state.ids.length
  }

  private resolveSelector(select: Selector<E>): [boolean, ItemId[]]{
    if (typeof select === 'function') {
      const newSelect = new Select(this.state.ids, this)
      const result = select(newSelect)
      return [result instanceof SingleSelect, result.ids]
    } else if (typeof select === 'string' || typeof select === 'number') {
      return [true, [select]]
    } else {
      return [false, Array.from(select)]
    }
  }

  private sortIds(
    ids: ItemId[],
    entities: Map<ItemId, E>
  ): Array<ItemId> {
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

  extractId(entity: E): ItemId {
    return this.options?.selectId?.(entity) as undefined || defaultSelectId(entity as E & { id: ItemId })
  }

  private get sortComparer() {
    return this.options.sortComparer || false
  }

  [Symbol.iterator](): Iterator<E> {
    return this.state.entities.values()
  }

  static compare<E>(base: Items<E>, to: Items<E>) {
    return itemsDiff(base, to)
  }
}

