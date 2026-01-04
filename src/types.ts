import { Select, SingleSelect } from './select'

export type ItemId = string | number

export type CheckFn<E> = (entity: E) => boolean

export type TestFn<E> = (entry: E) => boolean

export type MatchFn<E, T> = (entity: T, existing: E) => boolean

export type Selector<E extends Object, I extends ItemId, SE = E, ST extends E | undefined = E> = ((selector: Select<E, I, SE, ST>) => SingleSelect<E, I, SE, ST>) | ((selector: Select<E, I, SE, ST>) => Select<E, I, SE, ST>) | I | Iterable<I>

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

