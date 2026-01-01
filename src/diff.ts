import { diff } from 'ohash/utils'
import { Items } from './Items'
import { Idable } from './selectId'

export interface ItemDiff<I> {
  id: I
  changes: ReturnType<typeof diff>
}

export interface ItemsDiff<I> {
  added: I[]
  removed: I[]
  updated: ItemDiff<I>[]
}

export function itemsDiff<E, I extends Idable>(fromItems: Items<E, I>, toItems: Items<E, I>): ItemsDiff<I> {
  const ids = new Set(toItems.getIds())
  const baseIds = new Set(fromItems.getIds())

  const added: I[] = []
  const updated: ItemDiff<I>[] = []

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
