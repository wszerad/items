import { Items } from './Items'
import { Idable } from './selectId'

export type SelectorFn<E, I> = (entity: E) => boolean
export type Selector<E, I> = Iterable<I> | SelectorFn<E, I>
export type Operation<E, I> = (entity: E | undefined, id: I) => void

export function selector<E, I extends Idable>(items: Items<E, I>, selector: Selector<E, I>, operation: Operation<E, I>) {
  if (typeof selector === 'function') {
    items.getEntities().forEach((entity, id) => {
      if ((selector as SelectorFn<E, I>)(entity)) {
        operation(entity, id)
      }
    })
  } else {
    Array
      .from(selector as Iterable<I>)
      .forEach(id => operation(items.select(id), id))
  }
}
