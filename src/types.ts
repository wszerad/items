import { Select, SingleSelect } from './select'

export type ItemId = string | number

export type CheckFn<E> = (entity: E) => boolean

export type TestFn<E> = (entry: E) => boolean

export type MatchFn<E, T> = (entity: T, existing: E) => boolean

export type SelectorSelect<E, EE, SE> =  (selector: Select<E, unknown>) => Select<EE, SE>

export type SelectorSelectSingle<E, EE, SE> = (selector: Select<E, unknown>) => SingleSelect<EE, SE>

export type SelectorChain<E, EE, SE> = SelectorSelect<E, EE, SE> | SelectorSelectSingle<E, EE, SE>

export type Selector<E, EE, I extends ItemId, SE = E> = SelectorChain<E, EE, SE> | I | Iterable<I>

export type UpdateFn<E, EE, SE> = (entity: EE, match?: SE) => E

export type Updater<E, EE, SE = E> = UpdateFn<E, EE, SE> | Partial<E>

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

