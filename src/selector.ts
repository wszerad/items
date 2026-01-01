import { Items } from './Items'

export type SelectorFn<I, E> = (entity: E) => boolean
export type Selector<I, E> = Iterable<I> | SelectorFn<I, E>
export type Operation<I, E> = (entity: E | undefined, id: I) => void

export function selector<I, E>(items: Items<I, E>, selector: Selector<I, E>, operation: Operation<I, E>) {
  if (typeof selector === 'function') {
    items.getEntities().forEach((entity, id) => {
      if ((selector as SelectorFn<I, E>)(entity)) {
        operation(entity, id)
      }
    })
  } else {
    Array
      .from(selector as Iterable<I>)
      .forEach(id => operation(items.select(id), id))
  }
}
