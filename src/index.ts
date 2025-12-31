export interface ItemsOptions<T> {
  selectId?: (entity: T) => string | number
  sortComparer?: false | ((a: T, b: T) => number)
}

export interface ItemsState<T> {
  ids: Array<string | number>
  entities: Record<string | number, T>
}

export interface Update<T> {
  id: string | number
  changes: Partial<T>
}

export class Items<T> {
  private selectId: (entity: T) => string | number
  private sortComparer: false | ((a: T, b: T) => number)

  constructor(
    private state: ItemsState<T>,
    options?: ItemsOptions<T>
  ) {
    this.selectId = options?.selectId ?? ((entity: any) => entity.id)
    this.sortComparer = options?.sortComparer ?? false
  }

  getState(): ItemsState<T> {
    return { ...this.state, ids: [...this.state.ids], entities: { ...this.state.entities } }
  }

  getIds(): Array<string | number> {
    return [...this.state.ids]
  }

  getEntities(): Record<string | number, T> {
    return { ...this.state.entities }
  }

  getAll(): T[] {
    return this.state.ids.map(id => this.state.entities[id])
  }

  getTotal(): number {
    return this.state.ids.length
  }

  selectById(id: string | number): T | undefined {
    return this.state.entities[id]
  }

  addOne(entity: T): Items<T> {
    const id = this.selectId(entity)
    if (this.state.entities[id]) {
      return this
    }
    return this.addMany([entity])
  }

  addMany(entities: T[]): Items<T> {
    const newEntities = { ...this.state.entities }
    const newIds = [...this.state.ids]

    for (const entity of entities) {
      const id = this.selectId(entity)
      if (!newEntities[id]) {
        newEntities[id] = entity
        newIds.push(id)
      }
    }

    const sortedIds = this.sortComparer !== false
      ? this.sortIds(newIds, newEntities)
      : newIds

    return new Items({ ids: sortedIds, entities: newEntities }, {
      selectId: this.selectId,
      sortComparer: this.sortComparer
    })
  }

  setOne(entity: T): Items<T> {
    const id = this.selectId(entity)
    const newEntities = { ...this.state.entities, [id]: entity }
    const newIds = this.state.entities[id]
      ? [...this.state.ids]
      : [...this.state.ids, id]

    const sortedIds = this.sortComparer !== false
      ? this.sortIds(newIds, newEntities)
      : newIds

    return new Items({ ids: sortedIds, entities: newEntities }, {
      selectId: this.selectId,
      sortComparer: this.sortComparer
    })
  }

  setMany(entities: T[]): Items<T> {
    const newEntities = { ...this.state.entities }
    const newIds = [...this.state.ids]

    for (const entity of entities) {
      const id = this.selectId(entity)
      newEntities[id] = entity
      if (!this.state.entities[id]) {
        newIds.push(id)
      }
    }

    const sortedIds = this.sortComparer !== false
      ? this.sortIds(newIds, newEntities)
      : newIds

    return new Items({ ids: sortedIds, entities: newEntities }, {
      selectId: this.selectId,
      sortComparer: this.sortComparer
    })
  }

  setAll(entities: T[]): Items<T> {
    const newEntities: Record<string | number, T> = {}
    const newIds: Array<string | number> = []

    for (const entity of entities) {
      const id = this.selectId(entity)
      newEntities[id] = entity
      newIds.push(id)
    }

    const sortedIds = this.sortComparer !== false
      ? this.sortIds(newIds, newEntities)
      : newIds

    return new Items({ ids: sortedIds, entities: newEntities }, {
      selectId: this.selectId,
      sortComparer: this.sortComparer
    })
  }

  updateOne(update: Update<T>): Items<T> {
    return this.updateMany([update])
  }

  updateMany(updates: Update<T>[]): Items<T> {
    const newEntities = { ...this.state.entities }
    let hasChanges = false

    for (const update of updates) {
      const entity = newEntities[update.id]
      if (entity) {
        newEntities[update.id] = { ...entity, ...update.changes }
        hasChanges = true
      }
    }

    if (!hasChanges) {
      return this
    }

    const sortedIds = this.sortComparer !== false
      ? this.sortIds([...this.state.ids], newEntities)
      : [...this.state.ids]

    return new Items({ ids: sortedIds, entities: newEntities }, {
      selectId: this.selectId,
      sortComparer: this.sortComparer
    })
  }

  upsertOne(entity: T): Items<T> {
    return this.upsertMany([entity])
  }

  upsertMany(entities: T[]): Items<T> {
    const newEntities = { ...this.state.entities }
    const newIds = [...this.state.ids]

    for (const entity of entities) {
      const id = this.selectId(entity)
      newEntities[id] = entity
      if (!this.state.entities[id]) {
        newIds.push(id)
      }
    }

    const sortedIds = this.sortComparer !== false
      ? this.sortIds(newIds, newEntities)
      : newIds

    return new Items({ ids: sortedIds, entities: newEntities }, {
      selectId: this.selectId,
      sortComparer: this.sortComparer
    })
  }

  removeOne(id: string | number): Items<T> {
    return this.removeMany([id])
  }

  removeMany(ids: Array<string | number>): Items<T> {
    const idsSet = new Set(ids)
    const newEntities = { ...this.state.entities }
    const newIds = this.state.ids.filter(id => {
      if (idsSet.has(id)) {
        delete newEntities[id]
        return false
      }
      return true
    })

    if (newIds.length === this.state.ids.length) {
      return this
    }

    return new Items({ ids: newIds, entities: newEntities }, {
      selectId: this.selectId,
      sortComparer: this.sortComparer
    })
  }

  removeAll(): Items<T> {
    return new Items({ ids: [], entities: {} }, {
      selectId: this.selectId,
      sortComparer: this.sortComparer
    })
  }

  map<U>(fn: (entity: T, id: string | number) => U): U[] {
    return this.state.ids.map(id => fn(this.state.entities[id], id))
  }

  private sortIds(
    ids: Array<string | number>,
    entities: Record<string | number, T>
  ): Array<string | number> {
    if (this.sortComparer === false) {
      return ids
    }
    const sorter = this.sortComparer
    return [...ids].sort((aId, bId) => {
      const a = entities[aId]
      const b = entities[bId]
      return sorter(a, b)
    })
  }
}

export function createItems<T>(options?: ItemsOptions<T>): Items<T> {
  return new Items({ ids: [], entities: {} }, options)
}

