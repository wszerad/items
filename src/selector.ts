import { Items } from './Items'
import { StrOrNum } from './selectId'

export type SelectorFn<E> = (entity: E) => boolean
export type Selector<E, I> = Iterable<I> | SelectorFn<E>
export type Operation<E, I> = (entity: E | undefined, id: I) => void

export function selector<E, I extends StrOrNum>(items: Items<E, I>, selector: Selector<E, I>, operation: Operation<E, I>) {
  if (typeof selector === 'function') {
    items.getEntities().forEach((entity, id) => {
      if ((selector as SelectorFn<E>)(entity)) {
        operation(entity, id)
      }
    })
  } else {
    Array
      .from(selector as Iterable<I>)
      .forEach(id => operation(items.select(id), id))
  }
}

export function selectorSingle<E, I extends StrOrNum>(items: Items<E, I>, selector: Selector<E, I>) {
  if (typeof selector === 'function') {
    return Array
      .from(items)
      .find((entity, id) => (selector as SelectorFn<E>)(entity))
  } else {
    const id = Array
      .from(selector as Iterable<I>)
      .at(0)
    return items.select(id)
  }
}
