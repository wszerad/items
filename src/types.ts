import { Select, SingleSelect } from './select'

export type ItemId = string | number

export type CheckFn<E> = (entity: E) => boolean

export type Selector<E> = ((selector: Select<E>) => SingleSelect<E>) | ((selector: Select<E>) => Select<E>) | ItemId | Iterable<ItemId>

export type UpdateFn<E> = (entity: E | undefined) => E

export type Updater<E> = UpdateFn<E> | Partial<E>

export type SelectId<E> = (entity: E) => ItemId

export type ItemsOptions<E> = {
  selectId?: SelectId<E>
  sortComparer?: false | ((a: E, b: E) => number)
}

export interface ItemsState<E, I> {
  ids: I[]
  entities: Map<I, E>
}

export interface ItemDiff {
  id: ItemId
  changes: any[]
}

export interface ItemsDiff {
  added: ItemId[]
  removed: ItemId[]
  updated: ItemDiff[]
}

