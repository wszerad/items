import type { ItemId } from './types'
export function defaultSelectId<E extends { id: ItemId }>(entity: E): ItemId {
  return entity.id
}
