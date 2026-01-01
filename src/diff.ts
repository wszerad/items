import { diff } from 'ohash/utils'
import { Items } from './Items'

export interface ItemDiff<I, E> {
  id: I
  changes: ReturnType<typeof diff>
}

export interface ItemsDiff<I, E> {
  added: I[]
  removed: I[]
  updated: ItemDiff<I, E>[]
}

export function itemsDiff<I, E>(fromItems: Items<I, E>, toItems: Items<I, E>): ItemsDiff<I, E> {
  const ids = new Set(toItems.getIds())
  const baseIds = new Set(fromItems.getIds())

  const added: I[] = []
  const updated: ItemDiff<I, E>[] = []

  ids.forEach(id => {
    if (!baseIds.has(id)) {
      added.push(id)
    } else {
      const changes = diff(fromItems.select(id), toItems.select(id))

      if (changes.length > 0) {
        updated.push({ id, changes })
      }

      baseIds.delete(id)
    }
  })

  const removed = [...baseIds]

  return {
    added,
    removed,
    updated
  }
}
