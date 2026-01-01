import { SelectId } from './selectId'
import { Items } from './index'

export type SelectorFn<I, E> = (entity: E) => boolean
export type Selector<I, E> = I | Iterable<I> | SelectorFn<I, E>

function selector<I, E>(condition: Selector<I, E>, selectId: SelectId<I, E>) {
  if (typeof condition === 'function') {
    return (entity: E) => (condition as SelectorFn<I, E>)(entity)
  } else if (['string', 'number'].includes(typeof condition)) {
    return (entity: E) => selectId(entity) === condition
  } else {
    return (entity: E) => Array.from(condition as Iterable<I>).includes(selectId(entity))
  }
}

export type Operation<I, E> = (entity: E | undefined, id: I) => void

export function selectiveOperation<I, E>(items: Items<I, E>, selector: Selector<I, E>, operation: Operation<I, E>) {
  if (typeof selector === 'function') {
    items.getEntities().forEach((entity, id) => {
      if ((selector as SelectorFn<I, E>)(entity)) {
        operation(entity, id)
      }
    })
  } else if (['string', 'number'].includes(typeof selector)) {
    const id = selector as I
    operation(items.selectById(id), id)
  } else {
    Array
      .from(selector as Iterable<I>)
      .forEach(id => operation(items.selectById(id), id))
  }
}
