import type { ItemId } from './types'
import { Items } from './Items'
import { diff} from 'ohash/utils'

export function itemsDiff<E extends Object, I extends ItemId>(fromItems: Items<E, I>, toItems: Items<E, I>) {
  const ids = new Set(toItems.getIds())
  const baseIds = new Set(fromItems.getIds())

  const added: ItemId[] = []
  const updated: any[] = []

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
